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
    selectedNode.x = x - selectedNode.radius;
    selectedNode.y = y - selectedNode.radius;
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
    selectedNode.x = x - selectedNode.radius;
    selectedNode.y = y - selectedNode.radius;
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
    const dx = x - (node.x + node.radius);
    const dy = y - (node.y + node.radius);
    if (Math.sqrt(dx * dx + dy * dy) < node.radius) {
      return node;
    }
  }
  return null;
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
  const fromX = parent.x + parent.radius;
  const fromY = parent.y + parent.radius;
  const toX = child.x + child.radius;
  const toY = child.y + child.radius;

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
  const r = node.radius;

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
  ctx.font = `${node.fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const icon = node.icon || '💡';
  const text = node.text || 'Node';

  // Measure and position text
  const iconMetrics = ctx.measureText(icon);
  const textMetrics = ctx.measureText(text);

  ctx.fillText(icon, x + r, y + r - 8);
  ctx.font = `bold ${node.fontSize - 3}px Arial`;
  ctx.fillText(text, x + r, y + r + 12);
}

function drawGrid() {
  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = 1;
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
}

function addNode() {
  const newNode = {
    id: `node-${Date.now()}`,
    text: 'New Node',
    x: Math.random() * 200 - 100,
    y: Math.random() * 200 - 100,
    radius: 40,
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
  sidebar.classList.toggle('active');
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
  const fromX = parent.x + parent.radius;
  const fromY = parent.y + parent.radius;
  const toX = child.x + child.radius;
  const toY = child.y + child.radius;

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
  const r = node.radius;

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
  context.font = `${node.fontSize}px Arial`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  const icon = node.icon || '💡';
  const text = node.text || 'Node';

  context.fillText(icon, x + r, y + r - 8);
  context.font = `bold ${node.fontSize - 3}px Arial`;
  context.fillText(text, x + r, y + r + 12);
}

// Initialize
checkAuth();
