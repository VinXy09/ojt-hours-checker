// ============================================
// OJT Hours Counter - Google Apps Script Backend
// ============================================

// Configuration - Replace with your Sheet ID
const SHEET_ID = '1IRBc7FyGjq4XSOE25m-N2iZj9by9z7Jdi3zIzVA4pPY';
const SHEET_NAMES = {
  USERS: 'Users',
  STUDENTS: 'Students',
  DAILY_RECORDS: 'DailyRecords',
  WEEKLY_REPORTS: 'WeeklyReports'
};

// JWT Secret (in production, use PropertiesService)
const JWT_SECRET = 'ojt-hours-counter-secret-key-2024';

// ============================================
// Sheet Access Functions
// ============================================

function getSheet(sheetName) {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(sheetName);
}

function getAllData(sheetName) {
  const sheet = getSheet(sheetName);
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  return sheet.getDataRange().getValues();
}

function getDataWithHeader(sheetName) {
  const data = getAllData(sheetName);
  if (data.length < 2) return { headers: [], data: [] };
  const headers = data[0];
  const rows = data.slice(1);
  return { headers, data: rows };
}

function findRow(sheetName, columnIndex, value) {
  const data = getAllData(sheetName);
  for (let i = 1; i < data.length; i++) {
    if (data[i][columnIndex] == value) {
      return { row: i + 1, data: data[i] };
    }
  }
  return null;
}

function findRowByColumn(sheetName, columnName, value) {
  const { headers, data } = getDataWithHeader(sheetName);
  const colIndex = headers.indexOf(columnName);
  if (colIndex === -1) return null;
  
  for (let i = 0; i < data.length; i++) {
    if (data[i][colIndex] == value) {
      return { row: i + 2, data: data[i] };
    }
  }
  return null;
}

function appendRow(sheetName, values) {
  const sheet = getSheet(sheetName);
  sheet.appendRow(values);
  return sheet.getLastRow();
}

function updateRow(sheetName, rowIndex, values) {
  const sheet = getSheet(sheetName);
  sheet.getRange(rowIndex, 1, 1, values.length).setValues([values]);
}

function deleteRow(sheetName, rowIndex) {
  const sheet = getSheet(sheetName);
  sheet.deleteRow(rowIndex);
}

function getNextId(sheetName) {
  const data = getAllData(sheetName);
  if (data.length <= 1) return 1;
  const idCol = data[0][0] === 'id' ? 0 : -1;
  if (idCol === -1) return 1;
  
  let maxId = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] > maxId) maxId = data[i][idCol];
  }
  return maxId + 1;
}

// ============================================
// Simple JWT-like Token Functions
// ============================================

function createToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };
  const encoded = Utilities.base64Encode(JSON.stringify(payload));
  return encoded;
}

function verifyToken(token) {
  try {
    const decoded = JSON.parse(Utilities.base64Decode(token));
    if (decoded.exp < Date.now()) {
      return null;
    }
    return decoded;
  } catch (e) {
    return null;
  }
}

function hashPassword(password) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password));
}

function comparePassword(password, hash) {
  return hashPassword(password) === hash;
}

// ============================================
// API Handler
// ============================================

function doPost(e) {
  return handleRequest(e);
}

function doGet(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const params = e.parameter;
  const path = params.action || params.path || '';
  const headers = e.headers || {};
  const authToken = headers.authorization?.replace('Bearer ', '') || params.token;
  
  let user = null;
  if (authToken) {
    user = verifyToken(authToken);
  }
  
  let result;
  let status = 200;
  
  try {
    // Auth Routes
    if (path === 'auth/login') {
      result = handleLogin(JSON.parse(e.postData.contents));
    } else if (path === 'auth/register') {
      result = handleRegister(JSON.parse(e.postData.contents));
    } else if (path === 'auth/me') {
      if (!user) {
        status = 401;
        result = { message: 'Unauthorized' };
      } else {
        result = handleGetCurrentUser(user);
      }
    }
    // Student Routes
    else if (path === 'students') {
      if (!user) {
        status = 401;
        result = { message: 'Unauthorized' };
      } else {
        result = handleGetStudents(user);
      }
    } else if (path === 'students/user/' + params.userId) {
      if (!user) {
        status = 401;
        result = { message: 'Unauthorized' };
      } else {
        result = handleGetStudentByUserId(params.userId);
      }
    } else if (path === 'students/progress/' + params.studentId) {
      if (!user) {
        status = 401;
        result = { message: 'Unauthorized' };
      } else {
        result = handleGetStudentProgress(params.studentId);
      }
    } else if (path.startsWith('students/') && path.endsWith('/records')) {
      const studentId = path.split('/')[1];
      if (!user) {
        status = 401;
        result = { message: 'Unauthorized' };
      } else {
        result = handleGetStudentRecords(studentId);
      }
    } else if (path.startsWith('students/') && e.postData) {
      const studentId = path.split('/')[1];
      if (!user) {
        status = 401;
        result = { message: 'Unauthorized' };
      } else {
        result = handleUpdateStudent(studentId, JSON.parse(e.postData.contents), user);
      }
    }
    // Daily Records Routes
    else if (path === 'daily-records') {
      if (!user) {
        status = 401;
        result = { message: 'Unauthorized' };
      } else {
        result = handleCreateDailyRecord(JSON.parse(e.postData.contents), user);
      }
    } else if (path === 'daily-records/all') {
      if (!user || !['supervisor', 'admin'].includes(user.role)) {
        status = 403;
        result = { message: 'Forbidden' };
      } else {
        result = handleGetAllDailyRecords();
      }
    } else if (path === 'daily-records/pending') {
      if (!user || !['supervisor', 'admin'].includes(user.role)) {
        status = 403;
        result = { message: 'Forbidden' };
      } else {
        result = handleGetPendingApprovals();
      }
    } else if (path.startsWith('daily-records/student/') && path.includes('/total')) {
      const studentId = path.split('/')[2];
      if (!user) {
        status = 401;
        result = { message: 'Unauthorized' };
      } else {
        result = handleGetTotalHours(studentId);
      }
    } else if (path.startsWith('daily-records/student/')) {
      const studentId = path.split('/')[2];
      if (!user) {
        status = 401;
        result = { message: 'Unauthorized' };
      } else {
        result = handleGetDailyRecordsByStudent(studentId, params.startDate, params.endDate);
      }
    } else if (path.startsWith('daily-records/') && path.endsWith('/approve')) {
      const id = path.split('/')[1];
      if (!user || !['supervisor', 'admin'].includes(user.role)) {
        status = 403;
        result = { message: 'Forbidden' };
      } else {
        result = handleApproveDailyRecord(id, user.id);
      }
    } else if (path.startsWith('daily-records/') && e.postData) {
      const id = path.split('/')[1];
      if (!user) {
        status = 401;
        result = { message: 'Unauthorized' };
      } else {
        result = handleUpdateDailyRecord(id, JSON.parse(e.postData.contents), user);
      }
    } else if (path.startsWith('daily-records/') && e.method === 'DELETE') {
      const id = path.split('/')[1];
      if (!user) {
        status = 401;
        result = { message: 'Unauthorized' };
      } else {
        result = handleDeleteDailyRecord(id, user);
      }
    }
    // Weekly Reports Routes
    else if (path === 'weekly-reports') {
      if (!user) {
        status = 401;
        result = { message: 'Unauthorized' };
      } else {
        result = handleCreateWeeklyReport(JSON.parse(e.postData.contents), user);
      }
    } else if (path === 'weekly-reports/all') {
      if (!user || !['supervisor', 'admin'].includes(user.role)) {
        status = 403;
        result = { message: 'Forbidden' };
      } else {
        result = handleGetAllWeeklyReports();
      }
    } else if (path.startsWith('weekly-reports/student/')) {
      const studentId = path.split('/')[2];
      if (!user) {
        status = 401;
        result = { message: 'Unauthorized' };
      } else {
        result = handleGetWeeklyReportsByStudent(studentId);
      }
    } else if (path.startsWith('weekly-reports/generate')) {
      if (!user) {
        status = 401;
        result = { message: 'Unauthorized' };
      } else {
        result = handleGenerateWeeklyReport(params.studentId, params.weekStartDate, params.weekEndDate);
      }
    } else if (path.startsWith('weekly-reports/print')) {
      if (!user) {
        status = 401;
        result = { message: 'Unauthorized' };
      } else {
        result = handleGetWeeklyReportForPrint(params.studentId, params.weekStartDate, params.weekEndDate);
      }
    } else if (path.startsWith('weekly-reports/') && path.endsWith('/submit')) {
      const id = path.split('/')[1];
      if (!user) {
        status = 401;
        result = { message: 'Unauthorized' };
      } else {
        result = handleSubmitWeeklyReport(id);
      }
    } else if (path.startsWith('weekly-reports/') && path.endsWith('/approve')) {
      const id = path.split('/')[1];
      if (!user || !['supervisor', 'admin'].includes(user.role)) {
        status = 403;
        result = { message: 'Forbidden' };
      } else {
        result = handleApproveWeeklyReport(id);
      }
    } else if (path.startsWith('weekly-reports/') && !path.includes('/')) {
      const id = path.split('/')[1];
      if (!user) {
        status = 401;
        result = { message: 'Unauthorized' };
      } else {
        result = handleGetWeeklyReportById(id);
      }
    }
    // Health Check
    else if (path === 'health') {
      result = { status: 'OK', message: 'OJT Hours Counter API is running' };
    }
    else {
      status = 404;
      result = { message: 'Endpoint not found: ' + path };
    }
  } catch (error) {
    status = 500;
    result = { message: 'Server error: ' + error.message };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON)
    .setStatusCode(status);
}

// ============================================
// Auth Handlers
// ============================================

function handleLogin(body) {
  const { email, password } = body;
  
  const userRow = findRowByColumn(SHEET_NAMES.USERS, 'email', email);
  if (!userRow) {
    return { message: 'Invalid credentials' };
  }
  
  const headers = getDataWithHeader(SHEET_NAMES.USERS).headers;
  const user = {};
  headers.forEach((h, i) => user[h] = userRow.data[i]);
  
  if (!comparePassword(password, user.password)) {
    return { message: 'Invalid credentials' };
  }
  
  const token = createToken(user);
  
  let studentProfile = null;
  if (user.role === 'student') {
    const studentRow = findRowByColumn(SHEET_NAMES.STUDENTS, 'user_id', user.id);
    if (studentRow) {
      const studentHeaders = getDataWithHeader(SHEET_NAMES.STUDENTS).headers;
      studentProfile = {};
      studentHeaders.forEach((h, i) => studentProfile[h] = studentRow.data[i]);
    }
  }
  
  return {
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    studentProfile
  };
}

function handleRegister(body) {
  const { username, email, password, fullName, studentId, department } = body;
  
  // Check if user exists
  const existingUser = findRowByColumn(SHEET_NAMES.USERS, 'email', email);
  if (existingUser) {
    return { message: 'User already exists with this email' };
  }
  
  const userId = getNextId(SHEET_NAMES.USERS);
  const hashedPassword = hashPassword(password);
  const createdAt = new Date().toISOString();
  
  // Create user
  appendRow(SHEET_NAMES.USERS, [userId, username, email, hashedPassword, 'student', createdAt]);
  
  // Create student profile
  const studentIdNum = getNextId(SHEET_NAMES.STUDENTS);
  appendRow(SHEET_NAMES.STUDENTS, [studentIdNum, userId, fullName, studentId, department, 0, 600, createdAt]);
  
  const token = createToken({
    id: userId,
    username,
    email,
    role: 'student'
  });
  
  return {
    message: 'User registered successfully',
    token,
    user: {
      id: userId,
      username,
      email,
      role: 'student'
    }
  };
}

function handleGetCurrentUser(user) {
  const userRow = findRowByColumn(SHEET_NAMES.USERS, 'id', user.id);
  if (!userRow) {
    return { message: 'User not found' };
  }
  
  const headers = getDataWithHeader(SHEET_NAMES.USERS).headers;
  const userData = {};
  headers.forEach((h, i) => userData[h] = userRow.data[i]);
  
  let studentProfile = null;
  if (userData.role === 'student') {
    const studentRow = findRowByColumn(SHEET_NAMES.STUDENTS, 'user_id', user.id);
    if (studentRow) {
      const studentHeaders = getDataWithHeader(SHEET_NAMES.STUDENTS).headers;
      studentProfile = {};
      studentHeaders.forEach((h, i) => studentProfile[h] = studentRow.data[i]);
    }
  }
  
  return {
    id: userData.id,
    username: userData.username,
    email: userData.email,
    role: userData.role,
    studentProfile
  };
}

// ============================================
// Student Handlers
// ============================================

function handleGetStudents(user) {
  if (!['supervisor', 'admin'].includes(user.role)) {
    return { message: 'Forbidden' };
  }
  
  const { headers, data } = getDataWithHeader(SHEET_NAMES.STUDENTS);
  const usersData = getDataWithHeader(SHEET_NAMES.USERS);
  
  const students = data.map(row => {
    const student = {};
    headers.forEach((h, i) => student[h] = row[i]);
    
    const userRow = findRowByColumn(SHEET_NAMES.USERS, 'id', student.user_id);
    if (userRow) {
      const userHeaders = usersData.headers;
      userHeaders.forEach((h, i) => {
        if (h === 'username' || h === 'email') {
          student[h] = userRow.data[i];
        }
      });
    }
    return student;
  });
  
  return students;
}

function handleGetStudentByUserId(userId) {
  const studentRow = findRowByColumn(SHEET_NAMES.STUDENTS, 'user_id', userId);
  if (!studentRow) {
    return { message: 'Student not found' };
  }
  
  const headers = getDataWithHeader(SHEET_NAMES.STUDENTS).headers;
  const student = {};
  headers.forEach((h, i) => student[h] = studentRow.data[i]);
  
  return student;
}

function handleGetStudentProgress(studentId) {
  const studentRow = findRowByColumn(SHEET_NAMES.STUDENTS, 'id', studentId);
  if (!studentRow) {
    return { message: 'Student not found' };
  }
  
  const headers = getDataWithHeader(SHEET_NAMES.STUDENTS).headers;
  const student = {};
  headers.forEach((h, i) => student[h] = studentRow.data[i]);
  
  const progressPercentage = (student.total_hours / student.target_hours) * 100;
  
  return {
    full_name: student.full_name,
    student_id: student.student_id,
    department: student.department,
    total_hours: student.total_hours,
    target_hours: student.target_hours,
    progress_percentage: progressPercentage
  };
}

function handleGetStudentRecords(studentId) {
  const { headers, data } = getDataWithHeader(SHEET_NAMES.DAILY_RECORDS);
  const colIndex = headers.indexOf('student_id');
  
  const records = data.filter(row => row[colIndex] == studentId).map(row => {
    const record = {};
    headers.forEach((h, i) => record[h] = row[i]);
    return record;
  });
  
  return records;
}

function handleUpdateStudent(studentId, body, user) {
  const studentRow = findRowByColumn(SHEET_NAMES.STUDENTS, 'id', studentId);
  if (!studentRow) {
    return { message: 'Student not found' };
  }
  
  if (user.role !== 'admin' && user.role !== 'student') {
    return { message: 'Forbidden' };
  }
  
  const headers = getDataWithHeader(SHEET_NAMES.STUDENTS).headers;
  const currentData = {};
  headers.forEach((h, i) => currentData[h] = studentRow.data[i]);
  
  // Only allow students to update their own data
  if (user.role === 'student' && currentData.user_id != user.id) {
    return { message: 'Forbidden' };
  }
  
  const updatedData = {
    full_name: body.fullName || currentData.full_name,
    student_id: body.studentIdNum || currentData.student_id,
    department: body.department || currentData.department
  };
  
  const updatedRow = [
    currentData.id,
    currentData.user_id,
    updatedData.full_name,
    updatedData.student_id,
    updatedData.department,
    currentData.total_hours,
    currentData.target_hours,
    currentData.created_at
  ];
  
  updateRow(SHEET_NAMES.STUDENTS, studentRow.row, updatedRow);
  
  return { message: 'Student updated successfully' };
}

// ============================================
// Daily Record Handlers
// ============================================

function calculateHoursWorked(timeIn, timeOut) {
  const [inHour, inMin] = timeIn.split(':').map(Number);
  const [outHour, outMin] = timeOut.split(':').map(Number);
  
  const inMinutes = inHour * 60 + inMin;
  const outMinutes = outHour * 60 + outMin;
  
  let diff = outMinutes - inMinutes;
  if (diff >= 480) { // 8 hours = 480 minutes
    diff -= 60; // Subtract 1 hour lunch
  }
  
  return Math.max(0, diff / 60);
}

function handleCreateDailyRecord(body, user) {
  const { studentId, date, timeIn, timeOut, taskDescription } = body;
  
  // Get student to verify ownership
  const studentRow = findRowByColumn(SHEET_NAMES.STUDENTS, 'id', studentId);
  if (!studentRow) {
    return { message: 'Student not found' };
  }
  
  // Verify student owns this record (or is admin/supervisor)
  const headers = getDataWithHeader(SHEET_NAMES.STUDENTS).headers;
  const student = {};
  headers.forEach((h, i) => student[h] = studentRow.data[i]);
  
  if (user.role === 'student' && student.user_id != user.id) {
    return { message: 'Forbidden' };
  }
  
  const id = getNextId(SHEET_NAMES.DAILY_RECORDS);
  const hoursWorked = calculateHoursWorked(timeIn, timeOut);
  const createdAt = new Date().toISOString();
  
  appendRow(SHEET_NAMES.DAILY_RECORDS, [
    id, studentId, date, timeIn, timeOut, hoursWorked, taskDescription, false, null, createdAt
  ]);
  
  return { message: 'Daily record created successfully', id };
}

function handleGetAllDailyRecords() {
  const { headers, data } = getDataWithHeader(SHEET_NAMES.DAILY_RECORDS);
  const studentHeaders = getDataWithHeader(SHEET_NAMES.STUDENTS).headers;
  
  const records = data.map(row => {
    const record = {};
    headers.forEach((h, i) => record[h] = row[i]);
    
    const studentRow = findRowByColumn(SHEET_NAMES.STUDENTS, 'id', record.student_id);
    if (studentRow) {
      studentHeaders.forEach((h, i) => {
        if (h === 'full_name' || h === 'student_id') {
          record[h] = studentRow.data[i];
        }
      });
    }
    return record;
  });
  
  return records;
}

function handleGetPendingApprovals() {
  const { headers, data } = getDataWithHeader(SHEET_NAMES.DAILY_RECORDS);
  const approvedIndex = headers.indexOf('supervisor_approval');
  const studentHeaders = getDataWithHeader(SHEET_NAMES.STUDENTS).headers;
  
  const records = data.filter(row => row[approvedIndex] === false).map(row => {
    const record = {};
    headers.forEach((h, i) => record[h] = row[i]);
    
    const studentRow = findRowByColumn(SHEET_NAMES.STUDENTS, 'id', record.student_id);
    if (studentRow) {
      studentHeaders.forEach((h, i) => {
        if (h === 'full_name' || h === 'student_id') {
          record[h] = studentRow.data[i];
        }
      });
    }
    return record;
  });
  
  return records;
}

function handleGetDailyRecordsByStudent(studentId, startDate, endDate) {
  const { headers, data } = getDataWithHeader(SHEET_NAMES.DAILY_RECORDS);
  const studentIdCol = headers.indexOf('id') !== -1 ? headers.indexOf('id') : 0;
  const dateCol = headers.indexOf('date');
  
  let records = data.filter(row => row[2] == studentId); // student_id is column 2
  
  if (startDate && endDate) {
    records = records.filter(row => row[dateCol] >= startDate && row[dateCol] <= endDate);
  }
  
  return records.map(row => {
    const record = {};
    headers.forEach((h, i) => record[h] = row[i]);
    return record;
  });
}

function handleGetTotalHours(studentId) {
  const { headers, data } = getDataWithHeader(SHEET_NAMES.DAILY_RECORDS);
  const studentCol = headers.indexOf('student_id');
  const approvedCol = headers.indexOf('supervisor_approval');
  const hoursCol = headers.indexOf('hours_worked');
  
  let total = 0;
  data.forEach(row => {
    if (row[studentCol] == studentId && row[approvedCol] === true) {
      total += parseFloat(row[hoursCol] || 0);
    }
  });
  
  return { total };
}

function handleApproveDailyRecord(id, approverId) {
  const recordRow = findRowByColumn(SHEET_NAMES.DAILY_RECORDS, 'id', id);
  if (!recordRow) {
    return { message: 'Record not found' };
  }
  
  const headers = getDataWithHeader(SHEET_NAMES.DAILY_RECORDS).headers;
  const currentData = {};
  headers.forEach((h, i) => currentData[h] = recordRow.data[i]);
  
  const updatedRow = [
    currentData.id,
    currentData.student_id,
    currentData.date,
    currentData.time_in,
    currentData.time_out,
    currentData.hours_worked,
    currentData.task_description,
    true, // approved
    approverId,
    currentData.created_at
  ];
  
  updateRow(SHEET_NAMES.DAILY_RECORDS, recordRow.row, updatedRow);
  
  // Update student total hours
  updateStudentTotalHours(currentData.student_id);
  
  return { message: 'Record approved successfully' };
}

function updateStudentTotalHours(studentId) {
  const { headers, data } = getDataWithHeader(SHEET_NAMES.DAILY_RECORDS);
  const studentCol = headers.indexOf('student_id');
  const approvedCol = headers.indexOf('supervisor_approval');
  const hoursCol = headers.indexOf('hours_worked');
  
  let total = 0;
  data.forEach(row => {
    if (row[studentCol] == studentId && row[approvedCol] === true) {
      total += parseFloat(row[hoursCol] || 0);
    }
  });
  
  const studentRow = findRowByColumn(SHEET_NAMES.STUDENTS, 'id', studentId);
  if (studentRow) {
    const studentHeaders = getDataWithHeader(SHEET_NAMES.STUDENTS).headers;
    const currentData = {};
    studentHeaders.forEach((h, i) => currentData[h] = studentRow.data[i]);
    
    const updatedRow = [
      currentData.id,
      currentData.user_id,
      currentData.full_name,
      currentData.student_id,
      currentData.department,
      total,
      currentData.target_hours,
      currentData.created_at
    ];
    
    updateRow(SHEET_NAMES.STUDENTS, studentRow.row, updatedRow);
  }
}

function handleUpdateDailyRecord(id, body, user) {
  const recordRow = findRowByColumn(SHEET_NAMES.DAILY_RECORDS, 'id', id);
  if (!recordRow) {
    return { message: 'Record not found' };
  }
  
  const headers = getDataWithHeader(SHEET_NAMES.DAILY_RECORDS).headers;
  const currentData = {};
  headers.forEach((h, i) => currentData[h] = recordRow.data[i]);
  
  // Verify ownership
  const studentRow = findRowByColumn(SHEET_NAMES.STUDENTS, 'id', currentData.student_id);
  if (studentRow && user.role === 'student') {
    const studentHeaders = getDataWithHeader(SHEET_NAMES.STUDENTS).headers;
    const student = {};
    studentHeaders.forEach((h, i) => student[h] = studentRow.data[i]);
    
    if (student.user_id != user.id) {
      return { message: 'Forbidden' };
    }
  }
  
  const hoursWorked = calculateHoursWorked(body.timeIn || currentData.time_in, body.timeOut || currentData.time_out);
  
  const updatedRow = [
    currentData.id,
    currentData.student_id,
    body.date || currentData.date,
    body.timeIn || currentData.time_in,
    body.timeOut || currentData.time_out,
    hoursWorked,
    body.taskDescription || currentData.task_description,
    false, // Reset approval status
    null,
    currentData.created_at
  ];
  
  updateRow(SHEET_NAMES.DAILY_RECORDS, recordRow.row, updatedRow);
  
  return { message: 'Daily record updated successfully' };
}

function handleDeleteDailyRecord(id, user) {
  const recordRow = findRowByColumn(SHEET_NAMES.DAILY_RECORDS, 'id', id);
  if (!recordRow) {
    return { message: 'Record not found' };
  }
  
  const headers = getDataWithHeader(SHEET_NAMES.DAILY_RECORDS).headers;
  const currentData = {};
  headers.forEach((h, i) => currentData[h] = recordRow.data[i]);
  
  // Verify ownership
  const studentRow = findRowByColumn(SHEET_NAMES.STUDENTS, 'id', currentData.student_id);
  if (studentRow && user.role === 'student') {
    const studentHeaders = getDataWithHeader(SHEET_NAMES.STUDENTS).headers;
    const student = {};
    studentHeaders.forEach((h, i) => student[h] = studentRow.data[i]);
    
    if (student.user_id != user.id) {
      return { message: 'Forbidden' };
    }
  }
  
  deleteRow(SHEET_NAMES.DAILY_RECORDS, recordRow.row);
  
  return { message: 'Daily record deleted successfully' };
}

// ============================================
// Weekly Report Handlers
// ============================================

function handleCreateWeeklyReport(body, user) {
  const { studentId, weekStartDate, weekEndDate, summary } = body;
  
  // Calculate total hours from daily records
  const { headers, data } = getDataWithHeader(SHEET_NAMES.DAILY_RECORDS);
  const studentCol = headers.indexOf('student_id');
  const dateCol = headers.indexOf('date');
  const hoursCol = headers.indexOf('hours_worked');
  const approvedCol = headers.indexOf('supervisor_approval');
  
  let totalHours = 0;
  data.forEach(row => {
    if (row[studentCol] == studentId && 
        row[dateCol] >= weekStartDate && 
        row[dateCol] <= weekEndDate &&
        row[approvedCol] === true) {
      totalHours += parseFloat(row[hoursCol] || 0);
    }
  });
  
  const id = getNextId(SHEET_NAMES.WEEKLY_REPORTS);
  const createdAt = new Date().toISOString();
  
  appendRow(SHEET_NAMES.WEEKLY_REPORTS, [
    id, studentId, weekStartDate, weekEndDate, totalHours, summary, 'draft', createdAt
  ]);
  
  return { message: 'Weekly report created successfully', id, totalHours };
}

function handleGetAllWeeklyReports() {
  const { headers, data } = getDataWithHeader(SHEET_NAMES.WEEKLY_REPORTS);
  const studentHeaders = getDataWithHeader(SHEET_NAMES.STUDENTS).headers;
  
  return data.map(row => {
    const report = {};
    headers.forEach((h, i) => report[h] = row[i]);
    
    const studentRow = findRowByColumn(SHEET_NAMES.STUDENTS, 'id', report.student_id);
    if (studentRow) {
      studentHeaders.forEach((h, i) => {
        if (h === 'full_name' || h === 'student_id') {
          report[h] = studentRow.data[i];
        }
      });
    }
    return report;
  });
}

function handleGetWeeklyReportsByStudent(studentId) {
  const { headers, data } = getDataWithHeader(SHEET_NAMES.WEEKLY_REPORTS);
  const studentCol = headers.indexOf('student_id');
  
  return data.filter(row => row[studentCol] == studentId).map(row => {
    const report = {};
    headers.forEach((h, i) => report[h] = row[i]);
    return report;
  });
}

function handleGetWeeklyReportById(id) {
  const reportRow = findRowByColumn(SHEET_NAMES.WEEKLY_REPORTS, 'id', id);
  if (!reportRow) {
    return { message: 'Report not found' };
  }
  
  const headers = getDataWithHeader(SHEET_NAMES.WEEKLY_REPORTS).headers;
  const report = {};
  headers.forEach((h, i) => report[h] = reportRow.data[i]);
  
  return report;
}

function handleGenerateWeeklyReport(studentId, weekStartDate, weekEndDate) {
  const { headers, data } = getDataWithHeader(SHEET_NAMES.DAILY_RECORDS);
  const studentCol = headers.indexOf('student_id');
  const dateCol = headers.indexOf('date');
  const hoursCol = headers.indexOf('hours_worked');
  const taskCol = headers.indexOf('task_description');
  const approvedCol = headers.indexOf('supervisor_approval');
  
  let totalHours = 0;
  let tasks = [];
  
  data.forEach(row => {
    if (row[studentCol] == studentId && 
        row[dateCol] >= weekStartDate && 
        row[dateCol] <= weekEndDate &&
        row[approvedCol] === true) {
      totalHours += parseFloat(row[hoursCol] || 0);
      if (row[taskCol]) {
        tasks.push(row[taskCol]);
      }
    }
  });
  
  return {
    totalHours,
    tasks: tasks.join('; ')
  };
}

function handleGetWeeklyReportForPrint(studentId, weekStartDate, weekEndDate) {
  const { headers, data } = getDataWithHeader(SHEET_NAMES.DAILY_RECORDS);
  const studentCol = headers.indexOf('student_id');
  const dateCol = headers.indexOf('date');
  const hoursCol = headers.indexOf('hours_worked');
  const taskCol = headers.indexOf('task_description');
  const approvedCol = headers.indexOf('supervisor_approval');
  
  let totalHours = 0;
  let tasks = [];
  const records = [];
  
  data.forEach(row => {
    if (row[studentCol] == studentId && 
        row[dateCol] >= weekStartDate && 
        row[dateCol] <= weekEndDate &&
        row[approvedCol] === true) {
      totalHours += parseFloat(row[hoursCol] || 0);
      if (row[taskCol]) {
        tasks.push(row[taskCol]);
      }
      records.push({
        date: row[dateCol],
        time_in: row[headers.indexOf('time_in')],
        time_out: row[headers.indexOf('time_out')],
        hours_worked: row[hoursCol],
        task_description: row[taskCol]
      });
    }
  });
  
  const studentRow = findRowByColumn(SHEET_NAMES.STUDENTS, 'id', studentId);
  let student = {};
  if (studentRow) {
    const studentHeaders = getDataWithHeader(SHEET_NAMES.STUDENTS).headers;
    studentHeaders.forEach((h, i) => student[h] = studentRow.data[i]);
  }
  
  return {
    student,
    weekStartDate,
    weekEndDate,
    totalHours,
    summary: tasks.join('; '),
    records
  };
}

function handleSubmitWeeklyReport(id) {
  const reportRow = findRowByColumn(SHEET_NAMES.WEEKLY_REPORTS, 'id', id);
  if (!reportRow) {
    return { message: 'Report not found' };
  }
  
  const headers = getDataWithHeader(SHEET_NAMES.WEEKLY_REPORTS).headers;
  const currentData = {};
  headers.forEach((h, i) => currentData[h] = reportRow.data[i]);
  
  const updatedRow = [
    currentData.id,
    currentData.student_id,
    currentData.week_start_date,
    currentData.week_end_date,
    currentData.total_hours,
    currentData.summary,
    'submitted',
    currentData.created_at
  ];
  
  updateRow(SHEET_NAMES.WEEKLY_REPORTS, reportRow.row, updatedRow);
  
  return { message: 'Weekly report submitted successfully' };
}

function handleApproveWeeklyReport(id) {
  const reportRow = findRowByColumn(SHEET_NAMES.WEEKLY_REPORTS, 'id', id);
  if (!reportRow) {
    return { message: 'Report not found' };
  }
  
  const headers = getDataWithHeader(SHEET_NAMES.WEEKLY_REPORTS).headers;
  const currentData = {};
  headers.forEach((h, i) => currentData[h] = reportRow.data[i]);
  
  const updatedRow = [
    currentData.id,
    currentData.student_id,
    currentData.week_start_date,
    currentData.week_end_date,
    currentData.total_hours,
    currentData.summary,
    'approved',
    currentData.created_at
  ];
  
  updateRow(SHEET_NAMES.WEEKLY_REPORTS, reportRow.row, updatedRow);
  
  return { message: 'Weekly report approved successfully' };
}

// ============================================
// Web App Configuration
// ============================================

function webApp() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('OJT Hours Counter API')
    .setCacheDuration(0);
}
