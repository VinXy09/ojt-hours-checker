# OJT Hours Counter

A full-stack web application for tracking OJT (On-the-Job Training) hours. Students need to complete 600 hours of OJT duty, and this application helps track their daily tasks, hours worked, and generate weekly reports.

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: MySQL (via MySQL Workbench)
- **Authentication**: JWT

## Features

- User authentication (Login/Register)
- Role-based access (Student, Supervisor, Admin)
- Daily task recording with hours worked
- Supervisor approval for daily records
- Progress tracking (600-hour target)
- Weekly report generation
- Admin dashboard for managing students

## Project Structure

```
ojt-hours-counter/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── studentController.js
│   │   ├── dailyRecordController.js
│   │   └── weeklyReportController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Student.js
│   │   ├── DailyRecord.js
│   │   └── WeeklyReport.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── dailyRecordRoutes.js
│   │   └── weeklyReportRoutes.js
│   ├── schema.sql
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── TODO.md
└── README.md
```

## Database Schema

The application uses 4 main tables:

1. **Users** - Authentication (id, username, email, password, role)
2. **Students** - Student profiles (user_id, full_name, student_id, department, total_hours, target_hours)
3. **Daily Records** - Daily task logs (student_id, date, hours_worked, task_description, supervisor_approval)
4. **Weekly Reports** - Weekly summaries (student_id, week_start_date, week_end_date, total_hours, summary, status)

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MySQL Workbench (or MySQL server)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   
```
bash
   cd backend
   
```

2. Install dependencies:
   
```
bash
   npm install
   
```

3. Configure database:
   - Open MySQL Workbench
   - Run the SQL script in `backend/schema.sql`
   - Update the `.env` file with your MySQL credentials

4. Start the backend server:
   
```
bash
   npm start
   
```

   The server will run on http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:
   
```
bash
   cd frontend
   
```

2. Install dependencies:
   
```
bash
   npm install
   
```

3. Start the development server:
   
```
bash
   npm run dev
   
```

   The frontend will run on http://localhost:3000

## Usage

1. **Admin/Supervisor**: Register with role 'admin' or 'supervisor' to access the admin dashboard
2. **Student**: Register with role 'student' to track your OJT hours
3. **Daily Tasks**: Students can log their daily hours and tasks
4. **Approvals**: Supervisors can approve/reject daily records
5. **Reports**: Generate and view weekly reports

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user

### Students
- GET `/api/students` - Get all students (admin/supervisor)
- GET `/api/students/user/:userId` - Get student by user ID
- GET `/api/students/progress/:studentId` - Get student progress

### Daily Records
- POST `/api/daily-records` - Create daily record
- GET `/api/daily-records/all` - Get all records (supervisor)
- GET `/api/daily-records/pending` - Get pending approvals
- PUT `/api/daily-records/:id/approve` - Approve record

### Weekly Reports
- POST `/api/weekly-reports` - Create weekly report
- GET `/api/weekly-reports/all` - Get all reports
- PUT `/api/weekly-reports/:id/submit` - Submit report
- PUT `/api/weekly-reports/:id/approve` - Approve report

## License

MIT
