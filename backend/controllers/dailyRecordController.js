const DailyRecord = require('../models/DailyRecord');
const Student = require('../models/Student');

const dailyRecordController = {
  // Create daily record with Time In/Time Out
  async create(req, res) {
    try {
      const { studentId, date, timeIn, timeOut, taskDescription } = req.body;
      
      console.log('Creating daily record with:', { studentId, date, timeIn, timeOut, taskDescription });
      
      const result = await DailyRecord.create(studentId, date, timeIn, timeOut, taskDescription);
      res.status(201).json({ 
        message: 'Daily record created successfully',
        id: result.insertId 
      });
    } catch (error) {
      console.error('Create daily record error:', error);
      res.status(500).json({ message: 'Server error: ' + error.message });
    }
  },

  // Get all daily records (for supervisors/admins)
  async getAll(req, res) {
    try {
      const records = await DailyRecord.getAll();
      res.json(records);
    } catch (error) {
      console.error('Get all daily records error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get daily records by student
  async getByStudent(req, res) {
    try {
      const records = await DailyRecord.findByStudentId(req.params.studentId);
      res.json(records);
    } catch (error) {
      console.error('Get daily records error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get pending approvals (for supervisors)
  async getPendingApprovals(req, res) {
    try {
      const records = await DailyRecord.getPendingApprovals();
      res.json(records);
    } catch (error) {
      console.error('Get pending approvals error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Approve daily record (supervisor)
  async approve(req, res) {
    try {
      const { approverId } = req.body;
      await DailyRecord.approve(req.params.id, approverId);
      
      // Update student's total hours from approved records
      const record = await DailyRecord.findById(req.params.id);
      if (record) {
        await DailyRecord.updateHoursWorked(record.student_id);
      }
      
      res.json({ message: 'Daily record approved successfully' });
    } catch (error) {
      console.error('Approve daily record error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get records by date range
  async getByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const records = await DailyRecord.getByDateRange(
        req.params.studentId, 
        startDate, 
        endDate
      );
      res.json(records);
    } catch (error) {
      console.error('Get records by date range error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get total hours for student
  async getTotalHours(req, res) {
    try {
      const result = await DailyRecord.getTotalHoursByStudent(req.params.studentId);
      res.json(result);
    } catch (error) {
      console.error('Get total hours error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Delete daily record (student can delete their own pending records)
  async delete(req, res) {
    try {
      const record = await DailyRecord.findById(req.params.id);
      if (!record) {
        return res.status(404).json({ message: 'Record not found' });
      }

      // Check if the record is already approved - students can only delete pending records
      if (record.supervisor_approval) {
        return res.status(403).json({ message: 'Cannot delete approved records. Contact your supervisor.' });
      }

      await DailyRecord.delete(req.params.id);
      res.json({ message: 'Daily record deleted successfully' });
    } catch (error) {
      console.error('Delete daily record error:', error);
      res.status(500).json({ message: 'Server error: ' + error.message });
    }
  },

  // Update daily record (student can edit their own records)
  async update(req, res) {
    try {
      const { date, timeIn, timeOut, taskDescription } = req.body;
      const record = await DailyRecord.findById(req.params.id);
      
      if (!record) {
        return res.status(404).json({ message: 'Record not found' });
      }

      // Update the record - it will need re-approval
      await DailyRecord.update(req.params.id, date, timeIn, timeOut, taskDescription);
      
      res.json({ 
        message: 'Daily record updated successfully. It will need supervisor approval again.',
        needsReapproval: true 
      });
    } catch (error) {
      console.error('Update daily record error:', error);
      res.status(500).json({ message: 'Server error: ' + error.message });
    }
  }
};

module.exports = dailyRecordController;
