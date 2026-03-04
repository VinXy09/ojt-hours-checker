const Student = require('../models/Student');
const DailyRecord = require('../models/DailyRecord');

const studentController = {
  // Get all students
  async getAll(req, res) {
    try {
      const students = await Student.getAll();
      res.json(students);
    } catch (error) {
      console.error('Get all students error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get student by user ID
  async getByUserId(req, res) {
    try {
      const student = await Student.findByUserId(req.params.userId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      res.json(student);
    } catch (error) {
      console.error('Get student error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get student progress
  async getProgress(req, res) {
    try {
      const progress = await Student.getProgress(req.params.studentId);
      if (!progress) {
        return res.status(404).json({ message: 'Student not found' });
      }
      res.json(progress);
    } catch (error) {
      console.error('Get progress error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Update student
  async update(req, res) {
    try {
      const { fullName, studentIdNum, department } = req.body;
      await Student.update(req.params.studentId, fullName, studentIdNum, department);
      res.json({ message: 'Student updated successfully' });
    } catch (error) {
      console.error('Update student error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get student's daily records
  async getDailyRecords(req, res) {
    try {
      const records = await DailyRecord.findByStudentId(req.params.studentId);
      res.json(records);
    } catch (error) {
      console.error('Get daily records error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = studentController;
