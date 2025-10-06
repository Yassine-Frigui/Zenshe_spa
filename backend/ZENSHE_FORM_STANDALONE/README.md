# 🌿 Zenshe Steam Therapy Form - Standalone Package

## 📦 What's Inside

This is a **completely self-contained** form application that includes:
- ✅ **React Frontend** (Vite + React 19)
- ✅ **Express Backend** with JotForm API integration
- ✅ **Form HTML** (cleaned, branding-free)
- ✅ **All submission handling** (fetch, parse, display)

**This single directory contains everything you need!** No external dependencies on other folders.

---

## 🚀 Quick Start

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Configure API Keys
Edit `server/server.js` and update:
```javascript
const API_KEY = "YOUR_JOTFORM_API_KEY";
const FORM_ID = "YOUR_FORM_ID";
```

### 3️⃣ Start Everything
```bash
npm start
```

This will start:
- ✅ Backend server on `http://localhost:3001`
- ✅ Frontend dev server on `http://localhost:5173`

### 4️⃣ Open Your Browser
Navigate to `http://localhost:5173` to see the form!

---

## 📂 Directory Structure

```
ZENSHE_FORM_STANDALONE/
├── server/
│   └── server.js              # Backend with JotForm API integration
├── src/
│   ├── App.jsx                # Main React component
│   ├── App.css                # Purple gradient card styling
│   └── main.jsx               # React entry point
├── public/
│   └── jotform_zenshe_form.html  # Cleaned form HTML (no branding)
├── index.html                 # Vite HTML entry
├── vite.config.js             # Vite configuration
├── package.json               # All dependencies
└── README.md                  # This file
```

---

## 🎯 Available Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm start` | Start both frontend + backend (development) |
| `npm run dev` | Start frontend only (Vite dev server) |
| `npm run server` | Start backend only (Express server) |
| `npm run build` | Build frontend for production |
| `npm run preview` | Preview production build |
| `npm start:prod` | Build + start production servers |

---

## 🔧 Backend API Endpoints

The backend server (`server/server.js`) provides:

### 📋 View Submissions
```
GET http://localhost:3001/submissions?limit=10&offset=0
```
Returns paginated submissions in beautiful HTML format.

### 📋 Get All Submissions (JSON)
```
GET http://localhost:3001/submissions/all?limit=100
```
Returns all submissions as JSON for programmatic access.

### 📝 Submit Form
```
POST http://localhost:3001/submit-form
```
Accepts form data and forwards to JotForm API.

### 🏠 Homepage
```
GET http://localhost:3001/
```
Backend status page with quick links.

---

## 🌟 Key Features

### Frontend Features
- ✅ **Purple gradient card** with smooth scrolling (85vh max height)
- ✅ **No JotForm branding** (completely removed at source)
- ✅ **Date picker working** (sequential script loading)
- ✅ **Form submission interception** (sends to backend)
- ✅ **Success/error alerts** in French
- ✅ **Form auto-reset** after successful submission

### Backend Features
- ✅ **90+ field mapping** with proper French labels
- ✅ **Matrix questions** properly parsed (unique sub-questions)
- ✅ **Hidden fields filtered** (25 fields removed from display)
- ✅ **Repeating labels disambiguated** (numbered for clarity)
- ✅ **Pagination support** (efficient large dataset handling)
- ✅ **Beautiful HTML display** with sections and styling
- ✅ **Form submission endpoint** (forwards to JotForm API)

---

## 🔐 API Configuration

### Where to Find Your API Key
1. Go to https://www.jotform.com/myaccount/api
2. Copy your API key
3. Paste it in `server/server.js` (line 9)

### Where to Find Your Form ID
1. Go to https://www.jotform.com/myforms
2. Click on your form
3. Look at the URL: `https://www.jotform.com/build/XXXXXXXXXX`
4. The number is your Form ID
5. Paste it in `server/server.js` (line 10)

**Current Configuration:**
```javascript
const API_KEY = "6bf64d24968384e5983fb2090de7e7fc";  // ⚠️ Change this!
const FORM_ID = "251824851270052";                   // ⚠️ Change this!
```

---

## 📡 Form Submission Flow

```
User fills form in browser
         ↓
Frontend intercepts submit (App.jsx)
         ↓
POST to http://localhost:3001/submit-form
         ↓
Backend receives data (server.js)
         ↓
Backend converts format (form data → JotForm API format)
         ↓
Backend POSTs to JotForm API
         ↓
JotForm stores submission
         ↓
Backend returns success/error to frontend
         ↓
Frontend shows alert + resets form
```

---

## 🎨 Customization

### Change Card Color
Edit `src/App.css`:
```css
.form-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* Change colors here */
}
```

### Change Card Height
Edit `src/App.css`:
```css
.form-container {
  max-height: 85vh; /* Change height here */
}
```

### Change Backend Port
Edit `server/server.js`:
```javascript
const PORT = 3001; // Change port here
```

Then update `src/App.jsx`:
```javascript
fetch('http://localhost:3001/submit-form', { /* ... */ })
// Change to match your new port ↑
```

### Add CORS for External Access
Edit `server/server.js` and add after imports:
```javascript
import cors from 'cors';
app.use(cors()); // Add after app initialization
```

Don't forget to install:
```bash
npm install cors
```

---

## 🐛 Troubleshooting

### Backend won't start
**Problem:** `Error: Cannot find module 'express'`
**Solution:** Run `npm install` to install dependencies

### Frontend can't connect to backend
**Problem:** `CORS error` in browser console
**Solution:** Add CORS middleware (see Customization section)

### Form submission fails
**Problem:** API key or Form ID incorrect
**Solution:** 
1. Check `server/server.js` lines 9-10
2. Verify API key at https://www.jotform.com/myaccount/api
3. Verify Form ID matches your actual form

### Date picker not working
**Problem:** Scripts not loading properly
**Solution:** The current code loads scripts sequentially - should work automatically. If not, check browser console for errors.

### Submissions not appearing
**Problem:** Submission successful but not visible
**Solution:**
1. Check backend logs in terminal (should show "📝 Form submission received")
2. Check JotForm dashboard: https://www.jotform.com/myforms
3. Verify Form ID is correct

---

## 🚢 Deployment

### Deploy Backend (Node.js)
1. Upload `server/` directory to your server
2. Install dependencies: `npm install express body-parser node-fetch`
3. Start server: `node server/server.js`
4. Server will run on port 3001

### Deploy Frontend (Static Hosting)
1. Build frontend: `npm run build`
2. Upload `dist/` directory to static hosting (Netlify, Vercel, etc.)
3. Update API URLs in `src/App.jsx` to point to your deployed backend

### Deploy Both Together (Single Server)
1. Build frontend: `npm run build`
2. Modify `server/server.js` to serve static files:
```javascript
import path from 'path';
app.use(express.static(path.join(process.cwd(), 'dist')));
```
3. Upload everything to server
4. Run: `node server/server.js`
5. Access at: `http://your-server:3001`

---

## 📊 Field Mapping

The backend includes comprehensive field mapping for 90+ form fields:

- ✅ Client Information (Name, Email, Phone, DOB, Anatomy, Pronouns)
- ✅ Practitioner Information (Name, Company, Email)
- ✅ Client Responses (Steam experience, Main concern, Additional info)
- ✅ Medical History & Contraindications
- ✅ Sensitivities & Indications
- ✅ Treatment Recommendations
- ✅ Session Configuration
- ✅ Signatures & Dates

All fields are displayed with **proper French labels** and organized into **logical sections**.

---

## 🔄 Updates & Maintenance

### Update JotForm HTML
If you modify your JotForm and need to update the form:
1. Export your JotForm source code
2. Remove branding scripts (see BRANDING_REMOVAL_GUIDE.md in parent directory)
3. Replace `public/jotform_zenshe_form.html`
4. Restart frontend: `npm run dev`

### Update Field Mapping
If you add/remove form fields:
1. Edit `server/server.js`
2. Find `FIELD_MAPPING` object (around line 25)
3. Add/remove field mappings
4. Restart backend: `npm run server`

### Update Styling
1. Edit `src/App.css` for card styling
2. Edit `server/server.js` for submission display styling (inline CSS in HTML templates)

---

## 📚 Additional Resources

### Documentation Files (in parent directory)
- `FORM_SUBMISSION_GUIDE.md` - Complete submission flow documentation
- `BRANDING_REMOVAL_COMPLETE.md` - How branding was removed
- `FIELD_MAPPING_COMPLETE.md` - Complete field mapping reference
- `PRODUCTION_GUIDE.md` - Production deployment guide

### External Resources
- [JotForm API Documentation](https://api.jotform.com/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Express Documentation](https://expressjs.com/)

---

## ✅ Testing Checklist

Before deploying, verify:

- [ ] `npm install` completes without errors
- [ ] Backend starts successfully (`npm run server`)
- [ ] Frontend starts successfully (`npm run dev`)
- [ ] Form displays correctly in browser
- [ ] Date picker works
- [ ] Form submission shows success alert
- [ ] Submission appears in `/submissions` endpoint
- [ ] Submission appears in JotForm dashboard
- [ ] No console errors in browser
- [ ] No JotForm branding visible

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the documentation files in parent directory
3. Check browser console for error messages
4. Check backend terminal logs for errors

---

## 📄 License

This is a custom integration for Zenshe Steam Therapy. Form data is stored in JotForm.

---

## 🎉 You're All Set!

This package is completely self-contained and ready to use. Just:
1. `npm install`
2. Update API keys in `server/server.js`
3. `npm start`
4. Open `http://localhost:5173`

Enjoy your Zenshe form! 🌿✨
