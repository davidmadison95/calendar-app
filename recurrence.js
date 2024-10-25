const RecurrenceModule = {
    // Configuration and constants
    recurrencePatterns: {
        DAILY: 'daily',
        WEEKLY: 'weekly',
        MONTHLY: 'monthly',
        YEARLY: 'yearly',
        WEEKDAYS: 'weekdays',
        CUSTOM: 'custom'
    },

    initialize() {
        this.setupStyles();
        this.addRecurrenceUI();
        this.setupEventListeners();
    },

    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .recurrence-container {
                margin: 16px 0;
                padding: 16px;
                background: var(--surface);
                border-radius: 8px;
                border: 1px solid var(--border);
            }

            .recurrence-toggle {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
            }

            .recurrence-toggle input[type="checkbox"] {
                width: 18px;
                height: 18px;
                cursor: pointer;
            }

            .recurrence-options {
                display: none;
                padding: 16px;
                background: var(--background);
                border: 1px solid var(--border);
                border-radius: 8px;
                margin-top: 12px;
            }

            .recurrence-options.active {
                display: block;
                animation: slideDown 0.3s ease-out;
            }

            .weekday-selector {
                display: flex;
                gap: 8px;
                margin: 12px 0;
                justify-content: space-between;
            }

            .weekday-btn {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border: 1px solid var(--border);
                background: var(--background);
                color: var(--text);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8em;
                transition: all 0.2s ease;
            }

            .weekday-btn:hover {
                background: var(--surface);
            }

            .weekday-btn.active {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
            }

            .recurrence-end {
                margin-top: 16px;
                padding-top: 16px;
                border-top: 1px solid var(--border);
            }

            .recurrence-preview {
                margin-top: 12px;
                padding: 12px;
                background: var(--background);
                border-radius: 6px;
                font-size: 0.9em;
                color: var(--text-secondary);
            }

            .custom-recurrence {
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 12px 0;
            }

            .recurrence-input {
                width: 70px;
                padding: 6px 8px;
                border: 1px solid var(--border);
                border-radius: 4px;
                background: var(--background);
                color: var(--text);
            }

            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    },

    addRecurrenceUI() {
        const modalContent = document.querySelector('.modal-content');
        const container = document.createElement('div');
        container.className = 'recurrence-container';
        
        container.innerHTML = `
            <div class="recurrence-toggle">
                <input type="checkbox" id="repeat-event" class="input-field">
                <label for="repeat-event">Make this a recurring event</label>
            </div>
            
            <div class="recurrence-options" id="recurrence-options">
                <div class="input-group">
                    <label for="recurrence-pattern">Repeat Pattern</label>
                    <select id="recurrence-pattern" class="input-field">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="weekdays">Weekdays only</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>

                <div id="custom-options" style="display: none;">
                    <div class="custom-recurrence">
                        <span>Repeat every</span>
                        <input type="number" id="recurrence-interval" 
                               class="recurrence-input" value="1" min="1">
                        <span id="interval-label">days</span>
                    </div>

                    <div class="weekday-selector" id="weekday-selector" style="display: none;">
                        <button class="weekday-btn" data-day="0">S</button>
                        <button class="weekday-btn" data-day="1">M</button>
                        <button class="weekday-btn" data-day="2">T</button>
                        <button class="weekday-btn" data-day="3">W</button>
                        <button class="weekday-btn" data-day="4">T</button>
                        <button class="weekday-btn" data-day="5">F</button>
                        <button class="weekday-btn" data-day="6">S</button>
                    </div>
                </div>

                <div class="recurrence-end">
                    <label for="recurrence-end-type">End Recurrence</label>
                    <select id="recurrence-end-type" class="input-field">
                        <option value="never">Never</option>
                        <option value="after">After number of occurrences</option>
                        <option value="on-date">On specific date</option>
                    </select>

                    <div id="end-after-options" style="display: none;">
                        <div class="custom-recurrence">
                            <span>End after</span>
                            <input type="number" id="occurrence-count" 
                                   class="recurrence-input" value="10" min="1">
                            <span>occurrences</span>
                        </div>
                    </div>

                    <div id="end-on-date-options" style="display: none;">
                        <div class="input-group">
                            <label>End on</label>
                            <input type="date" id="end-date" class="input-field">
                        </div>
                    </div>
                </div>

                <div class="recurrence-preview" id="recurrence-preview"></div>
            </div>
        `;

        // Insert before the button group
        const buttonGroup = modalContent.querySelector('.button-group');
        modalContent.insertBefore(container, buttonGroup);
    },

    setupEventListeners() {
        const repeatCheckbox = document.getElementById('repeat-event');
        const recurrenceOptions = document.getElementById('recurrence-options');
        const patternSelect = document.getElementById('recurrence-pattern');
        const customOptions = document.getElementById('custom-options');
        const weekdaySelector = document.getElementById('weekday-selector');
        const endTypeSelect = document.getElementById('recurrence-end-type');
        const endAfterOptions = document.getElementById('end-after-options');
        const endOnDateOptions = document.getElementById('end-on-date-options');

        // Toggle recurrence options
        repeatCheckbox.addEventListener('change', () => {
            recurrenceOptions.classList.toggle('active', repeatCheckbox.checked);
            this.updatePreview();
        });

        // Pattern change handler
        patternSelect.addEventListener('change', () => {
            const isCustom = patternSelect.value === 'custom';
            customOptions.style.display = isCustom ? 'block' : 'none';
            weekdaySelector.style.display = 
                (patternSelect.value === 'weekly' || isCustom) ? 'flex' : 'none';
            this.updateIntervalLabel();
            this.updatePreview();
        });

        // Weekday selection
        weekdaySelector.querySelectorAll('.weekday-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
                this.updatePreview();
            });
        });

        // End type change handler
        endTypeSelect.addEventListener('change', () => {
            endAfterOptions.style.display = 
                endTypeSelect.value === 'after' ? 'block' : 'none';
            endOnDateOptions.style.display = 
                endTypeSelect.value === 'on-date' ? 'block' : 'none';
            this.updatePreview();
        });

        // Update preview on any input change
        document.querySelectorAll('.recurrence-container input, .recurrence-container select')
            .forEach(input => {
                input.addEventListener('change', () => this.updatePreview());
                input.addEventListener('input', () => this.updatePreview());
            });
    },

    updateIntervalLabel() {
        const pattern = document.getElementById('recurrence-pattern').value;
        const label = document.getElementById('interval-label');
        const labels = {
            daily: 'days',
            weekly: 'weeks',
            monthly: 'months',
            yearly: 'years',
            custom: 'units'
        };
        label.textContent = labels[pattern] || 'days';
    },

    updatePreview() {
        const preview = document.getElementById('recurrence-preview');
        const pattern = document.getElementById('recurrence-pattern').value;
        const interval = document.getElementById('recurrence-interval').value;
        const endType = document.getElementById('recurrence-end-type').value;

        if (!document.getElementById('repeat-event').checked) {
            preview.style.display = 'none';
            return;
        }

        let previewText = 'Repeats ';
        
        // Pattern text
        switch (pattern) {
            case 'daily':
                previewText += interval === '1' ? 'daily' : `every ${interval} days`;
                break;
            case 'weekly':
                const selectedDays = Array.from(document.querySelectorAll('.weekday-btn.active'))
                    .map(btn => btn.textContent)
                    .join(', ');
                previewText += interval === '1' ? 
                    `weekly on ${selectedDays}` : 
                    `every ${interval} weeks on ${selectedDays}`;
                break;
            case 'monthly':
                previewText += interval === '1' ? 
                    'monthly' : `every ${interval} months`;
                break;
            case 'yearly':
                previewText += interval === '1' ? 
                    'yearly' : `every ${interval} years`;
                break;
            case 'weekdays':
                previewText += 'every weekday';
                break;
            case 'custom':
                previewText += `every ${interval} ${document.getElementById('interval-label').textContent}`;
                break;
        }

        // End text
        switch (endType) {
            case 'never':
                previewText += ' with no end date';
                break;
            case 'after':
                const occurrences = document.getElementById('occurrence-count').value;
                previewText += ` for ${occurrences} occurrences`;
                break;
            case 'on-date':
                const endDate = new Date(document.getElementById('end-date').value)
                    .toLocaleDateString();
                previewText += ` until ${endDate}`;
                break;
        }

        preview.textContent = previewText;
        preview.style.display = 'block';
    },

    getRecurrenceRule() {
        if (!document.getElementById('repeat-event').checked) {
            return null;
        }

        return {
            pattern: document.getElementById('recurrence-pattern').value,
            interval: parseInt(document.getElementById('recurrence-interval').value),
            weekdays: Array.from(document.querySelectorAll('.weekday-btn.active'))
                .map(btn => parseInt(btn.dataset.day)),
            endType: document.getElementById('recurrence-end-type').value,
            endAfter: parseInt(document.getElementById('occurrence-count').value),
            endDate: document.getElementById('end-date').value
        };
    },

    setRecurrenceRule(rule) {
        if (!rule) {
            this.clearRecurrenceForm();
            return;
        }

        document.getElementById('repeat-event').checked = true;
        document.getElementById('recurrence-options').classList.add('active');
        document.getElementById('recurrence-pattern').value = rule.pattern;
        document.getElementById('recurrence-interval').value = rule.interval;
        document.getElementById('recurrence-end-type').value = rule.endType;

        if (rule.weekdays) {
            document.querySelectorAll('.weekday-btn').forEach(btn => {
                btn.classList.toggle('active', 
                    rule.weekdays.includes(parseInt(btn.dataset.day)));
            });
        }

        if (rule.endType === 'after') {
            document.getElementById('occurrence-count').value = rule.endAfter;
        } else if (rule.endType === 'on-date') {
            document.getElementById('end-date').value = rule.endDate;
        }

        this.updatePreview();
    },

    clearRecurrenceForm() {
        document.getElementById('repeat-event').checked = false;
        document.getElementById('recurrence-options').classList.remove('active');
        document.getElementById('recurrence-pattern').value = 'daily';
        document.getElementById('recurrence-interval').value = '1';
        document.getElementById('recurrence-end-type').value = 'never';
        document.querySelectorAll('.weekday-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        this.updatePreview();
    },

    generateRecurrences(event, startDate) {
        const rule = event.recurrence;
        if (!rule) return [event];

        const events = [];
        let currentDate = new Date(startDate);
        let occurrences = 0;
        const maxOccurrences = rule.endType === 'after' ? rule.endAfter : 999;
        const endDate = rule.endType === 'on-date' ? new Date(rule.endDate) : null;

        while (occurrences < maxOccurrences && 
               (!endDate || currentDate <= endDate)) {
            
            if (this.shouldIncludeDate(currentDate, rule)) {
                events.push({
                    ...event,
                    date: this.formatDate(currentDate),
                    isRecurrence: true,
                    recurrenceId: event.id
                });
                occurrences++;
            }

            currentDate = this.getNextDate(currentDate, rule);
        }

        return events;
    },

    shouldIncludeDate(date, rule) {
        if (rule.pattern === 'weekdays') {
            const day = date.getDay();
            return day !== 0 && day !== 6;
        }

        if (rule.pattern === 'weekly' && rule.weekdays.length > 0) {
            return rule.weekdays.includes(date.getDay());
        }

        return true;
    },

    getNextDate(date, rule) {
        const next = new Date(date);
        
        switch (rule.pattern) {
            case 'daily':
                next.setDate(next.getDate() + rule.interval);
                break;
            case '
                case 'weekly':
                next.setDate(next.getDate() + (rule.interval * 7));
                break;
            case 'monthly':
                next.setMonth(next.getMonth() + rule.interval);
                break;
            case 'yearly':
                next.setFullYear(next.getFullYear() + rule.interval);
                break;
            case 'weekdays':
                do {
                    next.setDate(next.getDate() + 1);
                } while (next.getDay() === 0 || next.getDay() === 6);
                break;
            case 'custom':
                switch(this.getIntervalUnit(rule)) {
                    case 'days':
                        next.setDate(next.getDate() + rule.interval);
                        break;
                    case 'weeks':
                        next.setDate(next.getDate() + (rule.interval * 7));
                        break;
                    case 'months':
                        next.setMonth(next.getMonth() + rule.interval);
                        break;
                    case 'years':
                        next.setFullYear(next.getFullYear() + rule.interval);
                        break;
                }
                break;
        }

        return next;
    },

    getIntervalUnit(rule) {
        const pattern = document.getElementById('recurrence-pattern').value;
        switch(pattern) {
            case 'daily': return 'days';
            case 'weekly': return 'weeks';
            case 'monthly': return 'months';
            case 'yearly': return 'years';
            default: return 'days';
        }
    },

    formatDate(date) {
        return date.toISOString().split('T')[0];
    },

    // Handle recurring event updates
    updateRecurringEvent(eventData, allInstances = false) {
        const events = window.events;
        if (!events) return;

        Object.keys(events).forEach(dateKey => {
            events[dateKey] = events[dateKey].map(event => {
                if (allInstances) {
                    if (event.id === eventData.id || event.recurrenceId === eventData.id) {
                        return { ...eventData, recurrenceId: event.recurrenceId || event.id };
                    }
                } else {
                    if (event.id === eventData.id) {
                        return eventData;
                    }
                }
                return event;
            });
        });

        localStorage.setItem('calendar-events', JSON.stringify(events));
    },

    // Helper function to check if an event is recurring
    isRecurringEvent(event) {
        return event.recurrence || event.recurrenceId;
    }
};

// Initialize the module when the page loads
document.addEventListener('DOMContentLoaded', () => {
    RecurrenceModule.initialize();
});

// Export the module for use in the main calendar code
window.RecurrenceModule = RecurrenceModule;
