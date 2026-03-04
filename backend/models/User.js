const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  static async create(username, email, password, role = 'student') {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
    return new Promise((resolve, reject) => {
      db.query(query, [username, email, hashedPassword, role], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    return new Promise((resolve, reject) => {
      db.query(query, [email], (err, result) => {
        if (err) reject(err);
        else resolve(result[0]);
      });
    });
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.query(query, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result[0]);
      });
    });
  }

  static async getAll() {
    const query = 'SELECT id, username, email, role, created_at FROM users';
    return new Promise((resolve, reject) => {
      db.query(query, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
}

module.exports = User;
