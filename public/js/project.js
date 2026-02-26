let currentUser = null;
let currentProject = null;
let workspace = null;

async function checkAuth() {
  const response = await fetch('/api/user');
  const data = await response.json();
  
  if (!data.authenticated) {
    window.location.href = '/';
  } else {
    currentUser = data.user;
    document.getElementById('username').textContent = currentUser.username;
    loadProject();
  }
}

async function loadProject() {
  const projectId = sessionStorage.getItem('currentProjectId');
  if (!projectId) {
    window.location.href = '/';
    return;
  }
  
  try {
    const response = await fetch('/api/workspace');
    const data = await response.json();
    workspace = data.workspace;
    
    currentProject = workspace.projects.find(p => p.id === projectId);
    if (!currentProject) {
      window.location.href = '/';
      return;
    }
    
    document.getElementById('projectTitle').textContent = currentProject.name;
    renderMindmaps();
  } catch (error) {
    console.error('Error loading project:', error);
  }
}

function renderMindmaps() {
  const container = document.getElementById('mindmapsContainer');
  const emptyState = document.getElementById('emptyState');
  
  if (!currentProject.mindmaps || currentProject.mindmaps.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  container.innerHTML = currentProject.mindmaps.map(mindmap => `
    <div class="card-hover bg-white rounded-2xl shadow-lg p-6 border-l-4 border-pink-500">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="text-xl font-bold text-gray-800 mb-1">
            <i class="fas fa-diagram-project text-pink-500 mr-2"></i>${mindmap.name}
          </h3>
          <p class="text-sm text-gray-500">
            ${mindmap.nodes ? mindmap.nodes.length : 0} nodes
          </p>
        </div>
        <div class="flex gap-2">
          <button class="text-gray-400 hover:text-red-500 transition" onclick="deleteMindmap('${mindmap.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      
      <div class="mb-4 p-3 bg-gray-50 rounded-lg">
        <p class="text-sm text-gray-600">
          <i class="fas fa-layer-group mr-2 text-gray-400"></i>Created ${new Date(mindmap.createdAt).toLocaleDateString()}
        </p>
      </div>
      
      <button onclick="openMindmap('${mindmap.id}')" class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2 rounded-lg hover:shadow-lg transition">
        <i class="fas fa-edit mr-2"></i>Edit
      </button>
    </div>
  `).join('');
}

async function createMindmap() {
  const name = document.getElementById('mindmapName').value.trim();
  if (!name) {
    alert('Please enter a mindmap name');
    return;
  }
  
  try {
    const response = await fetch(`/api/projects/${currentProject.id}/mindmaps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    
    const data = await response.json();
    if (data.success) {
      closeMindmapModal();
      await loadProject();
    }
  } catch (error) {
    console.error('Error creating mindmap:', error);
  }
}

async function deleteMindmap(mindmapId) {
  if (!confirm('Are you sure you want to delete this mindmap?')) return;
  
  try {
    const response = await fetch(`/api/projects/${currentProject.id}/mindmaps/${mindmapId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    if (data.success) {
      await loadProject();
    }
  } catch (error) {
    console.error('Error deleting mindmap:', error);
  }
}

function openMindmap(mindmapId) {
  sessionStorage.setItem('currentMindmapId', mindmapId);
  window.location.href = '/editor.html';
}

function openMindmapModal() {
  document.getElementById('mindmapModal').classList.remove('hidden');
  document.getElementById('mindmapName').focus();
}

function closeMindmapModal() {
  document.getElementById('mindmapModal').classList.add('hidden');
  document.getElementById('mindmapName').value = '';
}

// Event Listeners
document.getElementById('createMindmapBtn').addEventListener('click', openMindmapModal);
document.getElementById('emptyCreateBtn').addEventListener('click', openMindmapModal);
document.getElementById('cancelMindmapBtn').addEventListener('click', closeMindmapModal);
document.getElementById('saveMindmapBtn').addEventListener('click', createMindmap);
document.getElementById('mindmapName').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') createMindmap();
});

document.getElementById('backBtn').addEventListener('click', () => {
  window.location.href = '/';
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/';
});

// Close modals on backdrop click
document.getElementById('mindmapModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeMindmapModal();
});

// Initialize
checkAuth();
