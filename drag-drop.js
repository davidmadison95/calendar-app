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
            }
            
            .event-preview:active {
                cursor: grabbing;
            }
            
            .day.drag-over {
                background-color: var(--surface);
                transform: scale(1.02);
                transition: all 0.2s ease;
            }
            
            .event-preview.being-dragged {
                opacity: 0.5;
            }
            
            .day.valid-drop {
                border: 2px dashed var(--primary);
            }
            
            .drop-preview {
                border: 2px dashed var(--primary);
                background: var(--surface);
                border-radius: 4px;
                margin: 2px 0;
                padding: 4px;
                opacity: 0.7;
            }
        `;
        document.head.appendChild(style);
    },

    setupEventListeners() {
        document.addEventListener('dragend', () => {
            this.clearDragState();
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
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({
            event: event,
            originalDate: date
        }));
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
        
        events[toDate].push(event);

        // Save to localStorage
        localStorage.setItem('calendar-events', JSON.stringify(events));

        // If you have recurrent events, handle them here
        if (event.recurrenceId) {
            await this.handleRecurrentEventMove(event, fromDate, toDate);
        }
    },

    async handleRecurrentEventMove(event, fromDate, toDate) {
        // Implementation for handling recurrent events
        // This would need to be customized based on your recurrence implementation
    },

    clearDragState() {
        if (this.draggedElement) {
            this.draggedElement.classList.remove('being-dragged');
        }
        
        this.draggedEvent = null;
        this.draggedElement = null;
        this.originalDate = null;

        // Remove all drag-related classes
        document.querySelectorAll('.drag-over, .valid-drop').forEach(element => {
            element.classList.remove('drag-over', 'valid-drop');
        });

        // Remove all drop previews
        document.querySelectorAll('.drop-preview').forEach(preview => {
            preview.remove();
        });
    },

    formatDate(date) {
        if (typeof date === 'string') return date;
        return date.toISOString().split('T')[0];
    }
};

// Usage in your main calendar code:
/*
// In your initialization
DragDropModule.initialize();

// When creating event elements
DragDropModule.makeEventDraggable(eventElement, event, date);

// When creating day cells
DragDropModule.setupDropZone(dayElement, date);
*/
