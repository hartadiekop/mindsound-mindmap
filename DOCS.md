# Mindsound Mindmap - Technical Documentation

## Project Overview

**Mindsound Mindmap** is a sophisticated, real-time collaborative mindmapping application designed to help users visualize, organize, and develop their ideas in an intuitive and visually stunning interface.

## Architecture

### Backend
- **Framework**: Express.js (Node.js)
- **Port**: 11888
- **Database**: JSON-based file system
- **Session Management**: express-session
- **File Format**: JSON

### Frontend
- **UI Framework**: Tailwind CSS
- **Icons**: Font Awesome 6.4.0
- **Canvas**: HTML5 Canvas API
- **Architecture**: Plain JavaScript (Vanilla JS)

## Project Structure

```
mindsound-mindmap/
├── server.js                 # Main Express server
├── package.json             # Project dependencies
├── .gitignore              # Git ignore rules
├── data/                   # Data storage directory
│   ├── users.json         # User credentials and workspaces
│   ├── backups/           # Daily backup files
│   └── mindmaps/          # Future: Mindmap storage
├── public/                # Frontend assets
│   ├── login.html        # Login page
│   ├── dashboard.html    # Project dashboard
│   ├── project.html      # Project mindmaps view
│   ├── editor.html       # Mindmap editor
│   └── js/
│       ├── dashboard.js  # Dashboard logic
│       ├── project.js    # Project logic
│       └── mindmap-editor.js  # Editor logic
└── README.md            # Project documentation
```

## Features

### 1. Authentication System
- Multi-user support
- Simple username/password authentication
- Session-based access control
- Hardcoded users in `data/users.json`

Default credentials:
- **Admin**: username: `admin` | password: `admin123`
- **User**: username: `user` | password: `user123`

### 2. Workspace Management
- One workspace per user
- Unlimited projects within workspace
- Unlimited mindmaps per project
- Real-time workspace synchronization

### 3. Mindmap Features
- **Node Management**
  - Create/edit/delete nodes
  - Drag-and-drop positioning
  - Parent-child relationships
  - Central idea node (cannot be deleted)

- **Visual Customization**
  - 8 beautiful color presets
  - Custom text size (10-40px)
  - Emoji/icon support (16+ emojis included)
  - Auto-color function for random color selection
  - Beautiful gradient connections between nodes

- **Interactive Canvas**
  - Zoom in/out with mouse wheel
  - Pan/drag canvas
  - Touch-friendly for mobile devices
  - Real-time rendering

- **Node Properties**
  - Text content
  - Color customization
  - Font size adjustment
  - Icon/emoji selection
  - Popup notes (up to 1000 characters)

- **Advanced Editing**
  - Undo/Redo functionality (full history)
  - Real-time save capabilities
  - Auto-save indicators

### 4. Export Functionality
- **PNG Export**: High-quality image export
- **JPG Export**: Compressed image export
- **JSON Export**: Data backup and sharing format

### 5. Database & Backup System
- JSON-based file storage
- Automatic daily backups
- Backup rotation (keeps latest 5 backups)
- Backup location: `/data/backups/`

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user info

### Workspace
- `GET /api/workspace` - Get user workspace

### Projects
- `POST /api/projects` - Create new project
- `DELETE /api/projects/:projectId` - Delete project

### Mindmaps
- `POST /api/projects/:projectId/mindmaps` - Create new mindmap
- `GET /api/projects/:projectId/mindmaps/:mindmapId` - Get mindmap
- `PUT /api/projects/:projectId/mindmaps/:mindmapId` - Update mindmap
- `DELETE /api/projects/:projectId/mindmaps/:mindmapId` - Delete mindmap

## Data Models

### User Model
```json
{
  "id": "uuid",
  "username": "string",
  "password": "string",
  "workspace": {
    "projects": []
  }
}
```

### Project Model
```json
{
  "id": "uuid",
  "name": "string",
  "mindmaps": [],
  "createdAt": "ISO8601"
}
```

### Mindmap Model
```json
{
  "id": "uuid",
  "name": "string",
  "nodes": [],
  "createdAt": "ISO8601"
}
```

### Node Model
```json
{
  "id": "uuid",
  "text": "string",
  "x": "number",
  "y": "number",
  "radius": "number",
  "color": "hex-color",
  "fontSize": "number",
  "icon": "emoji",
  "notes": "string",
  "parentId": "uuid or null",
  "children": []
}
```

## Installation & Setup

### Prerequisites
- Node.js 16.0.0 or higher
- npm or yarn

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/hartadiekop/mindsound-mindmap.git
   cd mindsound-mindmap
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open your browser and navigate to: `http://localhost:11888`
   - Login with demo credentials

## Development Guide

### Adding New Features

1. **Backend Endpoint**: Add route in `server.js`
2. **API Call**: Add fetch call in relevant JS file
3. **Frontend UI**: Update HTML file
4. **Styling**: Use Tailwind classes

### Customizing Colors

Edit the `COLORS` array in `mindmap-editor.js`:
```javascript
const COLORS = [
  '#3B82F6', // Blue
  '#F87171', // Red
  // Add more colors...
];
```

### Adding More Emojis

Edit the emoji picker section in `editor.html`:
```html
<div class="emoji-item" onclick="selectEmoji('🚀')">🚀</div>
```

## Performance Considerations

- JSON-based database suitable for small to medium deployments
- Canvas rendering optimized for smooth 60fps
- Zoom level capped at 0.1x to 3x
- History limited by browser memory (typically 100+ states)

## Browser Compatibility

- Chrome/Chromium: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Edge: ✅ Full support
- Mobile browsers: ✅ Touch support enabled

## Future Enhancements

- [ ] Real-time collaborative editing
- [ ] Cloud storage integration
- [ ] Advanced search and filtering
- [ ] Mindmap templates
- [ ] AI-powered suggestions
- [ ] Dark mode
- [ ] Multiple language support
- [ ] Advanced analytics

## Security Notes

⚠️ **Important**: This is a demo application. For production:
1. Move credentials to environment variables
2. Implement proper authentication (OAuth, JWT)
3. Add HTTPS support
4. Implement rate limiting
5. Add input validation and sanitization
6. Encrypt database files
7. Add audit logging

## Troubleshooting

### Server won't start
- Check if port 11888 is already in use
- Ensure Node.js is properly installed
- Try: `npm install` again

### Data not persisting
- Check if `/data` directory exists and is writable
- Verify file permissions
- Check server console for errors

### Mindmap not rendering
- Clear browser cache
- Check browser console for errors
- Verify canvas element is present in DOM

## Code Style

- ES6+ JavaScript
- Tailwind CSS for styling
- Semantic HTML5
- Consistent indentation (2 spaces)

## License

MIT License - See LICENSE file for details

## Support

For issues and feature requests, please visit the GitHub repository issues page.
