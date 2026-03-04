const db = require('../config/db');

class ExcelTemplate {
  static async create(studentId, templateName, columnHeaders) {
    // Check if student already has a template
    const existingQuery = 'SELECT id FROM excel_templates WHERE student_id = ?';
    const existing = await new Promise((resolve, reject) => {
      db.query(existingQuery, [studentId], (err, result) => {
        if (err) reject(err);
        else resolve(result[0]);
      });
    });

    if (existing) {
      // Update existing template
      const updateQuery = 'UPDATE excel_templates SET template_name = ?, column_headers = ? WHERE student_id = ?';
      return new Promise((resolve, reject) => {
        db.query(updateQuery, [templateName, JSON.stringify(columnHeaders), studentId], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    }

    // Create new template
    const query = 'INSERT INTO excel_templates (student_id, template_name, column_headers) VALUES (?, ?, ?)';
    return new Promise((resolve, reject) => {
      db.query(query, [studentId, templateName, JSON.stringify(columnHeaders)], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  static async findByStudentId(studentId) {
    const query = 'SELECT * FROM excel_templates WHERE student_id = ?';
    return new Promise((resolve, reject) => {
      db.query(query, [studentId], (err, result) => {
        if (err) reject(err);
        else {
          if (result[0]) {
            // Handle case where column_headers might not be valid JSON
            try {
              if (result[0].column_headers) {
                result[0].column_headers = JSON.parse(result[0].column_headers);
              }
            } catch (parseError) {
              console.log('Invalid JSON in column_headers, setting to empty array');
              result[0].column_headers = [];
            }
          }
          resolve(result[0]);
        }
      });
    });
  }

  static async delete(studentId) {
    const query = 'DELETE FROM excel_templates WHERE student_id = ?';
    return new Promise((resolve, reject) => {
      db.query(query, [studentId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
}

module.exports = ExcelTemplate;

