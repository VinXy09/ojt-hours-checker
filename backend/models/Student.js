const db = require('../config/db');

class Student {
  static async create(userId, fullName, studentId, department, targetHours = 600) {
    const query = 'INSERT INTO students (user_id, full_name, student_id, department, target_hours) VALUES (?, ?, ?, ?, ?)';
    return new Promise((resolve, reject) => {
      db.query(query, [userId, fullName, studentId, department, targetHours], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  static async findByUserId(userId) {
    const query = 'SELECT * FROM students WHERE user_id = ?';
    return new Promise((resolve, reject) => {
      db.query(query, [userId], (err, result) => {
        if (err) reject(err);
        else resolve(result[0]);
      });
    });
  }

  static async findById(id) {
    const query = 'SELECT * FROM students WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.query(query, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result[0]);
      });
    });
  }

  static async getAll() {
    const query = 'SELECT s.*, u.username, u.email FROM students s JOIN users u ON s.user_id = u.id';
    return new Promise((resolve, reject) => {
      db.query(query, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  static async updateTotalHours(studentId, hours) {
    const query = 'UPDATE students SET total_hours = total_hours + ? WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.query(query, [hours, studentId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  static async update(studentId, fullName, studentIdNum, department) {
    const query = 'UPDATE students SET full_name = ?, student_id = ?, department = ? WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.query(query, [fullName, studentIdNum, department, studentId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  static async getProgress(studentId) {
    const query = 'SELECT full_name, student_id, department, total_hours, target_hours, (total_hours / target_hours * 100) as progress_percentage FROM students WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.query(query, [studentId], (err, result) => {
        if (err) reject(err);
        else resolve(result[0]);
      });
    });
  }
}

module.exports = Student;
