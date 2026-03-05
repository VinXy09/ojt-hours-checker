# Deployment Guide - Backend to Cyclic

## Prerequisites
- GitHub account
- Your MySQL database credentials (host, user, password, database name)
- Node.js 18+ installed locally

## Step 1: Push Code to GitHub

Make sure your backend code is pushed to a GitHub repository. If you haven't created one yet:

1. Create a new repository on GitHub (e.g., `ojt-hours-counter-backend`)
2. Push your code (use `master` branch since that's what your repo uses):
```bash
cd backend
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/vinxy09/ojt-hours-counter-backend.git
git push -u origin master
```

## Step 2: Deploy to Cyclic

1. Go to [Cyclic.sh](https://cyclic.sh)
2. Sign in with your GitHub account
3. Click "Connect Repository" or "Deploy New App"
4. Select your repository (`ojt-hours-counter-backend`)
5. Cyclic will automatically detect the `cyclic.json` configuration

## Step 3: Configure Environment Variables

In the Cyclic dashboard, go to "Environment Variables" and add:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Set to production |
| `PORT` | `3000` | Cyclic uses port 3000 |
| `DB_HOST` | Your MySQL host | e.g., `localhost` or IP address |
| `DB_USER` | Your MySQL username | Your MySQL Workbench username |
| `DB_PASSWORD` | Your MySQL password | Your MySQL Workbench password |
| `DB_NAME` | Your database name | e.g., `ojt_hours_counter` |
| `JWT_SECRET` | A random secret string | Use a strong random string |
| `FRONTEND_URL` | `https://vinxy09.github.io` | Your frontend URL |

**Important:** For `DB_HOST`, since you're using MySQL Workbench locally:
- If your MySQL is on your local machine, you'll need to use a cloud MySQL database (like FreeSQLDatabase, PlanetScale, or a tunneling service like ngrok)
- Or use a free MySQL hosting service like [FreeSQLDatabase.com](https://www.freesqldatabase.com)

## Step 4: Update Frontend API URL

After deployment, you'll get a Cyclic URL like: `https://ojt-hours-counter-backend.cyclic.app`

Update your frontend to use this URL:

1. Create a `.env` file in `frontend/` directory:
```env
VITE_API_URL=https://your-cyclic-app.cyclic.app/api
```

2. Update `frontend/vite.config.js` to handle the production API:
```javascript
export default defineConfig({
  plugins: [react()],
  base: '/OJT_Hour_Checker/',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    proxy: {
      '/api': {
        target: 'https://your-cyclic-app.cyclic.app',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
```

Or simply update the `api.js` to use your Cyclic URL directly.

## Step 5: Verify Deployment

1. Visit your Cyclic app URL: `https://ojt-hours-counter-backend.cyclic.app/api/health`
2. You should see: `{"status":"OK","message":"OJT Hours Counter API is running"}`

## Troubleshooting

### Database Connection Issues
- Make sure your MySQL database allows remote connections
- Check that the database host is accessible from Cyclic
- Verify all DB_* environment variables are correct

### CORS Issues
- Ensure `FRONTEND_URL` matches your exact frontend URL (including https://)

### Common Errors
- If you see "Application error", check Cyclic logs for details
- Make sure all dependencies are in `package.json`

## Free MySQL Database Options

If you need a cloud MySQL database:

1. **FreeSQLDatabase** (https://www.freesqldatabase.com) - Free tier available
2. **PlanetScale** (https://planetscale.com) - Free tier, serverless MySQL
3. **Aiven** (https://aiven.io) - Free tier MySQL
4. **Clever Cloud** (https://clever-cloud.com) - Free tier with MySQL

## Support

- Cyclic Documentation: https://docs.cyclic.sh
- Cyclic Support: https://cyclic.sh/docs/support

