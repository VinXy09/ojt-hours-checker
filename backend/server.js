require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const dailyRecordRoutes = require('./routes/dailyRecordRoutes');
const weeklyReportRoutes = require('./routes/weeklyReportRoutes');
const excelRoutes = require('./routes/excelRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Get the frontend URL from environment - needed for production
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

// Database initialization - create tables if they don't exist
const initDatabase = () => {
  const createTablesSQL = [
    // Users Table
    `CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('student', 'supervisor', 'admin') DEFAULT 'student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Students Table
    `CREATE TABLE IF NOT EXISTS students (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        student_id VARCHAR(50) NOT NULL,
        department VARCHAR(100) NOT NULL,
        total_hours DECIMAL(10, 2) DEFAULT 0,
        target_hours DECIMAL(10, 2) DEFAULT 600,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    // Daily Records Table
    `CREATE TABLE IF NOT EXISTS daily_records (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL,
        date DATE NOT NULL,
        time_in TIME NOT NULL,
        time_out TIME NOT NULL,
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
    )`,

    // Weekly Reports Table
    `CREATE TABLE IF NOT EXISTS weekly_reports (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL,
        week_start_date DATE NOT NULL,
        week_end_date DATE NOT NULL,
        total_hours DECIMAL(10, 2) DEFAULT 0,
        summary TEXT,
        status ENUM('draft', 'submitted', 'approved') DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )`,

    // Excel Templates Table
    `CREATE TABLE IF NOT EXISTS excel_templates (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL,
        template_name VARCHAR(255),
        column_headers JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )`
  ];

  // Execute each CREATE TABLE statement separately
  const createTablePromises = createTablesSQL.map(sql => {
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  });

  Promise.all(createTablePromises)
    .then(() => {
      console.log('Database tables initialized successfully');
    })
    .catch(err => {
      console.error('Error creating tables:', err.message);
    });
};

// Middleware
app.use(cors({
  origin: [frontendUrl, 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/daily-records', dailyRecordRoutes);
app.use('/api/weekly-reports', weeklyReportRoutes);
app.use('/api/excel', excelRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'OJT Hours Counter API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  initDatabase(); // Initialize database tables on server start
});

module.exports = app;
