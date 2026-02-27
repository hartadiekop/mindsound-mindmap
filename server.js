const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 11888;

// Trust proxy for Cloudflare Tunnel and other reverse proxies
app.set('trust proxy', 1);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Auto-detect if behind HTTPS proxy by checking headers
app.use((req, res, next) => {
  // Detect Cloudflare or other HTTPS proxies
  const isHttpsProxy = 
    process.env.NODE_ENV === 'production' || 
    process.env.HTTPS === 'true' ||
    process.env.PROXY === 'true' ||
    req.get('cf-ray') ||  // Cloudflare Ray ID
    req.get('x-forwarded-proto') === 'https';
  
  // Store for later use
  req.app.isHttpsProxy = isHttpsProxy;
  next();
});

// Session configuration - works with both local http and https via proxy
// Use a function to dynamically set cookie secure based on protocol
const sessionConfig = {
  secret: 'mindsound-secret-key',
  resave: false,
  saveUninitialized: false,
  name: 'sessionId',  // Explicit session name
  cookie: { 
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    secure: 'auto'  // Automatically detect based on protocol
  }
};

app.use(session(sessionConfig));

// After session middleware, fix cookie secure flag for proxied HTTPS
app.use((req, res, next) => {
  // If we detect HTTPS proxy, ensure session cookie is secure
  if (req.app.isHttpsProxy && req.sessionID) {
    req.session.cookie.secure = true;
  }
  next();
});

// Ensure data directories exist
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const backupDir = path.join(dataDir, 'backups');
const mindmapsDir = path.join(dataDir, 'mindmaps');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
if (!fs.existsSync(mindmapsDir)) fs.mkdirSync(mindmapsDir);

// Initialize users file if it doesn't exist
if (!fs.existsSync(usersFile)) {
  const defaultUsers = {
    users: [
      { id: uuidv4(), username: 'admin', password: 'admin123', workspace: { projects: [] } },
      { id: uuidv4(), username: 'user', password: 'user123', workspace: { projects: [] } }
    ]
  };
  fs.writeFileSync(usersFile, JSON.stringify(defaultUsers, null, 2));
}

// Initialize backup system
const createBackup = () => {
  const timestamp = new Date().toISOString().split('T')[0];
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
  
  if (fs.existsSync(usersFile)) {
    const data = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
    
    // Keep only 5 latest backups
    const backups = fs.readdirSync(backupDir).sort().reverse();
    for (let i = 5; i < backups.length; i++) {
      fs.unlinkSync(path.join(backupDir, backups[i]));
    }
  }
};

// Create backup every day
setInterval(createBackup, 24 * 60 * 60 * 1000);
createBackup(); // Initial backup on startup

// Disable caching for development/testing
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Routes
app.get('/', (req, res) => {
  console.log(`[ROOT] Session ID: ${req.sessionID}, userId: ${req.session.userId}`);
  console.log(`[ROOT] Session content:`, { userId: req.session.userId, username: req.session.username, loggedIn: req.session.loggedIn });
  
  if (req.session.userId) {
    console.log('[ROOT] Serving dashboard.html');
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
  } else {
    console.log('[ROOT] Serving login.html');
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  console.log(`[LOGIN] Attempt: username=${username}`);
  
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
  const user = users.users.find(u => u.username === username && u.password === password);
  
  if (user) {
    console.log(`[LOGIN] Success for user: ${username}, ID: ${user.id}`);
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.loggedIn = true;
    
    console.log(`[LOGIN] Session ID: ${req.sessionID}`);
    console.log(`[LOGIN] Session data set: userId=${req.session.userId}`);
    
    // Explicitly save session with callback
    req.session.save((err) => {
      if (err) {
        console.error('[LOGIN] Session save error:', err);
        return res.status(500).json({ success: false, message: 'Session error' });
      }
      console.log(`[LOGIN] Session saved successfully. Cookie settings:`, req.session.cookie);
      // Send response with explicit headers for Cloudflare
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.json({ success: true, message: 'Login successful' });
    });
  } else {
    console.log(`[LOGIN] Failed: Invalid credentials for ${username}`);
    res.json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/user', (req, res) => {
  console.log(`[API/USER] Session ID: ${req.sessionID}, userId: ${req.session.userId}`);
  
  if (!req.session.userId) {
    console.log('[API/USER] No session - returning unauthenticated');
    return res.json({ authenticated: false });
  }
  
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
  const user = users.users.find(u => u.id === req.session.userId);
  
  if (!user) {
    console.log(`[API/USER] User not found for ID: ${req.session.userId}`);
    req.session.destroy();
    return res.json({ authenticated: false });
  }
  
  console.log(`[API/USER] Authenticated: ${user.username}`);
  res.json({ authenticated: true, user: { id: user.id, username: user.username } });
});

app.get('/api/workspace', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
  const user = users.users.find(u => u.id === req.session.userId);
  res.json({ workspace: user.workspace });
});

app.post('/api/projects', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const { name } = req.body;
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
  const user = users.users.find(u => u.id === req.session.userId);
  
  const project = {
    id: uuidv4(),
    name,
    mindmaps: [],
    createdAt: new Date().toISOString()
  };
  
  user.workspace.projects.push(project);
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  res.json({ success: true, project });
});

app.delete('/api/projects/:projectId', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const { projectId } = req.params;
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
  const user = users.users.find(u => u.id === req.session.userId);
  
  user.workspace.projects = user.workspace.projects.filter(p => p.id !== projectId);
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  res.json({ success: true });
});

app.post('/api/projects/:projectId/mindmaps', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const { projectId } = req.params;
  const { name } = req.body;
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
  const user = users.users.find(u => u.id === req.session.userId);
  const project = user.workspace.projects.find(p => p.id === projectId);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  const mindmap = {
    id: uuidv4(),
    name,
    nodes: [
      {
        id: uuidv4(),
        text: 'Central Idea',
        x: 0,
        y: 0,
        color: '#3B82F6',
        fontSize: 16,
        icon: '💡',
        notes: '',
        children: []
      }
    ],
    createdAt: new Date().toISOString()
  };
  
  project.mindmaps.push(mindmap);
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  res.json({ success: true, mindmap });
});

app.get('/api/projects/:projectId/mindmaps/:mindmapId', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const { projectId, mindmapId } = req.params;
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
  const user = users.users.find(u => u.id === req.session.userId);
  const project = user.workspace.projects.find(p => p.id === projectId);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  const mindmap = project.mindmaps.find(m => m.id === mindmapId);
  if (!mindmap) {
    return res.status(404).json({ error: 'Mindmap not found' });
  }
  
  res.json({ mindmap });
});

app.put('/api/projects/:projectId/mindmaps/:mindmapId', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const { projectId, mindmapId } = req.params;
  const { nodes } = req.body;
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
  const user = users.users.find(u => u.id === req.session.userId);
  const project = user.workspace.projects.find(p => p.id === projectId);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  const mindmap = project.mindmaps.find(m => m.id === mindmapId);
  if (!mindmap) {
    return res.status(404).json({ error: 'Mindmap not found' });
  }
  
  mindmap.nodes = nodes;
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  res.json({ success: true });
});

app.delete('/api/projects/:projectId/mindmaps/:mindmapId', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const { projectId, mindmapId } = req.params;
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
  const user = users.users.find(u => u.id === req.session.userId);
  const project = user.workspace.projects.find(p => p.id === projectId);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  project.mindmaps = project.mindmaps.filter(m => m.id !== mindmapId);
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`🧠 Mindsound Mindmap running on http://localhost:${PORT}`);
});
