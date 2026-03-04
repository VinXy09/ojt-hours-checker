const db = require('../config/db');

class WeeklyReport {
  static async create(studentId, weekStartDate, weekEndDate, totalHours, summary, status = 'draft') {
    const query = 'INSERT INTO weekly_reports (student_id, week_start_date, week_end_date, total_hours, summary, status) VALUES (?, ?, ?, ?, ?, ?)';
    return new Promise((resolve, reject) => {
      db.query(query, [studentId, weekStartDate, weekEndDate, totalHours, summary, status], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  static async findByStudentId(studentId) {
    const query = 'SELECT * FROM weekly_reports WHERE student_id = ? ORDER BY week_start_date DESC';
    return new Promise((resolve, reject) => {
      db.query(query, [studentId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  static async findById(id) {
    const query = 'SELECT * FROM weekly_reports WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.query(query, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result[0]);
      });
    });
  }

  static async getAll() {
    const query = 'SELECT wr.*, s.full_name, s.student_id FROM weekly_reports wr JOIN students s ON wr.student_id = s.id ORDER BY wr.week_start_date DESC';
    return new Promise((resolve, reject) => {
      db.query(query, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  static async updateStatus(id, status) {
    const query = 'UPDATE weekly_reports SET status = ? WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.query(query, [status, id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  static async generateWeeklyReport(studentId, weekStartDate, weekEndDate) {
    // Get all daily records for the week
    const query = `
      SELECT 
        SUM(hours_worked) as total_hours,
        GROUP_CONCAT(task_description SEPARATOR '; ') as tasks
      FROM daily_records 
      WHERE student_id = ? 
        AND date BETWEEN ? AND ?
        AND supervisor_approval = TRUE
    `;
    return new Promise((resolve, reject) => {
      db.query(query, [studentId, weekStartDate, weekEndDate], (err, result) => {
        if (err) reject(err);
        else resolve(result[0]);
      });
    });
  }

  static async getByDateRange(startDate, endDate) {
    const query = 'SELECT wr.*, s.full_name, s.student_id FROM weekly_reports wr JOIN students s ON wr.student_id = s.id WHERE wr.week_start_date BETWEEN ? AND ? ORDER BY wr.week_start_date';
    return new Promise((resolve, reject) => {
      db.query(query, [startDate, endDate], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
}

module.exports = WeeklyReport;
