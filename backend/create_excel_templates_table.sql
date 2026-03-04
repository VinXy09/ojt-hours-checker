-- Run this SQL to create the excel_templates table
-- This is required for the Excel upload and preview feature

USE ojt_hours_db;

CREATE TABLE IF NOT EXISTS excel_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  template_name VARCHAR(255),
  column_headers JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

