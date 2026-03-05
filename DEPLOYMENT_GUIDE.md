# OJT Hours Counter - Deployment Guide

## Frontend (GitHub Pages)
✅ Already configured with base: '/ojt-hours-checker/'

## Backend (Google Apps Script)

### Step 1: Upload Apps Script Files
1. Go to: https://script.google.com/
2. Open your project: `1o5U6c9X48m1rmKhiur4sMHGUwyoUUQ0fTRaHwywp3Cdp0ldx1nTrhMiG`
3. Create two files:
   - `Code.gs` - Copy content from `apps-script/Code.gs`
   - `index.html` - Copy content from `apps-script/index.html`

### Step 2: Deploy as Web App
1. Click **Deploy** → **New deployment**
2. Select type: **Web app**
3. Fill in:
   - Description: "OJT Hours Counter API"
   - Execute as: **Me**
   - Who has access: **Anyone** (or "Anyone with Google Account" for security)
4. Click **Deploy**
5. Copy the **Web app URL**

### Step 3: Update Sheet ID in Code.gs
In `Code.gs`, update the SHEET_ID constant:
```javascript
const SHEET_ID = 'YOUR_SHEET_ID_HERE';
```
Replace with your Google Sheet ID from: https://docs.google.com/spreadsheets/d/**1IRBc7FyGjq4XSOE25m-N2iZj9by9z7Jdi3zIzVA4pPY**/edit

### Step 4: Update Frontend API URL
After deploying the Apps Script, update the frontend:

1. Create `frontend/.env` file with:
```
VITE_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

2. Or update `frontend/src/services/api.js` directly

### Step 5: Deploy Frontend to GitHub Pages
```bash
cd frontend
npm install
npm run build
```

Then push to your GitHub repository and enable GitHub Pages in Settings.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | User login |
| POST | /api/auth/register | User registration |
| GET | /api/auth/me | Get current user |
| GET | /api/students | Get all students (admin/supervisor) |
| GET | /api/students/user/:userId | Get student by user ID |
| GET | /api/students/progress/:studentId | Get student progress |
| PUT | /api/students/:id | Update student |
| POST | /api/daily-records | Create daily record |
| GET | /api/daily-records/student/:id | Get records by student |
| GET | /api/daily-records/student/:id/total | Get total hours |
| PUT | /api/daily-records/:id | Update record |
| DELETE | /api/daily-records/:id | Delete record |
| PUT | /api/daily-records/:id/approve | Approve record |
| GET | /api/daily-records/all | Get all records |
| GET | /api/daily-records/pending | Get pending approvals |
| POST | /api/weekly-reports | Create weekly report |
| GET | /api/weekly-reports/student/:id | Get reports by student |
| PUT | /api/weekly-reports/:id/submit | Submit report |
| PUT | /api/weekly-reports/:id/approve | Approve report |
| GET | /api/weekly-reports/generate | Generate report |
| GET | /api/health | Health check |

---

## Troubleshooting

### CORS Issues
If you get CORS errors, use the `dev` mode or add `?dev=1` to test locally.

### Authentication Issues
Make sure your Google Sheet has the correct column headers:
- Users: id, username, email, password, role, created_at
- Students: id, user_id, full_name, student_id, department, total_hours, target_hours, created_at
- DailyRecords: id, student_id, date, time_in, time_out, hours_worked, task_description, supervisor_approval, approved_by, created_at
- WeeklyReports: id, student_id, week_start_date, week_end_date, total_hours, summary, status, created_at
