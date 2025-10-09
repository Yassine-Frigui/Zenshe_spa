# Production Deployment Quick Start ✅

## ⚡ Quick Setup (5 minutes)

### 1. Backend Environment Variables
Copy `.env.example` to `.env` in the `backend/` folder:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set these **REQUIRED** values:
```bash
# JotForm Configuration (REQUIRED)
JOTFORM_ENABLED=true
JOTFORM_API_KEY=your_actual_jotform_api_key_here
JOTFORM_FORM_ID=your_actual_form_id_here

# Database (REQUIRED)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=zenshespa_database
DB_PORT=4306

# Security (REQUIRED - Generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Frontend URL (REQUIRED for CORS)
FRONTEND_URL=http://localhost:3000
```

### 2. Frontend Environment Variables
Copy `.env.example` to `.env` in the `frontend/` folder:
```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env` and set:
```bash
# Backend API URL (REQUIRED)
VITE_API_URL=http://localhost:5000

# JotForm Form ID (REQUIRED)
VITE_JOTFORM_FORM_ID=your_actual_form_id_here
```

### 3. Start the Application
```bash
# In the root directory
npm run dev
```

This will start both backend (port 5000) and frontend (port 3000).

---

## 🔒 Security Notes

- **NEVER** commit `.env` files to Git
- Change `JWT_SECRET` to a strong random value (at least 32 characters)
- Use HTTPS in production
- Keep API keys secure and rotate them periodically

---

## ✅ What Was Cleaned Up

All hardcoded values have been removed:
- ✅ JotForm API key (was: `6bf64d24968384e5983fb2090de7e7fc`)
- ✅ JotForm Form ID (was: `251824851270052`)
- ✅ Hardcoded `localhost:5000` URLs in frontend
- ✅ Test files deleted (check-*.js, debug-*.js, test-*.js)
- ✅ Backup route files deleted (*_backup.js, *_clean.js, *_new.js)
- ✅ Temporary files deleted (StorePage_temp.jsx, JOTFORM_TEST_GUIDE.md)

All sensitive values now MUST be configured in `.env` files before the application will run.

---

## 🚨 Common Errors & Solutions

### Error: "Missing required JotForm configuration"
**Solution:** Set `JOTFORM_API_KEY` and `JOTFORM_FORM_ID` in `backend/.env`

### Error: "VITE_API_URL must be set in environment variables"
**Solution:** Set `VITE_API_URL` in `frontend/.env`

### Error: Database connection failed
**Solution:** Check database credentials in `backend/.env` (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT)

### Images not loading in the store
**Solution:** Make sure `VITE_API_URL` is correctly set in `frontend/.env`

---

## 📚 Documentation

For detailed information, see:
- `PRODUCTION_CLEANUP_SUMMARY.md` - Full cleanup details
- `README-LOCAL-SETUP.md` - Complete setup guide
- `QUICK_REFERENCE.md` - Quick reference for common tasks

---

**Ready to Deploy! 🚀**
