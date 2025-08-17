class GoalTracker {
    constructor() {
        this.goals = [];
        this.currentYear = new Date().getFullYear();
        this.theme = localStorage.getItem('theme') || 'light';
        
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeTheme();
        this.loadGoalsFromStorage();
        this.updateDisplay();
        
        // Update year progress periodically (every hour)
        setInterval(() => this.updateYearProgress(), 60 * 60 * 1000);
    }
    
    initializeElements() {
        // Form elements
        this.goalForm = document.getElementById('goalForm');
        this.goalTitleInput = document.getElementById('goalTitle');
        this.goalTargetInput = document.getElementById('goalTarget');
        
        // Modal elements
        this.modalGoalForm = document.getElementById('modalGoalForm');
        this.modalGoalTitleInput = document.getElementById('modalGoalTitle');
        this.modalGoalTargetInput = document.getElementById('modalGoalTarget');
        this.goalModal = document.getElementById('goalModal');
        this.modalClose = document.getElementById('modalClose');
        this.goalCreationSection = document.getElementById('goalCreation');
        
        // Remove modal elements
        this.removeModal = document.getElementById('removeModal');
        this.removeModalClose = document.getElementById('removeModalClose');
        this.removeGoalsList = document.getElementById('removeGoalsList');
        
        // Floating menu elements
        this.floatingMenu = document.getElementById('floatingMenu');
        this.addGoalMenuBtn = document.getElementById('addGoalMenuBtn');
        this.removeGoalsMenuBtn = document.getElementById('removeGoalsMenuBtn');
        this.exportMenuBtn = document.getElementById('exportMenuBtn');
        this.importMenuBtn = document.getElementById('importMenuBtn');
        
        // Track delete button states
        this.pendingDeletes = new Set();
        
        // Display elements
        this.goalsList = document.getElementById('goalsList');
        this.emptyState = document.getElementById('emptyState');
        this.goalTemplate = document.getElementById('goalTemplate');
        this.yearDisplay = document.getElementById('yearDisplay');
        this.yearProgressFill = document.getElementById('yearProgressFill');
        this.yearProgressText = document.getElementById('yearProgressText');
        
        // Control elements
        this.themeToggle = document.getElementById('themeToggle');
        this.loadGoalsInput = document.getElementById('loadGoals');
    }
    
    initializeEventListeners() {
        // Goal form submission
        this.goalForm.addEventListener('submit', (e) => this.handleAddGoal(e));
        this.modalGoalForm.addEventListener('submit', (e) => this.handleAddGoalModal(e));
        
        // Modal controls
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.goalModal.addEventListener('click', (e) => {
            if (e.target === this.goalModal) this.closeModal();
        });
        
        // Remove modal controls
        this.removeModalClose.addEventListener('click', () => this.closeRemoveModal());
        this.removeModal.addEventListener('click', (e) => {
            if (e.target === this.removeModal) this.closeRemoveModal();
        });
        
        // Floating menu controls
        this.addGoalMenuBtn.addEventListener('click', () => this.openModal());
        this.removeGoalsMenuBtn.addEventListener('click', () => this.openRemoveModal());
        this.exportMenuBtn.addEventListener('click', () => this.saveGoalsToFile());
        this.importMenuBtn.addEventListener('click', () => this.loadGoalsInput.click());
        

        
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // File operations
        this.loadGoalsInput.addEventListener('change', (e) => this.loadGoalsFromFile(e));
        
        // Update year display and page title
        this.yearDisplay.textContent = this.currentYear;
        document.title = `Yearly Goals Tracker ${this.currentYear}`;
        this.updateYearProgress();
        
        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.removeModal.classList.contains('show')) {
                    this.closeRemoveModal();
                } else if (this.goalModal.classList.contains('show')) {
                    this.closeModal();
                }
            }
        });
    }
    
    openModal() {
        this.goalModal.classList.add('show');
        this.modalGoalTitleInput.focus();
    }
    
    closeModal() {
        this.goalModal.classList.remove('show');
        this.modalGoalForm.reset();
    }
    
    openRemoveModal() {
        this.removeModal.classList.add('show');
        this.populateRemoveGoalsList();
    }
    
    closeRemoveModal() {
        this.removeModal.classList.remove('show');
        // Reset any pending delete states
        this.pendingDeletes.clear();
    }
    
    handleDeleteClick(goalId, deleteBtn) {
        if (this.pendingDeletes.has(goalId)) {
            // Second click - confirm delete
            this.goals = this.goals.filter(goal => goal.id !== goalId);
            this.saveGoalsToStorage();
            this.updateDisplay();
            this.populateRemoveGoalsList(); // Refresh the modal list
            this.pendingDeletes.delete(goalId);
        } else {
            // First click - show confirm state
            this.pendingDeletes.add(goalId);
            deleteBtn.textContent = 'Confirm Delete';
            deleteBtn.classList.add('confirm-stage');
            
            // Reset after 3 seconds if not clicked
            setTimeout(() => {
                if (this.pendingDeletes.has(goalId)) {
                    this.pendingDeletes.delete(goalId);
                    deleteBtn.textContent = 'Delete';
                    deleteBtn.classList.remove('confirm-stage');
                }
            }, 3000);
        }
    }
    
    populateRemoveGoalsList() {
        this.removeGoalsList.innerHTML = '';
        
        if (this.goals.length === 0) {
            this.removeGoalsList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No goals to remove.</p>';
            return;
        }
        
        this.goals.forEach(goal => {
            const goalItem = document.createElement('div');
            goalItem.className = 'modal-goal-item';
            
            const spentHours = Math.floor(goal.spentMinutes / 60);
            const spentMinutesRemainder = goal.spentMinutes % 60;
            const spentDisplay = spentMinutesRemainder > 0 ? 
                `${spentHours}h ${spentMinutesRemainder}m` : `${spentHours}h`;
            const progressPercent = Math.min(100, (goal.spentMinutes / (goal.targetHours * 60)) * 100);
            
            goalItem.innerHTML = `
                <div class="modal-goal-info">
                    <div class="modal-goal-title">${goal.title}</div>
                    <div class="modal-goal-progress">${spentDisplay} / ${goal.targetHours}h (${Math.round(progressPercent)}%)</div>
                </div>
                <button class="modal-goal-delete" data-goal-id="${goal.id}" data-goal-title="${goal.title}">Delete</button>
            `;
            
            // Add delete button event listener
            const deleteBtn = goalItem.querySelector('.modal-goal-delete');
            deleteBtn.addEventListener('click', () => {
                this.handleDeleteClick(goal.id, deleteBtn);
            });
            
            this.removeGoalsList.appendChild(goalItem);
        });
    }
    
    initializeTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        this.updateThemeIcon();
    }
    
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('theme', this.theme);
        this.updateThemeIcon();
    }
    
    updateThemeIcon() {
        const icon = this.themeToggle.querySelector('.theme-icon');
        icon.textContent = this.theme === 'light' ? '🌙' : '☀️';
    }
    
    updateYearProgress() {
        const now = new Date();
        const currentYear = now.getFullYear();
        
        // Only update if we're viewing the current year
        if (this.currentYear !== currentYear) {
            this.yearProgressFill.style.width = '0%';
            this.yearProgressText.textContent = '';
            return;
        }
        
        // Calculate year progress
        const yearStart = new Date(currentYear, 0, 1); // January 1st
        const yearEnd = new Date(currentYear + 1, 0, 1); // January 1st of next year
        const totalYearDuration = yearEnd - yearStart;
        const elapsedTime = now - yearStart;
        
        const progressPercent = Math.min(100, (elapsedTime / totalYearDuration) * 100);
        
        // Update progress bar
        this.yearProgressFill.style.width = `${progressPercent}%`;
        this.yearProgressText.textContent = `${Math.round(progressPercent)}%`;
    }
    
    handleAddGoal(e) {
        e.preventDefault();
        
        const title = this.goalTitleInput.value.trim();
        const target = parseInt(this.goalTargetInput.value);
        
        if (!title || !target || target <= 0) {
            alert('Please enter a valid goal title and target hours.');
            return;
        }
        
        const goal = {
            id: Date.now().toString(),
            title,
            targetHours: target,
            spentMinutes: 0,
            createdAt: new Date().toISOString()
        };
        
        this.goals.push(goal);
        this.saveGoalsToStorage();
        this.updateDisplay();
        this.goalForm.reset();
    }
    
    handleAddGoalModal(e) {
        e.preventDefault();
        
        const title = this.modalGoalTitleInput.value.trim();
        const target = parseInt(this.modalGoalTargetInput.value);
        
        if (!title || !target || target <= 0) {
            alert('Please enter a valid goal title and target hours.');
            return;
        }
        
        const goal = {
            id: Date.now().toString(),
            title,
            targetHours: target,
            spentMinutes: 0,
            createdAt: new Date().toISOString()
        };
        
        this.goals.push(goal);
        this.saveGoalsToStorage();
        this.updateDisplay();
        this.closeModal();
    }
    

    
    addTimeToGoal(goalId, minutes) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            goal.spentMinutes += minutes;
            this.saveGoalsToStorage();
            this.updateDisplay();
        }
    }
    
    updateDisplay() {
        this.goalsList.innerHTML = '';
        
        if (this.goals.length === 0) {
            this.emptyState.style.display = 'block';
            this.goalCreationSection.style.display = 'block';
            this.floatingMenu.classList.add('hidden');
            return;
        }
        
        this.emptyState.style.display = 'none';
        this.goalCreationSection.style.display = 'none';
        this.floatingMenu.classList.remove('hidden');
        
        this.goals.forEach(goal => {
            const goalElement = this.createGoalElement(goal);
            this.goalsList.appendChild(goalElement);
        });
    }
    
    createGoalElement(goal) {
        const template = this.goalTemplate.content.cloneNode(true);
        const goalCard = template.querySelector('.goal-card');
        
        // Set goal data
        goalCard.dataset.goalId = goal.id;
        
        // Populate content
        template.querySelector('.goal-title').textContent = goal.title;
        template.querySelector('.target-time').textContent = `${goal.targetHours}h`;
        
        // Calculate progress
        const spentHours = Math.floor(goal.spentMinutes / 60);
        const spentMinutesRemainder = goal.spentMinutes % 60;
        const spentDisplay = spentMinutesRemainder > 0 ? 
            `${spentHours}h ${spentMinutesRemainder}m` : `${spentHours}h`;
        template.querySelector('.spent-time').textContent = spentDisplay;
        
        const progressPercent = Math.min(100, (goal.spentMinutes / (goal.targetHours * 60)) * 100);
        template.querySelector('.progress-percent').textContent = `${Math.round(progressPercent)}%`;
        template.querySelector('.progress-fill').style.width = `${progressPercent}%`;
        
        // Add event listeners
        this.attachGoalEventListeners(template, goal.id);
        
        // Remove animation class as requested
        
        return template;
    }
    
    attachGoalEventListeners(template, goalId) {
        // Time tracking buttons
        template.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const minutes = parseInt(btn.dataset.minutes);
                this.addTimeToGoal(goalId, minutes);
            });
        });
        
        // Custom time button
        const customTimeBtn = template.querySelector('.custom-time-btn');
        const customTimeInput = template.querySelector('.custom-time-input');
        const customMinutesInput = template.querySelector('.custom-minutes');
        const addCustomTimeBtn = template.querySelector('.add-custom-time');
        const cancelCustomTimeBtn = template.querySelector('.cancel-custom-time');
        
        customTimeBtn.addEventListener('click', () => {
            customTimeInput.style.display = 'flex';
            customMinutesInput.focus();
        });
        
        addCustomTimeBtn.addEventListener('click', () => {
            const minutes = parseInt(customMinutesInput.value);
            if (minutes && minutes > 0) {
                this.addTimeToGoal(goalId, minutes);
                customTimeInput.style.display = 'none';
                customMinutesInput.value = '';
            } else {
                alert('Please enter a valid number of minutes.');
            }
        });
        
        cancelCustomTimeBtn.addEventListener('click', () => {
            customTimeInput.style.display = 'none';
            customMinutesInput.value = '';
        });
        
        // Allow Enter key to add custom time
        customMinutesInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addCustomTimeBtn.click();
            }
        });
    }
    
    getStorageKey() {
        return `goals_${this.currentYear}`;
    }
    
    saveGoalsToStorage() {
        try {
            localStorage.setItem(this.getStorageKey(), JSON.stringify(this.goals));
        } catch (error) {
            console.error('Failed to save goals to localStorage:', error);
            alert('Failed to save goals. Your browser storage might be full.');
        }
    }
    
    loadGoalsFromStorage() {
        try {
            const stored = localStorage.getItem(this.getStorageKey());
            this.goals = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load goals from localStorage:', error);
            this.goals = [];
        }
    }
    
    saveGoalsToFile() {
        try {
            const data = {
                year: this.currentYear,
                exportDate: new Date().toISOString(),
                goals: this.goals
            };
            
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `goals_${this.currentYear}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up the URL object
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('Failed to save goals to file:', error);
            alert('Failed to save goals to file.');
        }
    }
    
    loadGoalsFromFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.goals && Array.isArray(data.goals)) {
                    // Validate goal structure
                    const validGoals = data.goals.filter(goal => 
                        goal.id && goal.title && typeof goal.targetHours === 'number' && typeof goal.spentMinutes === 'number'
                    );
                    
                    if (validGoals.length !== data.goals.length) {
                        console.warn('Some goals were invalid and skipped during import.');
                    }
                    
                    this.goals = validGoals;
                    
                    // Update year if specified in file
                    if (data.year && !isNaN(data.year)) {
                        this.currentYear = parseInt(data.year);
                        this.yearSelect.value = this.currentYear;
                    }
                    
                    this.saveGoalsToStorage();
                    this.updateDisplay();
                    
                    alert(`Successfully imported ${validGoals.length} goal(s) for ${this.currentYear}.`);
                } else {
                    alert('Invalid file format. Please select a valid goals file.');
                }
            } catch (error) {
                console.error('Failed to parse goals file:', error);
                alert('Failed to read goals file. Please check the file format.');
            }
        };
        
        reader.readAsText(file);
        
        // Reset the input so the same file can be loaded again
        event.target.value = '';
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.goalTracker = new GoalTracker();
});

// Handle browser back/forward navigation
window.addEventListener('popstate', () => {
    if (window.goalTracker) {
        window.goalTracker.loadGoalsFromStorage();
        window.goalTracker.updateDisplay();
    }
});

// Auto-save on page unload
window.addEventListener('beforeunload', () => {
    if (window.goalTracker) {
        window.goalTracker.saveGoalsToStorage();
    }
});
