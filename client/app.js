// Configuration
const API_URL = 'http://localhost:5000/api';

// DOM Elements
const serverStatusBadge = document.getElementById('server-status-badge');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

const metricStatus = document.getElementById('metric-status');
const metricUptime = document.getElementById('metric-uptime');
const metricPing = document.getElementById('metric-ping');
const consoleLogs = document.getElementById('console-logs');
const refreshHealthBtn = document.getElementById('refresh-health-btn');

const taskCountBadge = document.getElementById('task-count-badge');
const addTaskForm = document.getElementById('add-task-form');
const newTaskInput = document.getElementById('new-task-input');
const taskList = document.getElementById('task-list');

// State
let isServerOnline = false;
let uptimeInterval = null;
let currentUptime = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  logToConsole('System fully initialized.', 'system');
  logToConsole('Attempting initial backend handshake...', 'info');
  
  checkServerHealth();
  
  // Set up event listeners
  refreshHealthBtn.addEventListener('click', checkServerHealth);
  addTaskForm.addEventListener('submit', handleAddTask);
  
  // Poll server status every 10 seconds
  setInterval(checkServerHealth, 10000);
});

// Log message to the onscreen custom console
function logToConsole(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const logLine = document.createElement('div');
  logLine.className = `log-line ${type}`;
  logLine.textContent = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  
  consoleLogs.appendChild(logLine);
  consoleLogs.scrollTop = consoleLogs.scrollHeight;
}

// Check backend server health
async function checkServerHealth() {
  const startTime = Date.now();
  try {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) throw new Error('Server responded with error status');
    
    const data = await response.json();
    const ping = Date.now() - startTime;
    
    setServerStatus(true);
    if (data.status === 'warning') {
      metricStatus.textContent = 'WARN/MEMORY';
      metricStatus.style.color = 'hsl(45, 93%, 47%)'; // warning amber HSL
    } else {
      metricStatus.textContent = 'ONLINE';
      metricStatus.className = 'metric-value status-ok';
      metricStatus.style.color = '';
    }
    metricPing.textContent = `${ping} ms`;
    
    // Set up local uptime counter based on server uptime
    currentUptime = data.uptime;
    metricUptime.textContent = formatUptime(currentUptime);
    
    if (uptimeInterval) clearInterval(uptimeInterval);
    uptimeInterval = setInterval(() => {
      currentUptime += 1;
      metricUptime.textContent = formatUptime(currentUptime);
    }, 1000);

    if (data.status === 'warning') {
      logToConsole(`Backend Active in Fallback Mode. DB Warning: ${data.warning}`, 'error');
    } else {
      logToConsole(`Backend Active. Connected to Atlas MongoDB (Ping: ${ping}ms).`, 'success');
    }
    
    // If we just got online, load items
    if (!isServerOnline) {
      loadTasks();
    }
  } catch (error) {
    setServerStatus(false);
    metricStatus.textContent = 'OFFLINE';
    metricStatus.className = 'metric-value status-err';
    metricPing.textContent = '-- ms';
    metricUptime.textContent = '0.00s';
    if (uptimeInterval) {
      clearInterval(uptimeInterval);
      uptimeInterval = null;
    }
    logToConsole(`Connection failed: ${error.message}. Is server running?`, 'error');
    renderOfflineTasks();
  }
}

// Update server connection status badge UI
function setServerStatus(online) {
  isServerOnline = online;
  if (online) {
    statusDot.className = 'pulse-dot online';
    statusText.textContent = 'Connected to API';
    serverStatusBadge.style.borderColor = 'rgba(20, 184, 166, 0.3)';
    serverStatusBadge.style.background = 'rgba(20, 184, 166, 0.05)';
  } else {
    statusDot.className = 'pulse-dot offline';
    statusText.textContent = 'Server Offline';
    serverStatusBadge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    serverStatusBadge.style.background = 'rgba(239, 68, 68, 0.05)';
  }
}

// Helper to format server uptime
function formatUptime(seconds) {
  if (seconds < 60) return `${seconds.toFixed(0)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

// Load tasks from backend API
async function loadTasks() {
  renderSkeletons();
  try {
    const response = await fetch(`${API_URL}/items`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    
    const tasks = await response.json();
    logToConsole(`Fetched ${tasks.length} roadmap items from server.`, 'info');
    renderTaskList(tasks);
  } catch (error) {
    logToConsole(`Error fetching tasks: ${error.message}`, 'error');
  }
}

// Add a new task/milestone
async function handleAddTask(e) {
  e.preventDefault();
  const title = newTaskInput.value.trim();
  if (!title) return;

  if (!isServerOnline) {
    logToConsole('Cannot add task. Server is currently offline.', 'error');
    return;
  }

  logToConsole(`Adding roadmap milestone: "${title}"`, 'info');
  
  try {
    const response = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title })
    });

    if (!response.ok) throw new Error('Failed to add milestone');

    const newTask = await response.json();
    logToConsole(`Milestone successfully added (ID: ${newTask.id})`, 'success');
    
    newTaskInput.value = '';
    loadTasks();
  } catch (error) {
    logToConsole(`Error adding milestone: ${error.message}`, 'error');
  }
}

// Toggle milestone completed status
async function toggleTask(id) {
  if (!isServerOnline) {
    logToConsole('Cannot toggle status. Server is offline.', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/items/${id}`, {
      method: 'PATCH'
    });
    
    if (!response.ok) throw new Error('Failed to update status');
    
    const updatedTask = await response.json();
    logToConsole(`Item status updated: "${updatedTask.title}" (${updatedTask.completed ? 'Completed' : 'Active'})`, 'info');
    loadTasks();
  } catch (error) {
    logToConsole(`Error toggling status: ${error.message}`, 'error');
  }
}

// Delete milestone
async function deleteTask(id, title) {
  if (!isServerOnline) {
    logToConsole('Cannot delete item. Server is offline.', 'error');
    return;
  }

  if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

  try {
    const response = await fetch(`${API_URL}/items/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete item');
    
    logToConsole(`Milestone deleted: "${title}"`, 'success');
    loadTasks();
  } catch (error) {
    logToConsole(`Error deleting item: ${error.message}`, 'error');
  }
}

// Render Skeletons during loading states
function renderSkeletons() {
  taskList.innerHTML = `
    <li class="task-item skeleton">
      <div class="skeleton-checkbox"></div>
      <div class="skeleton-text"></div>
    </li>
    <li class="task-item skeleton">
      <div class="skeleton-checkbox"></div>
      <div class="skeleton-text"></div>
    </li>
  `;
}

// Render Offline state tasks
function renderOfflineTasks() {
  taskCountBadge.textContent = 'Offline Mode';
  taskList.innerHTML = `
    <div class="empty-state">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-3.536 4.978 4.978 0 011.414-3.536m0 0L5.636 5.636m0 0L3 3" />
      </svg>
      <div class="empty-state-title">Backend Connection Lost</div>
      <p class="empty-state-desc">Roadmap items will load automatically once the server is back online.</p>
    </div>
  `;
}

// Render the loaded items list
function renderTaskList(tasks) {
  taskCountBadge.textContent = `${tasks.length} items`;
  
  if (tasks.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <div class="empty-state-title">No milestones found</div>
        <p class="empty-state-desc">Create your first milestone above to populate the server database.</p>
      </div>
    `;
    return;
  }

  taskList.innerHTML = '';
  
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    
    // Task Content Wrapper (clickable area for check action)
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'task-content-wrapper';
    contentWrapper.id = `task-content-${task.id}`;
    contentWrapper.addEventListener('click', () => toggleTask(task.id));
    
    // Custom Checkbox
    const checkbox = document.createElement('div');
    checkbox.className = 'task-checkbox-custom';
    checkbox.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M20 6L9 17L4 12" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    
    // Title
    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;
    
    contentWrapper.appendChild(checkbox);
    contentWrapper.appendChild(title);
    
    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.id = `btn-delete-${task.id}`;
    deleteBtn.title = 'Delete milestone';
    deleteBtn.innerHTML = `
      <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    `;
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTask(task.id, task.title);
    });
    
    li.appendChild(contentWrapper);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });
}
