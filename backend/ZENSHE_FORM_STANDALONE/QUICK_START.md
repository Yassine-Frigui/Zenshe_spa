# 🚀 Quick Start Guide

## ⚡ 3-Minute Setup

### Step 1: Install
```bash
npm install
```

### Step 2: Configure
Open `server/server.js` and change lines 9-10:
```javascript
const API_KEY = "YOUR_API_KEY";  // Get from https://www.jotform.com/myaccount/api
const FORM_ID = "YOUR_FORM_ID";  // Get from form URL
```

### Step 3: Start
```bash
npm start
```

### Step 4: Open
Go to `http://localhost:5173` in your browser

---

## 📦 What You Get

This single folder contains **everything**:
- ✅ React frontend (the form)
- ✅ Express backend (API integration)
- ✅ JotForm HTML (cleaned, no branding)
- ✅ Submission handling (fetch, display, submit)

**No external files needed!** Export this folder anywhere.

---

## 🎯 Common Commands

| What You Want | Command |
|--------------|---------|
| Install dependencies | `npm install` |
| Start everything | `npm start` |
| Start frontend only | `npm run dev` |
| Start backend only | `npm run server` |
| Build for production | `npm run build` |

---

## 🔧 File Structure (Simplified)

```
ZENSHE_FORM_STANDALONE/
├── server/server.js          ← Backend (change API keys here)
├── src/App.jsx               ← Frontend React component
├── public/jotform_...html    ← Form HTML (already cleaned)
└── package.json              ← Dependencies
```

---

## 🐛 Quick Fixes

### Backend won't start
```bash
npm install
```

### Can't submit form
1. Check `server/server.js` lines 9-10 (API key & Form ID)
2. Make sure backend is running (`npm run server`)

### Frontend shows errors
```bash
npm install
npm run dev
```

---

## 📋 Backend Endpoints

| Endpoint | What It Does |
|----------|-------------|
| `http://localhost:3001/` | Backend homepage |
| `http://localhost:3001/submissions` | View all submissions (HTML) |
| `http://localhost:3001/submissions/all` | Get submissions (JSON) |
| `http://localhost:3001/submit-form` | Submit form data |

---

## 🎨 Customization

### Change card color
Edit `src/App.css`:
```css
.form-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* Change these colors ↑ */
}
```

### Change card height
Edit `src/App.css`:
```css
.form-container {
  max-height: 85vh; /* Change this */
}
```

### Change backend port
1. Edit `server/server.js`: `const PORT = 3001;`
2. Edit `src/App.jsx`: Change `http://localhost:3001` to your new port

---

## ✅ Testing

After starting (`npm start`):

1. ✅ Go to `http://localhost:5173` - Should see the form
2. ✅ Fill out the form and click "Envoyer"
3. ✅ Should see success message
4. ✅ Go to `http://localhost:3001/submissions` - Should see your submission
5. ✅ Check JotForm dashboard - Should see submission there too

---

## 🚢 Export & Deploy

### To export this folder:
1. Just copy the entire `ZENSHE_FORM_STANDALONE/` folder
2. That's it! Everything is included.

### To deploy:
1. Upload folder to your server
2. Run `npm install`
3. Run `npm start` (or use PM2/forever for production)
4. Access at `http://your-server-ip:3001`

---

## 📞 Need Help?

1. Check `README.md` for detailed documentation
2. Check browser console (F12) for errors
3. Check terminal where backend is running for logs

---

## 🎉 Done!

You now have a fully functional, self-contained form application!

**Remember:** Update API keys in `server/server.js` before using.
