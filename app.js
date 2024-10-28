// Initialize global events object
window.events = JSON.parse(localStorage.getItem('calendar-events')) || {};

document.addEventListener('DOMContentLoaded', () => {
    // State Management
    let currentDate = new Date();
    let selectedDate = null;
    let selectedEventId = null;
    
    // DOM Elements
    const monthYearElement = document.getElementById('month-year');
    const calendarGrid = document.querySelector('.days-grid');
    const eventModal = document.getElementById('event-modal');
    const eventForm = document.getElementById('event-form');
    const modalTitle = document.getElementById('modal-title');
    const eventTitleInput = document.getElementById('event-title');
    const eventDescriptionInput = document.getElementById('event-description');
    const eventCategorySelect = document.getElementById('event-category');
    const eventList = document.getElementById('event-list');
    const deleteButton = document.getElementById('delete-event');
    const closeButton = document.getElementById('close-modal');

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
    const saveEvent = (e) => {
        if (e) e.preventDefault();
        
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
            category
        };

        if (selectedEventId) {
            // Update existing event
            const eventIndex = events[dateKey].findIndex(e => e.id === selectedEventId);
            if (eventIndex !== -1) {
                events[dateKey][eventIndex] = eventData;
            }
        } else {
            // Add new event
            events[dateKey].push(eventData);
        }

        localStorage.setItem('calendar-events', JSON.stringify(events));
        renderCalendar();
        closeModal();
    };

    const deleteEvent = (dateKey, eventId) => {
        if (!dateKey || !eventId) return;

        events[dateKey] = events[dateKey].filter(event => event.id !== eventId);
        if (events[dateKey].length === 0) {
            delete events[dateKey];
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
            <div class="event-preview ${event.category}" data-event-id="${event.id}">
                <div class="event-content">
                    <div class="event-title">${event.title}</div>
                    ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
                </div>
                <div class="event-actions">
                    <button class="edit-button" data-event-id="${event.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-button" data-event-id="${event.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners for edit and delete buttons
        eventList.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const eventId = e.currentTarget.dataset.eventId;
                editEvent(eventId, dateKey);
            });
        });

        eventList.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const eventId = e.currentTarget.dataset.eventId;
                deleteEvent(dateKey, eventId);
            });
        });

        clearEventForm();
        eventModal.classList.add('active');
    };

    const editEvent = (eventId, dateKey) => {
        const event = events[dateKey].find(e => e.id === eventId);
        if (!event) return;

        selectedEventId = eventId;
        eventTitleInput.value = event.title;
        eventDescriptionInput.value = event.description || '';
        eventCategorySelect.value = event.category;
        deleteButton.style.display = 'block';
    };

    const clearEventForm = () => {
        eventForm.reset();
        selectedEventId = null;
        deleteButton.style.display = 'none';
    };

    const closeModal = () => {
        eventModal.classList.remove('active');
        clearEventForm();
    };

    // Calendar Rendering
    const renderCalendar = () => {
        updateMonthYear();
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
                    eventElement.textContent = event.title;
                    dayElement.appendChild(eventElement);
                } else if (index === 3) {
                    const moreElement = document.createElement('div');
                    moreElement.className = 'event-count';
                    moreElement.textContent = `+${dateEvents.length - 3} more`;
                    dayElement.appendChild(moreElement);
                }
            });

            dayElement.addEventListener('click', () => showEventsForDate(date));
            calendarGrid.appendChild(dayElement);
        }
    };

    // Event Listeners
    eventForm.addEventListener('submit', saveEvent);
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('prev-month').addEventListener('click', () => navigateMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => navigateMonth(1));
    closeButton.addEventListener('click', closeModal);
    deleteButton.addEventListener('click', () => {
        if (selectedEventId) {
            deleteEvent(formatDate(selectedDate), selectedEventId);
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

    // Initialize theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        document.querySelector('#theme-toggle i').classList.replace('fa-moon', 'fa-sun');
    }

    // Initialize calendar
    renderCalendar();
});
