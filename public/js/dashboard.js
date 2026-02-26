let currentUser = null;
let workspace = null;
let currentEditingProject = null;

async function checkAuth() {
  const response = await fetch('/api/user');
  const data = await response.json();
  
  if (!data.authenticated) {
    window.location.href = '/';
  } else {
    currentUser = data.user;
    document.getElementById('username').textContent = currentUser.username;
    loadWorkspace();
  }
}

async function loadWorkspace() {
  try {
    const response = await fetch('/api/workspace');
    const data = await response.json();
    workspace = data.workspace;
    renderProjects();
  } catch (error) {
    console.error('Error loading workspace:', error);
  }
}

function renderProjects() {
  const container = document.getElementById('projectsContainer');
  const emptyState = document.getElementById('emptyState');
  
  if (!workspace.projects || workspace.projects.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  container.innerHTML = workspace.projects.map(project => `
    <div class="card-hover bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="text-xl font-bold text-gray-800 mb-1">
            <i class="fas fa-folder text-purple-500 mr-2"></i>${project.name}
          </h3>
          <p class="text-sm text-gray-500">
            ${project.mindmaps ? project.mindmaps.length : 0} mindmaps
          </p>
        </div>
        <div class="flex gap-2">
          <button class="text-gray-400 hover:text-blue-500 transition" onclick="editProject('${project.id}', '${project.name}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="text-gray-400 hover:text-red-500 transition" onclick="deleteProject('${project.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      
      <div class="space-y-2 mb-4">
        ${project.mindmaps && project.mindmaps.length > 0 ? 
          project.mindmaps.slice(0, 3).map(mm => `
            <div class="text-sm text-gray-600 line-clamp-1">
              <i class="fas fa-diagram-project mr-2 text-pink-500"></i>${mm.name}
            </div>
          `).join('') : 
          '<p class="text-gray-400 text-sm italic">No mindmaps yet</p>'
        }
      </div>
      
      <button onclick="openProject('${project.id}')" class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2 rounded-lg hover:shadow-lg transition">
        <i class="fas fa-arrow-right mr-2"></i>Open Project
      </button>
    </div>
  `).join('');
}

async function createProject() {
  const name = document.getElementById('projectName').value.trim();
  if (!name) {
    alert('Please enter a project name');
    return;
  }
  
  try {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    
    const data = await response.json();
    if (data.success) {
      closeProjectModal();
      await loadWorkspace();
    }
  } catch (error) {
    console.error('Error creating project:', error);
  }
}

async function deleteProject(projectId) {
  if (!confirm('Are you sure you want to delete this project?')) return;
  
  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    if (data.success) {
      await loadWorkspace();
    }
  } catch (error) {
    console.error('Error deleting project:', error);
  }
}

function editProject(projectId, projectName) {
  currentEditingProject = projectId;
  document.getElementById('renameProjectInput').value = projectName;
  document.getElementById('renameProjectModal').classList.remove('hidden');
}

async function saveRenamedProject() {
  const newName = document.getElementById('renameProjectInput').value.trim();
  if (!newName) {
    alert('Please enter a project name');
    return;
  }
  
  // Find project and update it locally, then save
  const project = workspace.projects.find(p => p.id === currentEditingProject);
  if (project) {
    project.name = newName;
    // In a real app, we'd save this to the server
    // For now, we'll update the local display
    renderProjects();
    closeRenameModal();
  }
}

function openProject(projectId) {
  // Store project ID and redirect to project page
  sessionStorage.setItem('currentProjectId', projectId);
  window.location.href = '/project.html';
}

function openProjectModal() {
  document.getElementById('projectModal').classList.remove('hidden');
  document.getElementById('projectName').focus();
}

function closeProjectModal() {
  document.getElementById('projectModal').classList.add('hidden');
  document.getElementById('projectName').value = '';
}

function closeRenameModal() {
  document.getElementById('renameProjectModal').classList.add('hidden');
}

// Event Listeners
document.getElementById('createProjectBtn').addEventListener('click', openProjectModal);
document.getElementById('emptyCreateBtn').addEventListener('click', openProjectModal);
document.getElementById('cancelProjectBtn').addEventListener('click', closeProjectModal);
document.getElementById('saveProjectBtn').addEventListener('click', createProject);
document.getElementById('projectName').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') createProject();
});

document.getElementById('cancelRenameBtn').addEventListener('click', closeRenameModal);
document.getElementById('saveRenameBtn').addEventListener('click', saveRenamedProject);

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/';
});

// Close modals on backdrop click
document.getElementById('projectModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeProjectModal();
});

document.getElementById('renameProjectModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeRenameModal();
});

// Initialize
checkAuth();
