# 🚢 Deployment Guide

## Quick Deployment Options

### Option 1: Single Server (Recommended)
Deploy both frontend and backend together on one server.

**Steps:**
1. Copy entire `ZENSHE_FORM_STANDALONE/` folder to server
2. Install dependencies: `npm install`
3. Build frontend: `npm run build`
4. Modify `server/server.js` to serve static files (see below)
5. Start: `node server/server.js`
6. Access: `http://your-server:3001`

**Modify server/server.js:**
Add after the imports (around line 15):
```javascript
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from dist folder
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Serve index.html for all routes not matching API endpoints
app.get('*', (req, res) => {
  if (!req.path.startsWith('/submit') && !req.path.startsWith('/webhook')) {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
});
```

---

### Option 2: Separate Deployment
Deploy frontend and backend on different servers/services.

**Backend Deployment:**
1. Copy `server/` folder to backend server
2. Install: `npm install express body-parser node-fetch`
3. Start: `node server.js`
4. Note the backend URL (e.g., `https://api.yoursite.com`)

**Frontend Deployment:**
1. Update `src/App.jsx` - change `http://localhost:3001` to your backend URL
2. Build: `npm run build`
3. Upload `dist/` folder to static hosting (Netlify, Vercel, GitHub Pages, etc.)
4. Copy `public/jotform_zenshe_form.html` to hosting

**Popular Static Hosts:**
- Netlify: Drag and drop `dist/` folder
- Vercel: `vercel deploy dist/`
- GitHub Pages: Push `dist/` to gh-pages branch
- Cloudflare Pages: Connect GitHub repo

---

### Option 3: Docker (Advanced)

**Create Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["node", "server/server.js"]
```

**Build and Run:**
```bash
docker build -t zenshe-form .
docker run -p 3001:3001 -e JOTFORM_API_KEY=your_key zenshe-form
```

---

## Environment Variables

### For Production
Create `.env` file (copy from `.env.example`):
```env
JOTFORM_API_KEY=your_actual_api_key
JOTFORM_FORM_ID=your_actual_form_id
PORT=3001
FRONTEND_URL=https://your-frontend-url.com
```

### Update server/server.js to use .env:
```javascript
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.JOTFORM_API_KEY || "6bf64d24968384e5983fb2090de7e7fc";
const FORM_ID = process.env.JOTFORM_FORM_ID || "251824851270052";
const PORT = process.env.PORT || 3001;
```

Don't forget to install dotenv:
```bash
npm install dotenv
```

---

## CORS Configuration

### For Separate Deployment (Frontend on different domain)
Add CORS to `server/server.js`:

```javascript
import cors from 'cors';

// Allow frontend domain
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

Install cors:
```bash
npm install cors
```

---

## Process Management (Keep Server Running)

### Option A: PM2 (Recommended)
```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start server/server.js --name zenshe-backend

# Auto-restart on reboot
pm2 startup
pm2 save

# View logs
pm2 logs zenshe-backend

# Stop server
pm2 stop zenshe-backend
```

### Option B: Forever
```bash
# Install forever
npm install -g forever

# Start server
forever start server/server.js

# List running processes
forever list

# Stop server
forever stop server/server.js
```

### Option C: systemd (Linux)
Create `/etc/systemd/system/zenshe-form.service`:
```ini
[Unit]
Description=Zenshe Form Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/ZENSHE_FORM_STANDALONE
ExecStart=/usr/bin/node server/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Start:
```bash
sudo systemctl enable zenshe-form
sudo systemctl start zenshe-form
sudo systemctl status zenshe-form
```

---

## SSL/HTTPS Setup

### Option A: Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Add SSL with Certbot:
```bash
sudo certbot --nginx -d yourdomain.com
```

### Option B: Cloudflare (Easiest)
1. Point domain DNS to your server IP
2. Enable Cloudflare proxy (orange cloud)
3. Cloudflare automatically provides SSL
4. Your server can stay on HTTP (Cloudflare handles HTTPS)

---

## Performance Optimization

### 1. Enable Compression
Add to `server/server.js`:
```javascript
import compression from 'compression';
app.use(compression());
```

### 2. Cache Static Assets
```javascript
app.use(express.static('dist', {
  maxAge: '1d',
  etag: true
}));
```

### 3. Rate Limiting
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/submit-form', limiter);
```

---

## Monitoring & Logs

### View Logs with PM2
```bash
pm2 logs zenshe-backend
pm2 logs zenshe-backend --lines 100
```

### Add Logging to server.js
```javascript
import fs from 'fs';
import path from 'path';

const logFile = path.join(__dirname, 'server.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
  console.log(logMessage);
}

// Use in endpoints
app.post('/submit-form', async (req, res) => {
  log('📝 Form submission received');
  // ... rest of code
});
```

---

## Security Checklist

Before deploying to production:

- [ ] Change API_KEY and FORM_ID in server/server.js or use .env
- [ ] Never commit .env file to git
- [ ] Use HTTPS (SSL certificate)
- [ ] Add CORS restrictions (don't use wildcard in production)
- [ ] Add rate limiting to prevent abuse
- [ ] Validate form data before sending to JotForm
- [ ] Keep dependencies updated: `npm update`
- [ ] Use environment variables for sensitive data
- [ ] Enable server-side logging
- [ ] Set up monitoring/alerts

---

## Testing Deployment

### Local Test (Simulate Production)
```bash
# Build
npm run build

# Start server with static files
node server/server.js

# Access at http://localhost:3001
```

### Production Test Checklist
- [ ] Form loads correctly
- [ ] All fields are visible
- [ ] Date picker works
- [ ] Form submits successfully
- [ ] Success message appears
- [ ] Submission appears in JotForm dashboard
- [ ] Backend `/submissions` page works
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Works on all browsers (Chrome, Firefox, Safari, Edge)

---

## Rollback Plan

If deployment fails:

1. **Keep old version running** until new version is tested
2. **Use git tags** for each deployment:
   ```bash
   git tag -a v1.0.0 -m "Production deployment"
   git push origin v1.0.0
   ```
3. **Rollback command:**
   ```bash
   git checkout v1.0.0
   npm install
   npm run build
   pm2 restart zenshe-backend
   ```

---

## Troubleshooting Production Issues

### Server won't start
```bash
# Check if port is in use
netstat -ano | findstr :3001  # Windows
lsof -i :3001                 # Linux/Mac

# Kill process on port
kill -9 <PID>
```

### Form not loading
- Check if `dist/` folder exists (run `npm run build`)
- Check if `public/jotform_zenshe_form.html` is accessible
- Check browser console for errors
- Check server logs

### Submissions not working
- Verify API key is correct
- Verify Form ID is correct
- Check JotForm API status: https://status.jotform.com/
- Check server logs for API errors
- Test API key directly: `curl -X GET "https://api.jotform.com/user?apiKey=YOUR_KEY"`

---

## Support Resources

- [JotForm API Status](https://status.jotform.com/)
- [JotForm API Docs](https://api.jotform.com/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

## Estimated Costs

### Hosting Options (Monthly)

**Free Tier:**
- Frontend: Netlify/Vercel (free)
- Backend: Heroku/Railway (free tier)
- Total: $0/month (with limitations)

**Basic Production:**
- VPS (DigitalOcean/Linode): $5-10/month
- Domain name: ~$12/year
- SSL: Free (Let's Encrypt)
- Total: ~$6-11/month

**High Traffic:**
- VPS: $20-50/month
- CDN (Cloudflare): Free
- Monitoring: $0-20/month
- Total: ~$20-70/month

---

## Backup & Recovery

### Backup Submissions
```bash
# Download all submissions
curl "http://your-server:3001/submissions/all" > backup-$(date +%Y%m%d).json
```

### Automate Daily Backups
Add to crontab (Linux):
```bash
0 2 * * * curl "http://localhost:3001/submissions/all" > /backups/zenshe-$(date +\%Y\%m\%d).json
```

---

## Updates & Maintenance

### Update Dependencies
```bash
# Check for updates
npm outdated

# Update all
npm update

# Update specific package
npm install react@latest
```

### Update Form HTML
If you modify the JotForm:
1. Export new source code
2. Remove branding scripts
3. Replace `public/jotform_zenshe_form.html`
4. Test locally: `npm run dev`
5. Deploy: `npm run build && pm2 restart zenshe-backend`

---

## Done! 🎉

Your Zenshe form is now deployed and ready for production use!

For any issues, check:
1. Server logs
2. Browser console
3. JotForm dashboard
4. This deployment guide
