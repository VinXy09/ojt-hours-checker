const db = require('../config/db');

class DailyRecord {
  static async create(studentId, date, timeIn, timeOut, taskDescription) {
    // Calculate hours worked
    const query = 'INSERT INTO daily_records (student_id, date, time_in, time_out, task_description) VALUES (?, ?, ?, ?, ?)';
    return new Promise((resolve, reject) => {
      db.query(query, [studentId, date, timeIn, timeOut, taskDescription], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  static async findByStudentId(studentId) {
    const query = 'SELECT * FROM daily_records WHERE student_id = ? ORDER BY date DESC';
    return new Promise((resolve, reject) => {
      db.query(query, [studentId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  static async findById(id) {
    const query = 'SELECT * FROM daily_records WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.query(query, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result[0]);
      });
    });
  }

  static async getAll() {
    const query = 'SELECT dr.*, s.full_name, s.student_id FROM daily_records dr JOIN students s ON dr.student_id = s.id ORDER BY dr.date DESC';
    return new Promise((resolve, reject) => {
      db.query(query, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  static async getPendingApprovals() {
    const query = 'SELECT dr.*, s.full_name, s.student_id FROM daily_records dr JOIN students s ON dr.student_id = s.id WHERE dr.supervisor_approval = FALSE ORDER BY dr.date DESC';
    return new Promise((resolve, reject) => {
      db.query(query, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  static async approve(id, approverId) {
    const query = 'UPDATE daily_records SET supervisor_approval = TRUE, approved_by = ? WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.query(query, [approverId, id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  static async getByDateRange(studentId, startDate, endDate) {
    const query = 'SELECT * FROM daily_records WHERE student_id = ? AND date BETWEEN ? AND ? ORDER BY date';
    return new Promise((resolve, reject) => {
      db.query(query, [studentId, startDate, endDate], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  static async getTotalHoursByStudent(studentId) {
    const query = 'SELECT SUM(hours_worked) as total FROM daily_records WHERE student_id = ? AND supervisor_approval = TRUE';
    return new Promise((resolve, reject) => {
      db.query(query, [studentId], (err, result) => {
        if (err) reject(err);
        else resolve(result[0]);
      });
    });
  }

  static async updateHoursWorked(studentId) {
    // Recalculate total hours from approved records
    const query = `
      UPDATE students s 
      SET s.total_hours = (
        SELECT COALESCE(SUM(dr.hours_worked), 0) 
        FROM daily_records dr 
        WHERE dr.student_id = s.id AND dr.supervisor_approval = TRUE
      )
      WHERE s.id = ?
    `;
    return new Promise((resolve, reject) => {
      db.query(query, [studentId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  static async delete(id) {
    const query = 'DELETE FROM daily_records WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.query(query, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  static async update(id, date, timeIn, timeOut, taskDescription) {
    // When updating, reset approval status to require re-approval
    const query = 'UPDATE daily_records SET date = ?, time_in = ?, time_out = ?, supervisor_approval = FALSE WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.query(query, [date, timeIn, timeOut, id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
}

module.exports = DailyRecord;
