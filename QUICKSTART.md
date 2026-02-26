# 🚀 Mindsound Mindmap - Quick Start Guide

## 5-Minute Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start the Server
```bash
npm start
```

You should see:
```
🧠 Mindsound Mindmap running on http://localhost:11888
```

### Step 3: Open Your Browser
Navigate to: **http://localhost:11888**

### Step 4: Login
Use these demo credentials:

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| User | `user` | `user123` |

---

## 🎯 First Mindmap in 10 Minutes

### 1. Create a Project (1 min)
- Click "Create New Project"
- Enter project name: "My First Ideas"
- Click Create

### 2. Create a Mindmap (2 min)
- Click "Open Project"
- Click "Create New Mindmap"
- Enter name: "Brain Dump"
- Click Create

### 3. Start Editing (5 min)
- Click "Edit" on your mindmap
- Click "Add Node" to create first child idea
- Click nodes to select them
- Use right sidebar to:
  - Change text
  - Pick a color
  - Select an emoji
  - Adjust font size
  - Add notes

### 4. Save Your Work (2 min)
- Click "Save" button
- Export as PNG/JPG/JSON if desired

---

## 🛠️ Development Mode

For automatic server restart on code changes:

```bash
npm run dev
```

Requires `nodemon` (auto-installed with dependencies)

---

## 📁 File Organization

```
Your Projects and Mindmaps are stored in: /data/users.json
Backups are created daily at: /data/backups/
```

---

## 🎨 Customization

### Add More Emojis
Edit `/public/editor.html` and add to emoji picker:
```html
<div class="emoji-item" onclick="selectEmoji('🚀')">🚀</div>
```

### Change Colors
Edit `/public/js/mindmap-editor.js`:
```javascript
const COLORS = [
  '#3B82F6', // Blue
  '#F87171', // Red
  // Add more...
];
```

### Change Port
Edit `server.js`:
```javascript
const PORT = 11888; // Change this
```

---

## 🔑 Demo Accounts

### Account 1: Admin
- **Username**: `admin`
- **Password**: `admin123`
- Full access to all features

### Account 2: User
- **Username**: `user`
- **Password**: `user123`
- Full access to all features (separate workspace)

---

## 🐛 Troubleshooting

### Port 11888 Already in Use
```bash
# Find process using port
lsof -i :11888

# Kill the process, or use different port
PORT=3000 npm start
```

### Can't See Data
- Check `/data` directory exists
- Verify `users.json` is present
- Check file permissions: `ls -la data/`

### Mindmap Won't Load
- Clear browser cache
- Check browser console for errors (F12)
- Try a different browser
- Restart server: `npm start`

---

## 📚 Next Steps

1. **Create Projects** - Organize your ideas
2. **Build Mindmaps** - Map out your thoughts
3. **Customize Nodes** - Add colors, emojis, notes
4. **Export** - Share your mindmaps
5. **Explore** - Create complex hierarchies

---

## 💡 Features to Try

- ✅ Drag nodes around
- ✅ Zoom with mouse wheel
- ✅ Pan by dragging empty space
- ✅ Add multiple levels of ideas
- ✅ Change colors and sizes
- ✅ Add emojis to nodes
- ✅ Add detailed notes
- ✅ Export as PNG/JPG
- ✅ Undo/Redo changes
- ✅ Multi-user support

---

## 📖 Full Documentation

See [README.md](README.md) for comprehensive documentation.
See [DOCS.md](DOCS.md) for technical details.

---

## 🎉 You're All Set!

Start visualizing your ideas now! 🚀

Questions? Open an issue or check the full docs.
