# OJT Hours Counter - Deployment Plan (Updated)

## Project Overview
- **Frontend**: React + Vite (Port 3000) - Already deployed on GitHub Pages
- **Backend**: Node.js + Express - **Deploying to Cyclic**
- **Database**: MySQL (Your local MySQL Workbench or cloud database)

---

## Step 1: GitHub Setup
- [x] 1.1 Backend pushed to GitHub (cyclic.json added)
- [ ] 1.2 Make sure backend is in its own GitHub repository

---

## Step 2: Backend Deployment (Cyclic)

### 2.1 Create Cyclic Account
- [ ] Go to https://cyclic.sh and sign in with GitHub

### 2.2 Deploy Backend
- [ ] 2.2.1 Click "Connect Repository" on Cyclic dashboard
- [ ] 2.2.2 Select your backend repository
- [ ] 2.2.3 Cyclic will auto-detect configuration from `cyclic.json`

### 2.3 Configure Environment Variables in Cyclic Dashboard
Add these variables:
| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DB_HOST` | Your MySQL host |
| `DB_USER` | Your MySQL username |
| `DB_PASSWORD` | Your MySQL password |
| `DB_NAME` | Your database name |
| `JWT_SECRET` | A random secret string |
| `FRONTEND_URL` | `https://vinxy09.github.io` |

### 2.4 Database Note
Since your MySQL is local (MySQL Workbench), you have two options:
- [ ] **Option A**: Use a free cloud MySQL (FreeSQLDatabase, PlanetScale)
- [ ] **Option B**: Keep local and use ngrok tunneling (not recommended for production)

---

## Step 3: Frontend Configuration

### 3.1 Create frontend/.env file
```
VITE_API_URL=https://your-cyclic-app.cyclic.app/api
```

### 3.2 Update api.js if needed
The current setup already supports VITE_API_URL environment variable.

### 3.3 Rebuild and Push Frontend
```bash
cd frontend
npm run build
git add .
git commit -m "Update API URL for production"
git push
```

---

## Step 4: Verify Deployment

- [ ] 4.1 Test backend health: `https://your-app.cyclic.app/api/health`
- [ ] 4.2 Test frontend: `https://vinxy09.github.io/OJT_Hour_Checker/`
- [ ] 4.3 Test login/registration

---

## Files Created/Modified

- ✅ `cyclic.json` - Cyclic deployment configuration
- ✅ `backend/package.json` - Added Node.js engine requirement
- ✅ `backend/.env.example` - Template for environment variables
- ✅ `DEPLOYMENT_GUIDE.md` - Detailed deployment instructions

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

