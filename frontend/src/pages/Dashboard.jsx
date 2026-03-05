import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentAPI, dailyRecordAPI, weeklyReportAPI, excelAPI } from '../services/api';
import * as XLSX from 'xlsx';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [studentProfile, setStudentProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [reports, setReports] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Multiple tasks format for new record
  const [newRecord, setNewRecord] = useState({
    date: '',
    tasks: [{ timeIn: '', timeOut: '', taskDescription: '' }]
  });
  
  const [editRecord, setEditRecord] = useState({
    date: '',
    timeIn: '',
    timeOut: '',
    taskDescription: ''
  });
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Calendar state - real-time month navigation
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Month summary state
  const [showMonthSummary, setShowMonthSummary] = useState(false);
  
  // Week grouping state - track which weeks are expanded
  const [expandedWeeks, setExpandedWeeks] = useState({});

  // Group records by week
  const getRecordsByWeek = () => {
    const weeks = {};
    records.forEach(record => {
      const date = new Date(record.date);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date);
      monday.setDate(diff);
      
      const weekKey = monday.toISOString().split('T')[0];
      if (!weeks[weekKey]) {
        weeks[weekKey] = {
          monday: monday,
          friday: new Date(monday),
          records: [],
          totalHours: 0,
          approvedHours: 0
        };
        weeks[weekKey].friday.setDate(monday.getDate() + 4);
      }
      weeks[weekKey].records.push(record);
      weeks[weekKey].totalHours += parseFloat(record.hours_worked || 0);
      if (record.supervisor_approval) {
        weeks[weekKey].approvedHours += parseFloat(record.hours_worked || 0);
      }
    });
    return Object.values(weeks).sort((a, b) => b.monday - a.monday);
  };

  const toggleWeek = (weekKey) => {
    setExpandedWeeks(prev => ({
      ...prev,
      [weekKey]: !prev[weekKey]
    }));
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      if (user) {
        if (user.studentProfile) {
          setStudentProfile(user.studentProfile);
          const recordsRes = await studentAPI.getDailyRecords(user.studentProfile.id);
          setRecords(recordsRes.data);
          const reportsRes = await weeklyReportAPI.getByStudent(user.studentProfile.id);
          setReports(reportsRes.data);
        } else {
          const profileRes = await studentAPI.getByUserId(user.id);
          setStudentProfile(profileRes.data);
          if (profileRes.data) {
            const recordsRes = await studentAPI.getDailyRecords(profileRes.data.id);
            setRecords(recordsRes.data);
            const reportsRes = await weeklyReportAPI.getByStudent(profileRes.data.id);
            setReports(reportsRes.data);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add another task slot
  const addTaskSlot = () => {
    setNewRecord(prev => ({
      ...prev,
      tasks: [...prev.tasks, { timeIn: '', timeOut: '', taskDescription: '' }]
    }));
  };
  
  // Remove a task slot
  const removeTaskSlot = (index) => {
    if (newRecord.tasks.length > 1) {
      setNewRecord(prev => ({
        ...prev,
        tasks: prev.tasks.filter((_, i) => i !== index)
      }));
    }
  };
  
  // Update a specific task field
  const updateTask = (index, field, value) => {
    const updatedTasks = [...newRecord.tasks];
    updatedTasks[index][field] = value;
    setNewRecord(prev => ({ ...prev, tasks: updatedTasks }));
  };
  
  // Calculate total hours for all tasks
  const calculateTotalHours = () => {
    return newRecord.tasks.reduce((total, task) => {
      return total + calculateHours(task.timeIn, task.timeOut);
    }, 0);
  };

  // Handle submit - create multiple records
  const handleCreateRecord = async (e) => {
    e.preventDefault();
    try {
      for (const task of newRecord.tasks) {
        if (task.timeIn && task.timeOut && task.taskDescription) {
          const recordData = {
            studentId: studentProfile.id,
            date: newRecord.date,
            timeIn: task.timeIn,
            timeOut: task.timeOut,
            taskDescription: task.taskDescription
          };
          await dailyRecordAPI.create(recordData);
        }
      }
      alert('Records submitted successfully!');
      setShowModal(false);
      setNewRecord({ date: '', tasks: [{ timeIn: '', timeOut: '', taskDescription: '' }] });
      fetchData();
    } catch (error) {
      console.error('Error creating record:', error);
      alert('Error submitting record');
    }
  };

  const handlePreview = async () => {
    if (!studentProfile || !studentProfile.id) {
      alert('Student profile not loaded');
      return;
    }
    try {
      const res = await excelAPI.getPreview(studentProfile.id);
      setPreviewData(res.data);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error fetching preview:', error);
      alert('Error fetching preview data');
    }
  };

  const calculateHours = (timeIn, timeOut) => {
    if (!timeIn || !timeOut) return 0;
    const [inHours, inMinutes] = timeIn.split(':').map(Number);
    const [outHours, outMinutes] = timeOut.split(':').map(Number);
    const totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes);
    return Math.max(totalMinutes / 60, 0);
  };

  const getTotalHoursAll = () => {
    return records.reduce((sum, r) => sum + parseFloat(r.hours_worked || 0), 0);
  };

  const getApprovedHours = () => {
    return records.filter(r => r.supervisor_approval).reduce((sum, r) => sum + parseFloat(r.hours_worked || 0), 0);
  };

  // Calculate the possible finished date based on average hours worked per day
  const getPossibleFinishedDate = () => {
    const approvedHours = getApprovedHours();
    const targetHours = studentProfile?.target_hours || 600;
    const remainingHours = targetHours - approvedHours;
    
    if (remainingHours <= 0) {
      return { date: null, completed: true };
    }
    
    // Get approved records and calculate working days
    const approvedRecords = records.filter(r => r.supervisor_approval);
    
    if (approvedRecords.length === 0) {
      return { date: null, completed: false, message: 'No approved hours yet' };
    }
    
    // Find the first and last approved record dates to calculate total working days
    const sortedRecords = [...approvedRecords].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstDate = new Date(sortedRecords[0].date);
    const lastDate = new Date(sortedRecords[sortedRecords.length - 1].date);
    
    // Calculate total days between first and last record (inclusive)
    const totalDays = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calculate average hours per day
    const avgHoursPerDay = approvedHours / totalDays;
    
    if (avgHoursPerDay <= 0) {
      return { date: null, completed: false, message: 'Cannot calculate' };
    }
    
    // Calculate days remaining to complete
    const daysRemaining = remainingHours / avgHoursPerDay;
    
    // Calculate projected finish date
    const today = new Date();
    const finishDate = new Date(today);
    finishDate.setDate(today.getDate() + Math.ceil(daysRemaining));
    
    return { 
      date: finishDate, 
      completed: false,
      remainingHours: remainingHours.toFixed(1),
      avgHoursPerDay: avgHoursPerDay.toFixed(1)
    };
  };

  const getProgress = () => {
    const hours = getApprovedHours();
    const target = studentProfile?.target_hours || 600;
    return Math.min((hours / target) * 100, 100);
  };

  const getDaysInMonth = () => new Date(currentYear, currentMonth + 1, 0).getDate();
  const getFirstDayOfMonth = () => new Date(currentYear, currentMonth, 1).getDay();
  
  const getMonthName = (month) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month];
  };
  
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  const goToToday = () => {
    setCurrentMonth(new Date().getMonth());
    setCurrentYear(new Date().getFullYear());
  };
  
  const getMonthSummary = () => {
    const months = {};
    records.forEach(record => {
      if (record.supervisor_approval) {
        const date = new Date(record.date);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (!months[key]) {
          months[key] = {
            year: date.getFullYear(),
            month: date.getMonth(),
            monthName: getMonthName(date.getMonth()),
            hours: 0,
            weeks: new Set()
          };
        }
        months[key].hours += parseFloat(record.hours_worked || 0);
        const weekNum = Math.ceil(date.getDate() / 7);
        months[key].weeks.add(weekNum);
      }
    });
    return Object.values(months).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await dailyRecordAPI.delete(id);
      alert('Record deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setEditRecord({
      date: record.date,
      timeIn: record.time_in,
      timeOut: record.time_out,
      taskDescription: record.task_description
    });
    setShowEditModal(true);
  };

  const handleUpdateRecord = async (e) => {
    e.preventDefault();
    try {
      const recordData = {
        date: editRecord.date,
        timeIn: editRecord.timeIn,
        timeOut: editRecord.timeOut,
        taskDescription: editRecord.taskDescription
      };
      await dailyRecordAPI.update(editingRecord.id, recordData);
      alert('Record updated successfully!');
      setShowEditModal(false);
      setEditingRecord(null);
      setEditRecord({ date: '', timeIn: '', timeOut: '', taskDescription: '' });
      fetchData();
    } catch (error) {
      console.error('Error updating record:', error);
      alert('Error updating record');
    }
  };

  if (loading) {
    return <div className="loading">Loading your dashboard...</div>;
  }

  return (
    <div className="dashboard">
      {/* Mobile Navigation Toggle */}
      <button 
        className={`mobile-nav-toggle ${mobileMenuOpen ? 'active' : ''}`} 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle navigation menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobile Navigation Menu */}
      <div className={`mobile-nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
        <div className="nav-user">
          <div className="username">{user?.username}</div>
          <div className="role">Student</div>
        </div>
        <button className="btn" onClick={() => { window.history.back(); setMobileMenuOpen(false); }}>
          ← Back
        </button>
        <button className="btn" onClick={() => { window.location.href = '/weekly-report'; setMobileMenuOpen(false); }}>
          Weekly Report
        </button>
        <button className="btn" onClick={() => { setShowModal(true); setMobileMenuOpen(false); }}>
          Add Record
        </button>
        <button className="btn" onClick={() => { handlePreview(); setMobileMenuOpen(false); }}>
          Preview
        </button>
        <button className="btn btn-primary" onClick={() => { logout(); setMobileMenuOpen(false); }}>
          Logout
        </button>
      </div>

      <nav className="navbar">
        <h1>OJT Hours</h1>
        <div className="navbar-right hide-mobile">
          <span className="welcome-text">{user?.username}</span>
          <button onClick={logout} className="btn logout-btn">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="progress-card">
          <div className="progress-header">
            <h2>Your Progress</h2>
            <span>{getApprovedHours().toFixed(1)} / {studentProfile?.target_hours || 600} hours</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${getProgress()}%` }}></div>
          </div>
          <div className="progress-text">
            <span>{getProgress().toFixed(1)}% complete</span>
            <span>{(studentProfile?.target_hours || 600) - getTotalHoursAll()} hours remaining</span>
          </div>
          {getProgress() >= 100 && (
            <div className="alert alert-success" style={{ marginTop: '20px' }}>
              Congratulations! You have completed your OJT requirement.
            </div>
          )}
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Approved Hours</h3>
            <div className="value">{getApprovedHours().toFixed(1)}</div>
          </div>
          <div className="stat-card">
            <h3>Hours Remaining</h3>
            <div className="value">{((studentProfile?.target_hours || 600) - getTotalHoursAll()).toFixed(1)}</div>
          </div>
          <div className="stat-card">
            <h3>Possible Finished Date</h3>
            {getPossibleFinishedDate().completed ? (
              <div className="value" style={{ color: '#10b981', fontSize: '1.2rem' }}>Completed!</div>
            ) : getPossibleFinishedDate().date ? (
              <div className="value">
                {getPossibleFinishedDate().date.toLocaleDateString()}
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                  {getPossibleFinishedDate().remainingHours} hrs remaining · {getPossibleFinishedDate().avgHoursPerDay} hrs/day avg
                </span>
              </div>
            ) : (
              <div className="value" style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                {getPossibleFinishedDate().message || 'No data'}
              </div>
            )}
          </div>
          <div className="stat-card">
            <h3>Reports</h3>
            <div className="value">{reports.length}</div>
          </div>
        </div>

        {getMonthSummary().length > 0 && (
          <div className="month-summary-container">
            <div className="month-summary-header" onClick={() => setShowMonthSummary(!showMonthSummary)}>
              <h3>My OJT Months</h3>
              <span className="month-summary-toggle">{showMonthSummary ? '▼' : '▶'} ({getMonthSummary().length} month{getMonthSummary().length > 1 ? 's' : ''})</span>
            </div>
            {showMonthSummary && (
              <div className="month-summary-content">
                {getMonthSummary().map((month, index) => (
                  <div key={index} className="month-summary-item">
                    <div className="month-summary-info">
                      <span className="month-name">{month.monthName} {month.year}</span>
                      <span className="month-hours">{month.hours.toFixed(1)} hours</span>
                    </div>
                    <div className="month-weeks">
                      <span className="week-badge">{month.weeks.size} week{month.weeks.size > 1 ? 's' : ''} completed</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="records-container">
          <div className="records-header">
            <h3>Daily Records</h3>
            <div className="button-group">
              <button className="btn" onClick={() => window.location.href = '/weekly-report'}>Weekly Report</button>
              <button className="btn" onClick={() => setShowModal(true)}>Add Record</button>
              <button className="btn" onClick={handlePreview}>Preview</button>
            </div>
          </div>
          
          <div className="calendar-container">
            <div className="calendar-header">
              <button className="calendar-nav-btn" onClick={goToPreviousMonth}>‹</button>
              <span className="calendar-month-year">{getMonthName(currentMonth)} {currentYear}</span>
              <button className="calendar-nav-btn" onClick={goToNextMonth}>›</button>
              <button className="calendar-today-btn" onClick={goToToday}>Today</button>
            </div>
            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="calendar-day-header">{day}</div>
              ))}
              {Array.from({ length: getFirstDayOfMonth() }, (_, i) => (
                <div key={`empty-${i}`}></div>
              ))}
              {Array.from({ length: getDaysInMonth() }, (_, i) => {
                const day = i + 1;
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasRecord = records.some(r => {
                  const recordDate = new Date(r.date);
                  const recordDateStr = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}-${String(recordDate.getDate()).padStart(2, '0')}`;
                  return recordDateStr === dateStr;
                });
                const today = new Date();
                const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                return (
                  <div key={day} className={`calendar-day ${hasRecord ? 'worked' : ''} ${isToday ? 'today' : ''}`}>
                    {day}
                  </div>
                );
              })}
            </div>
            <div className="calendar-legend">
              <span><span className="legend-dot" style={{ background: '#2563eb' }}></span> Worked</span>
              <span><span className="legend-dot" style={{ border: '2px solid #2563eb', background: 'transparent' }}></span> Today</span>
            </div>
          </div>
          
          <div className="week-groups">
            {getRecordsByWeek().map((week) => {
              const weekKey = week.monday.toISOString().split('T')[0];
              const isExpanded = expandedWeeks[weekKey];
              return (
                <div key={weekKey} className="week-group">
                  <div className="week-group-header" onClick={() => toggleWeek(weekKey)}>
                    <div className="week-toggle">{isExpanded ? '▼' : '▶'}</div>
                    <div className="week-info">
                      <span className="week-dates">
                        {week.monday.toLocaleDateString()} - {week.friday.toLocaleDateString()}
                      </span>
                      <span className="week-hours">{week.records.length} records · {week.totalHours.toFixed(1)} hours</span>
                    </div>
                    <div className="week-status">
                      {week.approvedHours === week.totalHours && week.totalHours > 0 ? (
                        <span className="status-approved">All Approved</span>
                      ) : week.records.some(r => !r.supervisor_approval) ? (
                        <span className="status-pending">Pending</span>
                      ) : null}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="week-group-content">
                      <table>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Time In</th>
                            <th>Time Out</th>
                            <th>Hours</th>
                            <th>Task</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {week.records.map((record) => (
                            <tr key={record.id}>
                              <td>{new Date(record.date).toLocaleDateString()}</td>
                              <td>{record.time_in}</td>
                              <td>{record.time_out}</td>
                              <td><strong>{parseFloat(record.hours_worked).toFixed(2)}</strong></td>
                              <td>{record.task_description}</td>
                              <td>
                                <span className={record.supervisor_approval ? 'status-approved' : 'status-pending'}>
                                  {record.supervisor_approval ? 'Approved' : 'Pending'}
                                </span>
                              </td>
                              <td>
                                <button className="btn btn-sm" onClick={() => handleEditRecord(record)}>Edit</button>
                                {!record.supervisor_approval && (
                                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteRecord(record.id)} style={{ marginLeft: '4px' }}>Delete</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
            {getRecordsByWeek().length === 0 && (
              <div className="no-records">No records found</div>
            )}
          </div>
        </div>

        <div className="records-container">
          <div className="records-header">
            <h3>Weekly Reports</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>Week</th>
                <th>Total Hours</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.length > 0 ? (
                reports.map((report) => (
                  <tr key={report.id}>
                    <td>{new Date(report.week_start_date).toLocaleDateString()} - {new Date(report.week_end_date).toLocaleDateString()}</td>
                    <td><strong>{report.total_hours}</strong></td>
                    <td>
                      <span className={`status-${report.status === 'approved' ? 'approved' : 'pending'}`}>
                        {report.status}
                      </span>
                    </td>
                    <td>
                      {report.status === 'draft' && (
                        <button className="btn btn-sm" onClick={() => weeklyReportAPI.submit(report.id)}>Submit</button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>No reports found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Record Modal - Multiple Tasks */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Add Daily Record</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateRecord}>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={newRecord.date} onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })} required />
              </div>
              
              <div className="tasks-container">
                <label>Tasks (add multiple)</label>
                {newRecord.tasks.map((task, index) => (
                  <div key={index} className="task-slot">
                    <div className="task-header">
                      <span>Task {index + 1}</span>
                      {newRecord.tasks.length > 1 && (
                        <button type="button" className="btn-remove-task" onClick={() => removeTaskSlot(index)}>✕</button>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label>Time In</label>
                        <input 
                          type="time" 
                          value={task.timeIn} 
                          onChange={(e) => updateTask(index, 'timeIn', e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label>Time Out</label>
                        <input 
                          type="time" 
                          value={task.timeOut} 
                          onChange={(e) => updateTask(index, 'timeOut', e.target.value)} 
                          required 
                        />
                      </div>
                    </div>
                    {task.timeIn && task.timeOut && (
                      <div className="task-hours">
                        {calculateHours(task.timeIn, task.timeOut).toFixed(2)} hours
                      </div>
                    )}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Task Description</label>
                      <textarea 
                        value={task.taskDescription} 
                        onChange={(e) => updateTask(index, 'taskDescription', e.target.value)} 
                        required 
                        placeholder="What did you do?" 
                        rows="2" 
                      />
                    </div>
                  </div>
                ))}
                
                <button type="button" className="btn btn-secondary" onClick={addTaskSlot} style={{ marginTop: '10px', width: '100%' }}>
                  + Add Another Task
                </button>
              </div>
              
              {newRecord.tasks.length > 0 && (
                <div className="total-hours-display">
                  <strong>Total Hours:</strong> {calculateTotalHours().toFixed(2)} hours
                </div>
              )}
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '15px' }}>Submit All Tasks</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Record Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Record</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <div className="modal-note">After editing, the record will need supervisor approval again.</div>
            <form onSubmit={handleUpdateRecord}>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={editRecord.date} onChange={(e) => setEditRecord({ ...editRecord, date: e.target.value })} required />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Time In</label>
                  <input type="time" value={editRecord.timeIn} onChange={(e) => setEditRecord({ ...editRecord, timeIn: e.target.value })} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Time Out</label>
                  <input type="time" value={editRecord.timeOut} onChange={(e) => setEditRecord({ ...editRecord, timeOut: e.target.value })} required />
                </div>
              </div>
              {editRecord.timeIn && editRecord.timeOut && (
                <div className="form-group">
                  <label>Total Hours</label>
                  <input type="text" value={`${calculateHours(editRecord.timeIn, editRecord.timeOut).toFixed(2)} hours`} disabled style={{ backgroundColor: '#f9fafb' }} />
                </div>
              )}
              <div className="form-group">
                <label>Task Description</label>
                <textarea value={editRecord.taskDescription} onChange={(e) => setEditRecord({ ...editRecord, taskDescription: e.target.value })} required rows="4" />
              </div>
              <button type="submit" className="btn btn-primary">Update Record</button>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>Preview - {previewData?.template?.template_name || 'Records'}</h3>
              <button className="modal-close" onClick={() => setShowPreviewModal(false)}>&times;</button>
            </div>
            <div style={{ overflow: 'auto', maxHeight: '60vh' }}>
              <p style={{ marginBottom: '20px', fontSize: '14px', color: '#6b7280' }}>
                {previewData?.hasTemplate ? (
                  <>Template: <strong>{previewData.template.template_name}</strong> · {previewData.totalRecords} records</>
                ) : 'Showing records in default format'}
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time In</th>
                    <th>Time Out</th>
                    <th>Hours</th>
                    <th>Task</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData?.records?.map((record, index) => (
                    <tr key={index}>
                      <td>{new Date(record.date).toLocaleDateString()}</td>
                      <td>{record.time_in}</td>
                      <td>{record.time_out}</td>
                      <td><strong>{parseFloat(record.hours_worked).toFixed(2)}</strong></td>
                      <td>{record.task_description}</td>
                      <td>{record.supervisor_approval ? 'Approved' : 'Pending'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

