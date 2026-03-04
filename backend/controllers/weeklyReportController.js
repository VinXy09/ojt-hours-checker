const WeeklyReport = require('../models/WeeklyReport');
const DailyRecord = require('../models/DailyRecord');

const weeklyReportController = {
  // Create weekly report
  async create(req, res) {
    try {
      const { studentId, weekStartDate, weekEndDate, summary } = req.body;
      
      // Calculate total hours for the week
      const weekData = await DailyRecord.getByDateRange(studentId, weekStartDate, weekEndDate);
      const totalHours = weekData.reduce((sum, record) => sum + parseFloat(record.hours_worked || 0), 0);
      
      const result = await WeeklyReport.create(
        studentId, 
        weekStartDate, 
        weekEndDate, 
        totalHours, 
        summary
      );
      
      res.status(201).json({ 
        message: 'Weekly report created successfully',
        id: result.insertId,
        totalHours
      });
    } catch (error) {
      console.error('Create weekly report error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get all weekly reports
  async getAll(req, res) {
    try {
      const reports = await WeeklyReport.getAll();
      res.json(reports);
    } catch (error) {
      console.error('Get all weekly reports error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get weekly report by ID
  async getById(req, res) {
    try {
      const report = await WeeklyReport.findById(req.params.id);
      if (!report) {
        return res.status(404).json({ message: 'Weekly report not found' });
      }
      res.json(report);
    } catch (error) {
      console.error('Get weekly report error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get weekly reports by student
  async getByStudent(req, res) {
    try {
      const reports = await WeeklyReport.findByStudentId(req.params.studentId);
      res.json(reports);
    } catch (error) {
      console.error('Get student weekly reports error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Submit weekly report
  async submit(req, res) {
    try {
      await WeeklyReport.updateStatus(req.params.id, 'submitted');
      res.json({ message: 'Weekly report submitted successfully' });
    } catch (error) {
      console.error('Submit weekly report error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Approve weekly report (supervisor)
  async approve(req, res) {
    try {
      await WeeklyReport.updateStatus(req.params.id, 'approved');
      res.json({ message: 'Weekly report approved successfully' });
    } catch (error) {
      console.error('Approve weekly report error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Generate weekly report data
  async generate(req, res) {
    try {
      const { studentId, weekStartDate, weekEndDate } = req.query;
      const data = await WeeklyReport.generateWeeklyReport(studentId, weekStartDate, weekEndDate);
      res.json(data);
    } catch (error) {
      console.error('Generate weekly report error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get weekly report data formatted for printing
  async getForPrint(req, res) {
    try {
      const { studentId, weekStartDate, weekEndDate } = req.query;
      
      // Get student info
      const Student = require('../models/Student');
      const student = await Student.findById(studentId);
      
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      // Get daily records for the week
      const records = await DailyRecord.getByDateRange(studentId, weekStartDate, weekEndDate);
      
      // Group records by date - convert UTC date to local date string
      const recordsByDate = {};
      records.forEach(record => {
        // Convert the UTC date string to local date (YYYY-MM-DD)
        const dateObj = new Date(record.date);
        const localDateStr = dateObj.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD in local time
        if (!recordsByDate[localDateStr]) {
          recordsByDate[localDateStr] = [];
        }
        recordsByDate[localDateStr].push(record);
      });
      
      // Sort records within each day by time_in
      Object.keys(recordsByDate).forEach(dateKey => {
        recordsByDate[dateKey].sort((a, b) => {
          return String(a.time_in).localeCompare(String(b.time_in));
        });
      });
      
      // Get the week days (Monday to Friday)
      const startDate = new Date(weekStartDate);
      const endDate = new Date(weekEndDate);
      
      const weekDays = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
        const dateStr = currentDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
        
        weekDays.push({
          day: dayName,
          date: dateStr,
          records: recordsByDate[dateStr] || []
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Calculate total hours
      const totalHours = records.reduce((sum, r) => sum + parseFloat(r.hours_worked || 0), 0);
      
      res.json({
        student: {
          name: student.full_name,
          studentId: student.student_id,
          department: student.department
        },
        weekStartDate: weekStartDate,
        weekEndDate: weekEndDate,
        days: weekDays,
        totalHours: totalHours.toFixed(2)
      });
    } catch (error) {
      console.error('Get weekly report for print error:', error);
      res.status(500).json({ message: 'Server error: ' + error.message });
    }
  }
};

module.exports = weeklyReportController;
