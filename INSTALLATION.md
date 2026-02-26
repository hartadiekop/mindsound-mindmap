# 🚀 Mindsound Mindmap - Installation Guide

## 📋 System Requirements

### Minimum Requirements
- **Operating System**: Linux, Windows, or macOS
- **Node.js**: Version 16.0.0 or higher
- **npm**: Version 7.0.0 or higher
- **RAM**: 512MB minimum
- **Disk Space**: 100MB minimum
- **Port**: 11888 (configurable)

### Recommended Specifications
- **RAM**: 2GB or higher
- **Disk Space**: 500MB
- **Network**: Stable internet for initial setup
- **Browser**: Chrome, Firefox, Safari, or Edge (latest versions)

---

## 📦 Installation Steps

### Step 1: Verify Prerequisites

Check your Node.js version:
```bash
node --version
# Should output: v16.x.x or higher
```

Check npm version:
```bash
npm --version
# Should output: 7.x.x or higher
```

### Step 2: Clone the Repository

```bash
git clone https://github.com/hartadiekop/mindsound-mindmap.git
cd mindsound-mindmap
```

Or download the ZIP file and extract it.

### Step 3: Install Dependencies

```bash
npm install
```

**Expected output:**
```
added 223 packages, and audited 224 packages in 30s
```

> **Note**: You may see warnings about deprecated packages. These are normal and don't affect functionality.

### Step 4: Verify Installation

Check if all files are present:
```bash
ls -la
# You should see: package.json, server.js, public/, README.md, etc.
```

### Step 5: Start the Server

```bash
npm start
```

**Expected output:**
```
🧠 Mindsound Mindmap running on http://localhost:11888
```

### Step 6: Access the Application

Open your web browser and navigate to:
```
http://localhost:11888
```

You should see the elegant login page.

---

## 🔑 Initial Login

Use these demo credentials:

| Account | Username | Password |
|---------|----------|----------|
| Admin Account | `admin` | `admin123` |
| User Account | `user` | `user123` |

> ⚠️ **Security Note**: Change these credentials in production!

---

## 📁 Directory Structure After Installation

```
mindsound-mindmap/
├── node_modules/              # Dependencies (auto-created)
├── public/                     # Frontend files
│   ├── login.html             # Login page
│   ├── dashboard.html         # Project dashboard
│   ├── project.html           # Mindmap list
│   ├── editor.html            # Mindmap editor
│   └── js/
│       ├── dashboard.js       # Dashboard logic
│       ├── project.js         # Project logic
│       └── mindmap-editor.js  # Editor logic
├── data/                       # Data storage (auto-created)
│   ├── users.json            # User accounts
│   ├── mindmaps/             # Mindmap files
│   └── backups/              # Backup files
├── server.js                  # Express server
├── package.json              # Dependencies list
├── README.md                 # Main documentation
├── DOCS.md                   # Technical docs
├── FEATURES.md               # Features list
├── QUICKSTART.md             # Quick start guide
├── LICENSE                   # MIT License
└── .env.example              # Environment template
```

---

## 🛠️ Configuration

### Change Port

Edit `server.js` and modify:
```javascript
const PORT = 11888; // Change to any available port
```

Then restart the server.

### Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Then edit `.env` with your settings:
```
PORT=11888
NODE_ENV=development
```

---

## 🚀 Running Modes

### Production Mode
```bash
npm start
```

### Development Mode (with auto-reload)
```bash
npm run dev
```

Requires `nodemon` (included in dependencies).

---

## ✅ Verification Checklist

After installation, verify:

- [ ] Server starts without errors
- [ ] Can access http://localhost:11888
- [ ] Login page displays correctly
- [ ] Can login with demo credentials
- [ ] Dashboard loads after login
- [ ] Can create a project
- [ ] Can create a mindmap
- [ ] Can open editor
- [ ] Canvas renders properly
- [ ] Can add nodes to mindmap
- [ ] Can save mindmap
- [ ] Can export mindmap

---

## 🐛 Troubleshooting Installation Issues

### Issue: "npm: command not found"

**Solution**: Install Node.js from https://nodejs.org/

### Issue: Port 11888 Already in Use

**Solution 1**: Use a different port:
```bash
PORT=3000 npm start
```

**Solution 2**: Find and stop the process using port 11888:
```bash
# On macOS/Linux
lsof -i :11888
kill -9 <PID>

# On Windows
netstat -ano | findstr :11888
taskkill /PID <PID> /F
```

### Issue: Permission Denied

**Solution**: Ensure proper permissions:
```bash
chmod 755 data/
chmod 644 data/users.json
```

### Issue: Cannot Find Module

**Solution**: Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Cannot GET /"

**Solution**: Ensure server is running and navigate to correct port.

### Issue: Data Not Persisting

**Solution**: Check `/data` directory exists and is writable:
```bash
ls -la data/
# Should show: users.json, backups/, mindmaps/
```

---

## 📚 Next Steps After Installation

1. **Read Quick Start**: See [QUICKSTART.md](QUICKSTART.md)
2. **Explore Features**: See [FEATURES.md](FEATURES.md)
3. **Check Documentation**: See [DOCS.md](DOCS.md)
4. **Build Mindmaps**: Start creating!

---

## 🔐 Security After Installation

### For Production Deployment:

1. **Change Demo Credentials**
   Edit `/data/users.json` and change usernames/passwords

2. **Enable HTTPS**
   Use reverse proxy (nginx) or add certificates

3. **Set Environment to Production**
   ```
   NODE_ENV=production
   ```

4. **Add Input Validation**
   Sanitize all user inputs

5. **Enable Backups**
   Ensure backups are running daily

6. **Monitor Logs**
   Set up application logging

---

## 🎯 Common Post-Installation Tasks

### Add New User

Edit `/data/users.json`:
```json
{
  "id": "unique-id",
  "username": "newuser",
  "password": "securepassword",
  "workspace": { "projects": [] }
}
```

### Restore from Backup

Copy backup file to replace:
```bash
cp data/backups/backup-2026-02-26.json data/users.json
```

### Export All Data

```bash
cp -r data/ data-backup-$(date +%Y%m%d)/
```

---

## 📊 System Monitoring

### Check Server Status

Access logs in console output.

### Monitor Disk Usage

```bash
du -sh data/
```

### Check Backup Age

```bash
ls -la data/backups/
```

---

## 🆘 Getting Help

If you encounter issues:

1. **Check Logs**: Look at server console output
2. **Check Browser Console**: Press F12 in browser
3. **Check Files**: Verify `/data` directory structure
4. **Review Docs**: See [DOCS.md](DOCS.md)
5. **Open Issue**: GitHub issues page

---

## 📝 Installation Log Example

When everything is working, your installation log should show:

```
$ npm install
added 223 packages, and audited 224 packages in 30s

$ npm start
🧠 Mindsound Mindmap running on http://localhost:11888
```

Then in browser:
- Login page loads ✅
- Can login with admin/admin123 ✅
- Dashboard shows after login ✅
- Can create project ✅
- Can create mindmap ✅
- Editor loads and renders ✅

---

## 🎉 Success!

Congratulations! Mindsound Mindmap is now installed and ready to use.

**Quick Links:**
- 🌐 Application: http://localhost:11888
- 📖 Documentation: [DOCS.md](DOCS.md)
- 🚀 Quick Start: [QUICKSTART.md](QUICKSTART.md)
- ✨ Features: [FEATURES.md](FEATURES.md)

---

**Version**: 1.0.0  
**Last Updated**: February 2026
