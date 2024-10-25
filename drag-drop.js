// Drag and Drop Module
const DragDropModule = {
    draggedEvent: null,
    draggedElement: null,
    originalDate: null,

    initialize() {
        this.setupDragDropStyles();
        this.setupEventListeners();
    },

    setupDragDropStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .event-preview {
                cursor: grab;
                user-select: none;
            }
            
            .event-preview:active {
                cursor: grabbing;
            }
            
            .day.drag-over {
                background-color: var(--surface);
                transform: scale(1.02);
                transition: all 0.2s ease;
                border: 2px dashed var(--primary);
            }
            
            .event-preview.being-dragged {
                opacity: 0.5;
                transform: scale(0.98);
            }
            
            .day.valid-drop {
                background: var(--surface);
                box-shadow: 0 0 0 2px var(--primary);
            }
            
            .drop-preview {
                border: 2px dashed var(--primary);
                background: var(--surface);
                border-radius: 4px;
                margin: 2px 0;
                padding: 6px;
                opacity: 0.7;
                font-size: 0.9em;
                color: var(--text);
                text-align: center;
            }

            .drag-feedback {
                position: fixed;
                pointer-events: none;
                z-index: 1000;
                background: var(--primary);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.9em;
                opacity: 0.9;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            @keyframes dropHighlight {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }

            .drop-highlight {
                animation: dropHighlight 0.3s ease-out;
            }
        `;
        document.head.appendChild(style);
    },

    setupEventListeners() {
        document.addEventListener('dragend', () => {
            this.clearDragState();
        });

        // Prevent default drag behaviors on the document
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
        });
    },

    makeEventDraggable(eventElement, event, date) {
        eventElement.draggable = true;
        
        eventElement.addEventListener('dragstart', (e) => {
            this.handleDragStart(e, event, date, eventElement);
        });

        eventElement.addEventListener('dragend', () => {
            this.clearDragState();
        });

        // Add touch support
        eventElement.addEventListener('touchstart', (e) => {
            this.handleTouchStart(e, event, date, eventElement);
        });

        eventElement.addEventListener('touchmove', (e) => {
            this.handleTouchMove(e);
        });

        eventElement.addEventListener('touchend', (e) => {
            this.handleTouchEnd(e);
        });
    },

    setupDropZone(dayElement, date) {
        dayElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.handleDragOver(dayElement);
        });

        dayElement.addEventListener('dragleave', () => {
            this.handleDragLeave(dayElement);
        });

        dayElement.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleDrop(dayElement, date);
        });
    },

    handleDragStart(e, event, date, element) {
        this.draggedEvent = event;
        this.draggedElement = element;
        this.originalDate = date;

        element.classList.add('being-dragged');
        
        // Create and show drag feedback
        this.createDragFeedback(event.title);
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({
            event: event,
            originalDate: date
        }));
    },

    handleTouchStart(e, event, date, element) {
        this.draggedEvent = event;
        this.draggedElement = element;
        this.originalDate = date;

        element.classList.add('being-dragged');
        
        // Create and show touch feedback
        this.createTouchFeedback(e, event.title);
    },

    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.updateTouchFeedback(touch.clientX, touch.clientY);
        
        // Find the day element under the touch point
        const dayElement = this.getDayElementFromPoint(touch.clientX, touch.clientY);
        if (dayElement) {
            this.handleDragOver(dayElement);
        }
    },

    handleTouchEnd(e) {
        const touch = e.changedTouches[0];
        const dayElement = this.getDayElementFromPoint(touch.clientX, touch.clientY);
        
        if (dayElement) {
            const date = this.getDateFromDayElement(dayElement);
            if (date) {
                this.handleDrop(dayElement, date);
            }
        }
        
        this.clearDragState();
    },

    createDragFeedback(title) {
        const feedback = document.createElement('div');
        feedback.className = 'drag-feedback';
        feedback.textContent = title;
        document.body.appendChild(feedback);

        document.addEventListener('dragover', (e) => {
            feedback.style.left = (e.clientX + 10) + 'px';
            feedback.style.top = (e.clientY + 10) + 'px';
        });
    },

    createTouchFeedback(e, title) {
        const touch = e.touches[0];
        const feedback = document.createElement('div');
        feedback.className = 'drag-feedback';
        feedback.textContent = title;
        feedback.style.left = (touch.clientX + 10) + 'px';
        feedback.style.top = (touch.clientY + 10) + 'px';
        document.body.appendChild(feedback);
    },

    updateTouchFeedback(x, y) {
        const feedback = document.querySelector('.drag-feedback');
        if (feedback) {
            feedback.style.left = (x + 10) + 'px';
            feedback.style.top = (y + 10) + 'px';
        }
    },

    handleDragOver(dayElement) {
        dayElement.classList.add('drag-over', 'valid-drop');
        
        // Show drop preview if not already present
        if (!dayElement.querySelector('.drop-preview')) {
            const preview = this.createDropPreview();
            dayElement.appendChild(preview);
        }
    },

    handleDragLeave(dayElement) {
        dayElement.classList.remove('drag-over', 'valid-drop');
        
        // Remove drop preview
        const preview = dayElement.querySelector('.drop-preview');
        if (preview) {
            preview.remove();
        }
    },

    async handleDrop(dayElement, newDate) {
        if (!this.draggedEvent || !this.originalDate) return;

        const originalDateStr = this.formatDate(this.originalDate);
        const newDateStr = this.formatDate(newDate);

        // Don't do anything if dropped on the same date
        if (originalDateStr === newDateStr) {
            this.clearDragState();
            return;
        }

        // Move the event
        await this.moveEvent(this.draggedEvent, originalDateStr, newDateStr);
        
        // Add drop animation
        dayElement.classList.add('drop-highlight');
        setTimeout(() => {
            dayElement.classList.remove('drop-highlight');
        }, 300);
        
        // Clear drag state and update UI
        this.clearDragState();
        this.handleDragLeave(dayElement);
        
        // Trigger calendar re-render
        if (typeof window.renderCalendar === 'function') {
            window.renderCalendar();
        }
    },

    createDropPreview() {
        const preview = document.createElement('div');
        preview.className = 'drop-preview';
        preview.textContent = 'Drop event here';
        return preview;
    },

    async moveEvent(event, fromDate, toDate) {
        const events = window.events;
        
        // Remove from original date
        if (events[fromDate]) {
            events[fromDate] = events[fromDate].filter(e => e !== event);
            if (events[fromDate].length === 0) {
                delete events[fromDate];
            }
        }

        // Add to new date
        if (!events[toDate]) {
            events[toDate] = [];
        }
        
        // Update event date if it's a recurring event
        if (event.recurrence) {
            const updatedEvent = { ...event };
            updatedEvent.date = toDate;
            events[toDate].push(updatedEvent);
        } else {
            events[toDate].push(event);
        }

        // Save to localStorage
        localStorage.setItem('calendar-events', JSON.stringify(events));

        // If you have recurrent events, handle them here
        if (event.recurrenceId) {
            await this.handleRecurrentEventMove(event, fromDate, toDate);
        }
    },

    async handleRecurrentEventMove(event, fromDate, toDate) {
        // Implementation for handling recurrent events
        // This can be customized based on your recurrence implementation
        const confirmMove = await this.showRecurrenceConfirmation();
        if (confirmMove === 'all') {
            // Move all instances
            this.moveAllRecurrences(event, fromDate, toDate);
        } else if (confirmMove === 'single') {
            // Handle single instance move
            this.moveSingleRecurrence(event, fromDate, toDate);
        }
    },

    showRecurrenceConfirmation() {
        return new Promise((resolve) => {
            const result = confirm(
                'This is a recurring event. Do you want to move all occurrences?\n\n' +
                'OK - Move all occurrences\n' +
                'Cancel - Move only this occurrence'
            );
            resolve(result ? 'all' : 'single');
        });
    },

    clearDragState() {
        if (this.draggedElement) {
            this.draggedElement.classList.remove('being-dragged');
        }
        
        this.draggedEvent = null;
        this.draggedElement = null;
        this.originalDate = null;

        // Remove drag feedback
        const feedback = document.querySelector('.drag-feedback');
        if (feedback) {
            feedback.remove();
        }

        // Remove all drag-related classes
        document.querySelectorAll('.drag-over, .valid-drop').forEach(element => {
            element.classList.remove('drag-over', 'valid-drop');
        });

        // Remove all drop previews
        document.querySelectorAll('.drop-preview').forEach(preview => {
            preview.remove();
        });
    },

    getDayElementFromPoint(x, y) {
        const element = document.elementFromPoint(x, y);
        return element?.closest('.day');
    },

    getDateFromDayElement(dayElement) {
        // This method should be implemented based on how you store dates in your day elements
        // For example, you might store it as a data attribute
        const dayNumber = dayElement.querySelector('.day-number')?.textContent;
        if (dayNumber) {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            return new Date(currentYear, currentMonth, parseInt(dayNumber));
        }
        return null;
    },

    formatDate(date) {
        if (typeof date === 'string') return date;
        return date.toISOString().split('T')[0];
    }
};

// Initialize the module when the page loads
document.addEventListener('DOMContentLoaded', () => {
    DragDropModule.initialize();
});

// Export the module for use in the main calendar code
window.DragDropModule = DragDropModule;
