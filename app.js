// Initialize global events object
window.events = JSON.parse(localStorage.getItem('calendar-events')) || {};

document.addEventListener('DOMContentLoaded', () => {
    // State Management
    let currentDate = new Date();
    let selectedDate = null;
    let selectedEventId = null;
    
    // DOM Elements
    const monthYearElement = document.getElementById('month-year');
    const calendarGrid = document.querySelector('.days-grid'); // Updated selector
    const eventModal = document.getElementById('event-modal');
    const modalTitle = document.getElementById('modal-title');
    const eventTitleInput = document.getElementById('event-title');
    const eventDescriptionInput = document.getElementById('event-description');
    const eventCategorySelect = document.getElementById('event-category');
    const eventList = document.getElementById('event-list');
    const deleteButton = document.getElementById('delete-event');

    // Utility Functions
    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    const generateEventId = () => {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    };

    // Theme Management
    const toggleTheme = () => {
        const icon = document.querySelector('#theme-toggle i');
        if (document.body.classList.toggle('dark-theme')) {
            icon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'light');
        }
    };

    // Calendar Navigation
    const updateMonthYear = () => {
        monthYearElement.textContent = currentDate.toLocaleString('default', { 
            month: 'long', 
            year: 'numeric' 
        });
    };

    const navigateMonth = (direction) => {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1);
        renderCalendar();
    };

    // Event Management
    const saveEvent = () => {
        const title = eventTitleInput.value.trim();
        const description = eventDescriptionInput.value.trim();
        const category = eventCategorySelect.value;

        if (!title || !selectedDate) return;

        const dateKey = formatDate(selectedDate);
        if (!events[dateKey]) events[dateKey] = [];

        const eventData = {
            id: selectedEventId || generateEventId(),
            title,
            description,
            category,
            tags: TagsModule.getEventTags(),
            recurrence: RecurrenceModule.getRecurrenceRule()
        };

        if (selectedEventId) {
            // Update existing event and its recurrences
            updateRecurringEvent(eventData);
        } else {
            // Add new event
            events[dateKey].push(eventData);
            
            // Generate recurrences if applicable
            if (eventData.recurrence) {
                const recurrences = RecurrenceModule.generateRecurrences(eventData, selectedDate);
                recurrences.forEach(recurrence => {
                    const recurrenceDate = formatDate(new Date(recurrence.date));
                    if (!events[recurrenceDate]) {
                        events[recurrenceDate] = [];
                    }
                    events[recurrenceDate].push(recurrence);
                });
            }
        }

        localStorage.setItem('calendar-events', JSON.stringify(events));
        renderCalendar();
        closeModal();
    };

    const updateRecurringEvent = (eventData) => {
        // Update all instances of a recurring event
        Object.keys(events).forEach(dateKey => {
            events[dateKey] = events[dateKey].map(event => {
                if (event.id === eventData.id || event.recurrenceId === eventData.id) {
                    return {
                        ...eventData,
                        recurrenceId: event.recurrenceId || event.id
                    };
                }
                return event;
            });
        });
    };

    const deleteEvent = (dateKey, eventId, deleteAll = false) => {
        if (deleteAll) {
            // Delete all instances of a recurring event
            Object.keys(events).forEach(date => {
                events[date] = events[date].filter(event => 
                    event.id !== eventId && event.recurrenceId !== eventId
                );
                if (events[date].length === 0) {
                    delete events[date];
                }
            });
        } else {
            // Delete single instance
            events[dateKey] = events[dateKey].filter(event => event.id !== eventId);
            if (events[dateKey].length === 0) {
                delete events[dateKey];
            }
        }

        localStorage.setItem('calendar-events', JSON.stringify(events));
        renderCalendar();
        closeModal();
    };

    const showEventsForDate = (date) => {
        selectedDate = date;
        const dateKey = formatDate(date);
        const dateEvents = events[dateKey] || [];
        
        modalTitle.textContent = date.toLocaleDateString(undefined, { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        eventList.innerHTML = dateEvents.map(event => `
            <div class="event-preview ${event.category} ${event.recurrence ? 'recurring' : ''}"
                 data-event-id="${event.id}">
                <div class="event-content">
                    <div class="event-title">${event.title}</div>
                    ${event.description ? `
                        <div class="event-description">${event.description}</div>
                    ` : ''}
                    ${event.recurrence ? `
                        <div class="recurrence-badge">
                            <i class="fas fa-sync-alt"></i> Recurring
                        </div>
                    ` : ''}
                </div>
                <div class="event-actions">
                    <button onclick="editEvent('${event.id}', '${dateKey}')" class="edit-button">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteEvent('${dateKey}', '${event.id}')" class="delete-button">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Show delete button only when editing an event
        deleteButton.style.display = 'none';
        clearEventForm();
        selectedEventId = null;
        eventModal.classList.add('active');
    };

    const editEvent = (eventId, dateKey) => {
        const event = events[dateKey].find(e => e.id === eventId);
        if (!event) return;

        selectedEventId = eventId;
        eventTitleInput.value = event.title;
        eventDescriptionInput.value = event.description || '';
        eventCategorySelect.value = event.category;

        // Show delete button when editing
        deleteButton.style.display = 'block';

        if (event.recurrence) {
            RecurrenceModule.setRecurrenceRule(event.recurrence);
        }
        
        if (event.tags) {
            TagsModule.setEventTags(event.tags);
        }
    };

    const clearEventForm = () => {
        eventTitleInput.value = '';
        eventDescriptionInput.value = '';
        eventCategorySelect.value = 'work';
        selectedEventId = null;
        if (RecurrenceModule.clearRecurrenceForm) {
            RecurrenceModule.clearRecurrenceForm();
        }
        if (TagsModule.clearEventTags) {
            TagsModule.clearEventTags();
        }
    };

    const closeModal = () => {
        eventModal.classList.remove('active');
        clearEventForm();
    };

    // Calendar Rendering
    const renderCalendar = () => {
        updateMonthYear();

        // Clear existing calendar days
        calendarGrid.innerHTML = '';

        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
        const lastDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const today = new Date();

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'day empty';
            calendarGrid.appendChild(emptyDay);
        }

        // Add calendar days
        for (let day = 1; day <= lastDate; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'day';

            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dateKey = formatDate(date);
            const dateEvents = events[dateKey] || [];

            // Check if this day is today
            if (date.toDateString() === today.toDateString()) {
                dayElement.classList.add('today');
            }

            // Add day number
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            dayElement.appendChild(dayNumber);

            // Add events for this day
            dateEvents.forEach((event, index) => {
                if (index < 3) {
                    const eventElement = document.createElement('div');
                    eventElement.className = `event-preview ${event.category}`;
                    if (event.recurrence || event.recurrenceId) {
                        eventElement.classList.add('recurring');
                    }
                    eventElement.textContent = event.title;
                    
                    // Make event draggable
                    DragDropModule.makeEventDraggable(eventElement, event, date);
                    
                    dayElement.appendChild(eventElement);
                } else if (index === 3) {
                    const moreElement = document.createElement('div');
                    moreElement.className = 'event-count';
                    moreElement.textContent = `+${dateEvents.length - 3} more`;
                    dayElement.appendChild(moreElement);
                }
            });

            // Add weather if enabled
            if (WeatherModule && WeatherModule.addWeatherToDay) {
                WeatherModule.addWeatherToDay(dayElement, date);
            }

            // Make day a drop zone for drag and drop
            DragDropModule.setupDropZone(dayElement, date);

            dayElement.addEventListener('click', () => showEventsForDate(date));
            calendarGrid.appendChild(dayElement);
        }
    };

    // Event Listeners
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('prev-month').addEventListener('click', () => navigateMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => navigateMonth(1));
    document.getElementById('save-event').addEventListener('click', saveEvent);
    document.getElementById('close-modal').addEventListener('click', closeModal);
    deleteButton.addEventListener('click', () => {
        if (selectedEventId) {
            const dateKey = formatDate(selectedDate);
            const event = events[dateKey].find(e => e.id === selectedEventId);
            const isRecurring = event.recurrence || event.recurrenceId;
            
            if (isRecurring) {
                const confirmDelete = confirm('Delete all occurrences of this recurring event?');
                deleteEvent(dateKey, selectedEventId, confirmDelete);
            } else {
                deleteEvent(dateKey, selectedEventId);
            }
        }
    });

    // Close modal when clicking outside
    eventModal.addEventListener('click', (e) => {
        if (e.target === eventModal) closeModal();
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && eventModal.classList.contains('active')) {
            closeModal();
        }
    });

    // Make functions globally available
    window.editEvent = editEvent;
    window.deleteEvent = deleteEvent;
    window.renderCalendar = renderCalendar;

    // Initialize theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        document.querySelector('#theme-toggle i').classList.replace('fa-moon', 'fa-sun');
    }

    // Initialize all modules
    if (TagsModule && TagsModule.initialize) TagsModule.initialize();
    if (RecurrenceModule && RecurrenceModule.initialize) RecurrenceModule.initialize();
    if (DragDropModule && DragDropModule.initialize) DragDropModule.initialize();
    if (WeatherModule && WeatherModule.initialize) WeatherModule.initialize();

    // Initialize calendar
    renderCalendar();
});
