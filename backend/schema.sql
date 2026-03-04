-- OJT Hours Counter Database Schema
-- Run this script in MySQL Workbench to create the database

CREATE DATABASE IF NOT EXISTS ojt_hours_db;
USE ojt_hours_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'supervisor', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students Table
CREATE TABLE IF NOT EXISTS students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    department VARCHAR(100) NOT NULL,
    total_hours DECIMAL(10, 2) DEFAULT 0,
    target_hours DECIMAL(10, 2) DEFAULT 600,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Daily Records Table (Time Card Format)
CREATE TABLE IF NOT EXISTS daily_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    date DATE NOT NULL,
    time_in TIME NOT NULL,
    time_out TIME NOT NULL,
    -- Only subtract 1-hour lunch if total hours >= 8
    -- If less than 8 hours, no lunch is deducted
    hours_worked DECIMAL(5, 2) GENERATED ALWAYS AS (
        GREATEST(
            TIMESTAMPDIFF(MINUTE, time_in, time_out) - 
            CASE 
                WHEN TIMESTAMPDIFF(MINUTE, time_in, time_out) >= 480 THEN 60 
                ELSE 0 
            END, 
            0
        ) / 60
    ) STORED,
    task_description TEXT,
    supervisor_approval BOOLEAN DEFAULT FALSE,
    approved_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Weekly Reports Table
CREATE TABLE IF NOT EXISTS weekly_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    total_hours DECIMAL(10, 2) DEFAULT 0,
    summary TEXT,
    status ENUM('draft', 'submitted', 'approved') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ============================================
-- UPDATE SCRIPT - If tables already exist
-- Run these commands to add new columns
-- ============================================

-- Add time columns to existing daily_records table (run only if needed)
-- ALTER TABLE daily_records ADD COLUMN time_in TIME NOT NULL AFTER date;
-- ALTER TABLE daily_records ADD COLUMN time_out TIME NOT NULL AFTER time_in;

-- If you have existing hours_worked data, you may need to drop and re-add:
-- ALTER TABLE daily_records DROP COLUMN hours_worked;
-- ALTER TABLE daily_records ADD COLUMN hours_worked DECIMAL(5, 2) GENERATED ALWAYS AS (TIMESTAMPDIFF(MINUTE, time_in, time_out) / 60) STORED AFTER time_out;

-- Excel Templates Table
CREATE TABLE IF NOT EXISTS excel_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  template_name VARCHAR(255),
  column_headers JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
