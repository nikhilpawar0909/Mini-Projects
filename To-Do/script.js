const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');

const STORAGE_KEY = 'todoTasks';

// Load tasks from localStorage on page load
function loadTasks() {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    savedTasks.forEach(task => {
        addTaskToDOM(task.text, task.completed);
    });
    updateEmptyState();
}

// Save tasks to localStorage
function saveTasks() {
    const tasks = [];
    document.querySelectorAll('.task-item').forEach(item => {
        tasks.push({
            text: item.querySelector('.task-text').textContent,
            completed: item.querySelector('.checkbox').checked
        });
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Add task to DOM
function addTaskToDOM(taskText, completed = false) {
    const li = document.createElement('li');
    li.className = `task-item ${completed ? 'completed' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'checkbox';
    checkbox.checked = completed;
    checkbox.addEventListener('change', function() {
        li.classList.toggle('completed');
        saveTasks();
    });

    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = taskText;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', function() {
        li.style.animation = 'taskAppear 0.3s ease-out reverse';
        setTimeout(() => {
            li.remove();
            saveTasks();
            updateEmptyState();
        }, 300);
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
}

// Add new task
function addTask() {
    const taskText = taskInput.value.trim();
    
    if (taskText === '') {
        taskInput.focus();
        return;
    }

    addTaskToDOM(taskText);
    saveTasks();
    taskInput.value = '';
    taskInput.focus();
    updateEmptyState();
}

// Update empty state visibility
function updateEmptyState() {
    if (taskList.children.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }
}

// Event listeners
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        addTask();
    }
});

// Load tasks on page load
loadTasks();
