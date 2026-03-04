# OJT Hours Counter - Deployment Plan

## Project Overview
- **Frontend**: React + Vite (Port 3000)
- **Backend**: Node.js + Express (Port 5000)
- **Database**: MySQL

## Deployment Options

### Recommended: Vercel (Frontend) + Render (Backend + MySQL)

---

## Step 1: GitHub Setup
- [ ] 1.1 Create GitHub repository named: `ojt-hours-counter`
- [ ] 1.2 Initialize git in local project
- [ ] 1.3 Push code to GitHub

---

## Step 2: Backend Deployment (Render)

### 2.1 Create Render Account
- Go to https://render.com and sign up with GitHub

### 2.2 Deploy Backend
- [ ] 2.2.1 Create new Web Service on Render
- [ ] 2.2.2 Connect to GitHub repository
- [ ] 2.2.3 Configure:
  - Name: `ojt-hours-backend`
  - Root Directory: `backend`
  - Build Command: `npm install`
  - Start Command: `npm start`

### 2.3 Create MySQL Database
- [ ] 2.3.1 Create new MySQL database on Render
- [ ] 2.3.2 Note the database credentials

### 2.4 Configure Environment Variables
- [ ] 2.4.1 Add environment variables in Render:
  ```
  PORT=5000
  DB_HOST=<your-mysql-host>
  DB_USER=<your-mysql-user>
  DB_PASSWORD=<your-mysql-password>
  DB_NAME=<your-mysql-database>
  JWT_SECRET=<your-jwt-secret>
  ```

---

## Step 3: Frontend Deployment (Vercel)

### 3.1 Create Vercel Account
- Go to https://vercel.com and sign up with GitHub

### 3.2 Deploy Frontend
- [ ] 3.2.1 Import GitHub repository to Vercel
- [ ] 3.2.2 Configure:
  - Framework Preset: `Vite`
  - Root Directory: `frontend`
  - Build Command: `npm run build`
  - Output Directory: `dist`

### 3.3 Configure Environment Variables
- [ ] 3.3.1 Add environment variable:
  ```
  VITE_API_URL=<your-render-backend-url>
  ```

---

## Step 4: Update Frontend API Configuration

### 4.1 Update api.js
- [ ] 4.1.1 Change API_URL to use environment variable
- [ ] 4.1.2 Redeploy frontend

---

## Step 5: Database Setup

### 5.1 Run Schema
- [ ] 5.1.1 Use Render's MySQL connection or MySQL Workbench
- [ ] 5.1.2 Run `backend/schema.sql` queries
- [ ] 5.1.3 Run `backend/create_excel_templates_table.sql` queries

---

## Step 6: Final Testing

- [ ] 6.1 Test backend health: `<backend-url>/api/health`
- [ ] 6.2 Test frontend: `<vercel-frontend-url>`
- [ ] 6.3 Test user registration
- [ ] 6.4 Test login functionality

---

## Alternative: All-in-One on Railway

### Railway Deployment
- [ ] Create Railway account
- [ ] Deploy both frontend and backend
- [ ] Add MySQL plugin

---

## Quick Commands

### Local Development
```bash
# Backend
cd backend
npm install
npm start

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Production Build
```bash
# Frontend
cd frontend
npm run build
```

