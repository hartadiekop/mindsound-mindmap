// Global state
let currentUser = null;
let currentProject = null;
let currentMindmap = null;
let selectedNode = null;
let canvas = null;
let ctx = null;
let zoom = 1;
let panX = 0;
let panY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let isDrawing = false;
let history = [];
let historyIndex = -1;

const COLORS = [
  '#3B82F6', // Blue
  '#F87171', // Red
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1'  // Indigo
];

async function checkAuth() {
  const response = await fetch('/api/user');
  const data = await response.json();

  if (!data.authenticated) {
    window.location.href = '/';
  } else {
    currentUser = data.user;
    initializeEditor();
  }
}

async function initializeEditor() {
  const projectId = sessionStorage.getItem('currentProjectId');
  const mindmapId = sessionStorage.getItem('currentMindmapId');

  if (!projectId || !mindmapId) {
    window.location.href = '/';
    return;
  }

  try {
    const response = await fetch(`/api/projects/${projectId}/mindmaps/${mindmapId}`);
    const data = await response.json();
    currentMindmap = data.mindmap;
    currentProject = projectId;

    document.getElementById('mindmapTitle').textContent = currentMindmap.name;

    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    resizeCanvas();
    setupCanvasListeners();
    setupUIListeners();
    draw();

    // Save initial state to history
    saveHistory();
  } catch (error) {
    console.error('Error loading mindmap:', error);
    window.location.href = '/';
  }
}

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  draw();
}

function setupCanvasListeners() {
  // Mouse events
  canvas.addEventListener('mousedown', handleCanvasMouseDown);
  canvas.addEventListener('mousemove', handleCanvasMouseMove);
  canvas.addEventListener('mouseup', handleCanvasMouseUp);
  canvas.addEventListener('mouseout', handleCanvasMouseOut);
  canvas.addEventListener('wheel', handleCanvasWheel);

  // Touch events
  canvas.addEventListener('touchstart', handleTouchStart);
  canvas.addEventListener('touchmove', handleTouchMove);
  canvas.addEventListener('touchend', handleTouchEnd);

  // Window resize
  window.addEventListener('resize', resizeCanvas);
}

function handleCanvasMouseDown(e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left - panX) / zoom;
  const y = (e.clientY - rect.top - panY) / zoom;

  const clickedNode = findNodeAtPosition(x, y);

  if (clickedNode) {
    selectedNode = clickedNode;
    updateSidebar();
    isDrawing = true;
    dragStartX = x;
    dragStartY = y;
  } else {
    selectedNode = null;
    updateSidebar();
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
  }

  draw();
}

function handleCanvasMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left - panX) / zoom;
  const y = (e.clientY - rect.top - panY) / zoom;

  if (isDrawing && selectedNode) {
    const radius = calculateNodeRadius(selectedNode);
    selectedNode.x = x - radius;
    selectedNode.y = y - radius;
    draw();
  } else if (isDragging) {
    panX += e.clientX - dragStartX;
    panY += e.clientY - dragStartY;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    draw();
  }
}

function handleCanvasMouseUp() {
  if (isDrawing) {
    saveHistory();
  }
  isDrawing = false;
  isDragging = false;
}

function handleCanvasMouseOut() {
  isDrawing = false;
  isDragging = false;
}

function handleCanvasWheel(e) {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
  const newZoom = Math.max(0.1, Math.min(3, zoom * zoomDelta));

  panX = x - (x - panX) * (newZoom / zoom);
  panY = y - (y - panY) * (newZoom / zoom);
  zoom = newZoom;

  draw();
}

function handleTouchStart(e) {
  if (e.touches.length === 1) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches[0].clientX - rect.left - panX) / zoom;
    const y = (e.touches[0].clientY - rect.top - panY) / zoom;

    const clickedNode = findNodeAtPosition(x, y);
    if (clickedNode) {
      selectedNode = clickedNode;
      updateSidebar();
      isDrawing = true;
      dragStartX = x;
      dragStartY = y;
    } else {
      isDragging = true;
      dragStartX = e.touches[0].clientX;
      dragStartY = e.touches[0].clientY;
    }
  }
  draw();
}

function handleTouchMove(e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.touches[0].clientX - rect.left - panX) / zoom;
  const y = (e.touches[0].clientY - rect.top - panY) / zoom;

  if (isDrawing && selectedNode) {
    const radius = calculateNodeRadius(selectedNode);
    selectedNode.x = x - radius;
    selectedNode.y = y - radius;
    draw();
  } else if (isDragging) {
    panX += e.touches[0].clientX - dragStartX;
    panY += e.touches[0].clientY - dragStartY;
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
    draw();
  }
}

function handleTouchEnd() {
  if (isDrawing) {
    saveHistory();
  }
  isDrawing = false;
  isDragging = false;
}

function findNodeAtPosition(x, y) {
  // Search from last to first (top layers first)
  for (let i = currentMindmap.nodes.length - 1; i >= 0; i--) {
    const node = currentMindmap.nodes[i];
    const nodeRadius = calculateNodeRadius(node);
    const dx = x - (node.x + nodeRadius);
    const dy = y - (node.y + nodeRadius);
    if (Math.sqrt(dx * dx + dy * dy) < nodeRadius) {
      return node;
    }
  }
  return null;
}

function wrapText(text, maxWidth, fontSize, context) {
  // Helper function to calculate text lines with wrapping
  // First, split by newlines to respect user's manual line breaks
  const manualLines = text.split('\n');
  const allLines = [];
  
  for (const manualLine of manualLines) {
    // For each manual line, split by spaces and wrap if too long
    const words = manualLine.split(' ');
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? currentLine + ' ' + word : word;
      const metrics = context.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        if (currentLine) allLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      allLines.push(currentLine);
    }
  }
  
  return allLines;
}

function calculateNodeRadius(node) {
  // Calculate radius based on font size, text length, and multi-line support
  const fontSize = node.fontSize || 16;
  const text = node.text || 'Node';
  
  // Base padding
  const basePadding = 15;
  const iconSize = fontSize;
  
  // Minimum radius: at least large enough for icon + padding
  // Increased significantly to accommodate larger font sizes (up to 40px)
  const minRadius = Math.max(fontSize + 25, 50);
  
  // Count actual lines from newline characters
  const manualLines = text.split('\n');
  const manualLineCount = manualLines.length;
  
  // Calculate needed width based on longest line
  // Estimate: average character width is about 0.5 * fontSize
  const avgCharWidth = fontSize * 0.5;
  const longestLine = Math.max(...manualLines.map(line => line.length));
  const maxTextWidth = longestLine * avgCharWidth;
  
  // Total height needed: icon + spacing + (text lines * line height)
  const lineHeight = fontSize * 1.2;
  const totalHeight = iconSize + 10 + (manualLineCount * lineHeight) + basePadding;
  
  // Radius needs to fit both width and height
  const radiusFromWidth = Math.max(maxTextWidth / 2 + basePadding, 35);
  const radiusFromHeight = Math.max(totalHeight / 2, 35);
  
  const requiredRadius = Math.max(radiusFromWidth, radiusFromHeight, minRadius);
  
  // Cap at reasonable size, but allow larger for big text
  return Math.min(requiredRadius, 150);
}

function draw() {
  // Clear canvas
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(panX, panY);
  ctx.scale(zoom, zoom);

  // Draw connections
  for (const node of currentMindmap.nodes) {
    if (node.parentId) {
      const parent = currentMindmap.nodes.find(n => n.id === node.parentId);
      if (parent) {
        drawConnection(parent, node);
      }
    }
  }

  // Draw nodes
  for (const node of currentMindmap.nodes) {
    drawNode(node, node === selectedNode);
  }

  ctx.restore();

  // Draw grid for reference (optional)
  drawGrid();
}

function drawConnection(parent, child) {
  const parentRadius = calculateNodeRadius(parent);
  const childRadius = calculateNodeRadius(child);
  
  const fromX = parent.x + parentRadius;
  const fromY = parent.y + parentRadius;
  const toX = child.x + childRadius;
  const toY = child.y + childRadius;

  // Curve color matches parent color
  ctx.strokeStyle = parent.color || '#3B82F6';
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.6;

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);

  // Quadratic curve
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  ctx.quadraticCurveTo(midX, midY, toX, toY);
  ctx.stroke();

  ctx.globalAlpha = 1;
}

function drawNode(node, isSelected) {
  const x = node.x;
  const y = node.y;
  const r = calculateNodeRadius(node);
  const fontSize = node.fontSize || 16;
  const iconSize = fontSize;

  // Shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Draw circle
  ctx.fillStyle = node.color || '#3B82F6';
  ctx.beginPath();
  ctx.arc(x + r, y + r, r, 0, Math.PI * 2);
  ctx.fill();

  // Selection ring
  if (isSelected) {
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x + r, y + r, r + 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.shadowColor = 'transparent';

  // Draw icon and text
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const icon = node.icon || '💡';
  const text = node.text || 'Node';

  // Prepare text lines first to calculate layout
  ctx.font = `bold ${fontSize - 2}px Arial`;
  const maxTextWidth = r * 1.6; // Text width within circle
  const lines = wrapText(text, maxTextWidth, fontSize, ctx);
  const lineHeight = (fontSize - 2) * 1.2;
  const textTotalHeight = lines.length * lineHeight;

  // Calculate total content height: icon + spacing + text lines
  const iconSpacing = 8;
  const totalContentHeight = iconSize + iconSpacing + textTotalHeight;

  // Position everything centered vertically in the node
  const contentStartY = y + r - totalContentHeight / 2;

  // Draw icon at top
  ctx.font = `${iconSize}px Arial`;
  ctx.fillText(icon, x + r, contentStartY);

  // Draw text below icon
  ctx.font = `bold ${fontSize - 2}px Arial`;
  let textStartY = contentStartY + iconSize + iconSpacing;
  for (const line of lines) {
    ctx.fillText(line, x + r, textStartY);
    textStartY += lineHeight;
  }
}

function drawGrid() {
  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3; // More transparent grid
  const gridSize = 40;

  for (let x = panX % gridSize; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = panY % gridSize; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  
  ctx.globalAlpha = 1; // Reset alpha
}

function setupUIListeners() {
  document.getElementById('addNodeBtn').addEventListener('click', addNode);
  document.getElementById('saveBtn').addEventListener('click', saveMindmap);
  document.getElementById('exportBtn').addEventListener('click', () => {
    document.getElementById('exportModal').classList.remove('hidden');
  });
  document.getElementById('deleteNodeBtn').addEventListener('click', deleteSelectedNode);
  document.getElementById('backToProjectBtn').addEventListener('click', () => {
    window.location.href = '/project.html';
  });
  document.getElementById('undoBtn').addEventListener('click', undo);
  document.getElementById('redoBtn').addEventListener('click', redo);
  document.getElementById('resetViewBtn').addEventListener('click', resetView);
  document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);

  // Node properties
  document.getElementById('nodeText').addEventListener('input', updateNodeText);
  document.getElementById('nodeColor').addEventListener('input', updateNodeColor);
  document.getElementById('fontSize').addEventListener('input', updateFontSize);
  document.getElementById('nodeNotes').addEventListener('input', updateNodeNotes);
  document.getElementById('selectEmojiBtn').addEventListener('click', () => {
    document.getElementById('emojiModal').classList.remove('hidden');
  });
  document.getElementById('autoColorBtn').addEventListener('click', autoColorNode);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Close sidebar
      const sidebar = document.getElementById('sidebar');
      const backdrop = document.getElementById('sidebarBackdrop');
      if (sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        backdrop.classList.remove('active');
      }
      // Close modals
      document.getElementById('emojiModal').classList.add('hidden');
      document.getElementById('exportModal').classList.add('hidden');
    }
  });
}

function addNode() {
  const newNode = {
    id: `node-${Date.now()}`,
    text: 'New Node',
    x: Math.random() * 200 - 100,
    y: Math.random() * 200 - 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    fontSize: 14,
    icon: '💡',
    notes: '',
    parentId: selectedNode ? selectedNode.id : null,
    children: []
  };

  currentMindmap.nodes.push(newNode);
  selectedNode = newNode;
  updateSidebar();
  saveHistory();
  draw();
}

function deleteSelectedNode() {
  if (!selectedNode || selectedNode === currentMindmap.nodes[0]) {
    alert('Cannot delete the central node');
    return;
  }

  currentMindmap.nodes = currentMindmap.nodes.filter(n => n.id !== selectedNode.id);
  selectedNode = null;
  updateSidebar();
  saveHistory();
  draw();
}

function updateNodeText(e) {
  if (selectedNode) {
    selectedNode.text = e.target.value;
    draw();
  }
}

function updateNodeColor(e) {
  if (selectedNode) {
    selectedNode.color = e.target.value;
    draw();
  }
}

function updateFontSize(e) {
  if (selectedNode) {
    selectedNode.fontSize = parseInt(e.target.value);
    document.getElementById('fontSizeDisplay').textContent = e.target.value + 'px';
    draw();
  }
}

function updateNodeNotes(e) {
  if (selectedNode) {
    selectedNode.notes = e.target.value;
  }
}

function autoColorNode() {
  if (selectedNode) {
    selectedNode.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    document.getElementById('nodeColor').value = selectedNode.color;
    draw();
  }
}

function updateSidebar() {
  if (selectedNode) {
    document.getElementById('nodeText').value = selectedNode.text || '';
    document.getElementById('nodeColor').value = selectedNode.color || '#3B82F6';
    document.getElementById('fontSize').value = selectedNode.fontSize || 16;
    document.getElementById('fontSizeDisplay').textContent = (selectedNode.fontSize || 16) + 'px';
    document.getElementById('nodeNotes').value = selectedNode.notes || '';
    document.getElementById('selectEmojiBtn').textContent = selectedNode.icon || '💡';
    document.getElementById('deleteNodeBtn').style.display = selectedNode === currentMindmap.nodes[0] ? 'none' : 'block';
  } else {
    document.getElementById('nodeText').value = '';
    document.getElementById('nodeColor').value = '#3B82F6';
    document.getElementById('fontSize').value = 16;
    document.getElementById('fontSizeDisplay').textContent = '16px';
    document.getElementById('nodeNotes').value = '';
    document.getElementById('deleteNodeBtn').style.display = 'none';
  }
}

async function saveMindmap() {
  try {
    const response = await fetch(`/api/projects/${currentProject}/mindmaps/${currentMindmap.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes: currentMindmap.nodes })
    });

    const data = await response.json();
    if (data.success) {
      alert('Mindmap saved successfully!');
    }
  } catch (error) {
    console.error('Error saving mindmap:', error);
    alert('Error saving mindmap');
  }
}

function saveHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(JSON.stringify(currentMindmap.nodes));
  historyIndex++;
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    currentMindmap.nodes = JSON.parse(history[historyIndex]);
    selectedNode = null;
    updateSidebar();
    draw();
  }
}

function redo() {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    currentMindmap.nodes = JSON.parse(history[historyIndex]);
    selectedNode = null;
    updateSidebar();
    draw();
  }
}

function resetView() {
  zoom = 1;
  panX = 0;
  panY = 0;
  draw();
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  sidebar.classList.toggle('active');
  backdrop.classList.toggle('active');
}

function selectEmoji(emoji) {
  if (selectedNode) {
    selectedNode.icon = emoji;
    document.getElementById('selectEmojiBtn').textContent = emoji;
    closeEmojiModal();
    draw();
  }
}

function closeEmojiModal() {
  document.getElementById('emojiModal').classList.add('hidden');
}

function closeExportModal() {
  document.getElementById('exportModal').classList.add('hidden');
}

function exportAs(format) {
  if (format === 'png' || format === 'jpg') {
    // Create temporary canvas for export
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext('2d');

    // Draw on export canvas
    exportCtx.fillStyle = 'white';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    exportCtx.save();
    exportCtx.translate(panX, panY);
    exportCtx.scale(zoom, zoom);

    for (const node of currentMindmap.nodes) {
      if (node.parentId) {
        const parent = currentMindmap.nodes.find(n => n.id === node.parentId);
        if (parent) {
          drawConnectionOnContext(exportCtx, parent, node);
        }
      }
    }

    for (const node of currentMindmap.nodes) {
      drawNodeOnContext(exportCtx, node);
    }

    exportCtx.restore();

    // Convert to image
    const link = document.createElement('a');
    link.href = exportCanvas.toDataURL(`image/${format}`);
    link.download = `${currentMindmap.name}.${format}`;
    link.click();

    closeExportModal();
  } else if (format === 'json') {
    const dataStr = JSON.stringify(currentMindmap, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${currentMindmap.name}.json`;
    link.click();

    closeExportModal();
  }
}

function drawConnectionOnContext(context, parent, child) {
  const parentRadius = calculateNodeRadius(parent);
  const childRadius = calculateNodeRadius(child);
  
  const fromX = parent.x + parentRadius;
  const fromY = parent.y + parentRadius;
  const toX = child.x + childRadius;
  const toY = child.y + childRadius;

  context.strokeStyle = parent.color || '#3B82F6';
  context.lineWidth = 3;
  context.globalAlpha = 0.6;

  context.beginPath();
  context.moveTo(fromX, fromY);

  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  context.quadraticCurveTo(midX, midY, toX, toY);
  context.stroke();

  context.globalAlpha = 1;
}

function drawNodeOnContext(context, node) {
  const x = node.x;
  const y = node.y;
  const r = calculateNodeRadius(node);
  const fontSize = node.fontSize || 16;
  const iconSize = fontSize;

  context.shadowColor = 'rgba(0, 0, 0, 0.2)';
  context.shadowBlur = 10;
  context.shadowOffsetX = 2;
  context.shadowOffsetY = 2;

  context.fillStyle = node.color || '#3B82F6';
  context.beginPath();
  context.arc(x + r, y + r, r, 0, Math.PI * 2);
  context.fill();

  context.shadowColor = 'transparent';

  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.textBaseline = 'top';

  const icon = node.icon || '💡';
  const text = node.text || 'Node';

  // Prepare text lines first to calculate layout
  context.font = `bold ${fontSize - 2}px Arial`;
  const maxTextWidth = r * 1.6;
  const lines = wrapText(text, maxTextWidth, fontSize, context);
  const lineHeight = (fontSize - 2) * 1.2;
  const textTotalHeight = lines.length * lineHeight;

  // Calculate total content height: icon + spacing + text lines
  const iconSpacing = 8;
  const totalContentHeight = iconSize + iconSpacing + textTotalHeight;

  // Position everything centered vertically in the node
  const contentStartY = y + r - totalContentHeight / 2;

  // Draw icon at top
  context.font = `${iconSize}px Arial`;
  context.fillText(icon, x + r, contentStartY);

  // Draw text below icon
  context.font = `bold ${fontSize - 2}px Arial`;
  let textStartY = contentStartY + iconSize + iconSpacing;
  for (const line of lines) {
    context.fillText(line, x + r, textStartY);
    textStartY += lineHeight;
  }
}

// Initialize
checkAuth();
