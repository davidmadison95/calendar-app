// Tags Module for Calendar
const TagsModule = {
    tags: new Set(),
    activeFilters: new Set(),
    
    initialize() {
        this.loadTags();
        this.setupStyles();
        this.setupTagsUI();
        this.setupFilterBar();
    },

    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .tags-container {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-bottom: 16px;
            }

            .tag-input-container {
                position: relative;
                width: 100%;
                margin-bottom: 16px;
            }

            .tag-input {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid var(--border);
                border-radius: 6px;
                background: var(--background);
                color: var(--text);
                font-size: 0.9em;
            }

            .tag-suggestions {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: var(--background);
                border: 1px solid var(--border);
                border-radius: 6px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                display: none;
                max-height: 200px;
                overflow-y: auto;
            }

            .tag-suggestion {
                padding: 8px 12px;
                cursor: pointer;
                transition: background-color 0.2s;
                color: var(--text);
            }

            .tag-suggestion:hover {
                background: var(--surface);
            }

            .tag {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 4px 12px;
                background: var(--surface);
                border: 1px solid var(--border);
                border-radius: 16px;
                font-size: 0.8em;
                cursor: pointer;
                transition: all 0.2s ease;
                color: var(--text);
            }

            .tag:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            .tag.active {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
            }

            .tag-remove {
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                background: rgba(0, 0, 0, 0.1);
                cursor: pointer;
                transition: all 0.2s;
                margin-left: 4px;
            }

            .tag-remove:hover {
                background: rgba(0, 0, 0, 0.2);
            }

            .filter-bar {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 16px;
                padding: 12px;
                background: var(--surface);
                border-radius: 8px;
                overflow-x: auto;
                border: 1px solid var(--border);
            }

            .clear-filters {
                padding: 4px 12px;
                background: var(--primary);
                color: white;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.8em;
                white-space: nowrap;
                border: none;
                transition: background-color 0.2s;
            }

            .clear-filters:hover {
                background: var(--primary-hover);
            }

            .event-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                margin-top: 8px;
            }

            .highlight {
                animation: highlight 0.3s ease-out;
            }

            @keyframes highlight {
                0% { transform: scale(1); }
                50% { transform: scale(1.02); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    },

    setupTagsUI() {
        const modalContent = document.querySelector('.modal-content');
        const tagInput = this.createTagInput();
        modalContent.insertBefore(tagInput, document.querySelector('.button-group'));
    },

    setupFilterBar() {
        const calendar = document.querySelector('.calendar-container');
        const filterBar = document.createElement('div');
        filterBar.className = 'filter-bar';
        filterBar.innerHTML = `
            <div class="tags-container"></div>
            <button class="clear-filters" style="display: none;">
                Clear Filters
            </button>
        `;
        calendar.insertBefore(filterBar, calendar.firstChild);
        
        filterBar.querySelector('.clear-filters').addEventListener('click', () => {
            this.clearFilters();
        });
        
        this.updateFilterBar();
    },

    createTagInput() {
        const container = document.createElement('div');
        container.className = 'tag-input-container';
        
        container.innerHTML = `
            <label for="event-tags">Tags</label>
            <input type="text" id="event-tags" class="tag-input" 
                   placeholder="Add tags (press Enter or comma to add)">
            <div class="tag-suggestions"></div>
            <div class="event-tags"></div>
        `;

        const input = container.querySelector('.tag-input');
        const suggestions = container.querySelector('.tag-suggestions');
        
        input.addEventListener('input', () => this.handleTagInput(input, suggestions));
        input.addEventListener('keydown', (e) => this.handleTagKeydown(e, input));
        input.addEventListener('blur', () => {
            // Delay hiding suggestions to allow for clicks
            setTimeout(() => {
                suggestions.style.display = 'none';
            }, 200);
        });
        
        return container;
    },

    handleTagInput(input, suggestions) {
        const value = input.value.trim();
        if (!value) {
            suggestions.style.display = 'none';
            return;
        }

        const currentWord = value.split(',').pop().trim().toLowerCase();
        if (!currentWord) {
            suggestions.style.display = 'none';
            return;
        }

        const matches = Array.from(this.tags)
            .filter(tag => tag.toLowerCase().includes(currentWord))
            .slice(0, 5);

        if (matches.length) {
            suggestions.innerHTML = matches
                .map(tag => `<div class="tag-suggestion">${tag}</div>`)
                .join('');
            suggestions.style.display = 'block';

            suggestions.querySelectorAll('.tag-suggestion').forEach(suggestion => {
                suggestion.addEventListener('click', () => {
                    this.addTagFromSuggestion(input, suggestion.textContent);
                    suggestions.style.display = 'none';
                });
            });
        } else {
            suggestions.style.display = 'none';
        }
    },

    handleTagKeydown(e, input) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const value = input.value.trim();
            if (value) {
                this.addTag(value);
                input.value = '';
            }
        }
    },

    addTagFromSuggestion(input, tag) {
        const currentTags = input.value.split(',').map(t => t.trim());
        currentTags.pop(); // Remove the partial tag
        currentTags.push(tag);
        input.value = currentTags.join(', ') + ', ';
        this.addTag(tag);
    },

    addTag(tagName) {
        tagName = tagName.trim().toLowerCase();
        if (!tagName) return;

        this.tags.add(tagName);
        this.saveTags();
        this.updateFilterBar();
        this.highlightFilterBar();
    },

    removeTag(tagName) {
        this.tags.delete(tagName);
        this.activeFilters.delete(tagName);
        this.saveTags();
        this.updateFilterBar();
        this.applyFilters();
    },

    toggleFilter(tagName) {
        if (this.activeFilters.has(tagName)) {
            this.activeFilters.delete(tagName);
        } else {
            this.activeFilters.add(tagName);
        }
        this.applyFilters();
        this.updateFilterBar();
    },

    applyFilters() {
        const events = window.events;
        if (!events || this.activeFilters.size === 0) {
            window.renderCalendar();
            document.querySelector('.clear-filters').style.display = 'none';
            return;
        }

        document.querySelector('.clear-filters').style.display = 'block';

        const filteredEvents = {};
        Object.entries(events).forEach(([date, dayEvents]) => {
            const filtered = dayEvents.filter(event => 
                event.tags && event.tags.some(tag => 
                    this.activeFilters.has(tag.toLowerCase())
                )
            );
            if (filtered.length > 0) {
                filteredEvents[date] = filtered;
            }
        });

        window.events = filteredEvents;
        window.renderCalendar();
        window.events = events; // Restore original events
    },

    clearFilters() {
        this.activeFilters.clear();
        this.applyFilters();
        this.updateFilterBar();
    },

    updateFilterBar() {
        const container = document.querySelector('.tags-container');
        container.innerHTML = Array.from(this.tags)
            .map(tag => `
                <div class="tag ${this.activeFilters.has(tag) ? 'active' : ''}" 
                     data-tag="${tag}">
                    ${tag}
                    <span class="tag-remove">×</span>
                </div>
            `)
            .join('');

        container.querySelectorAll('.tag').forEach(tagElement => {
            const tagName = tagElement.dataset.tag;
            
            tagElement.addEventListener('click', (e) => {
                if (!e.target.classList.contains('tag-remove')) {
                    this.toggleFilter(tagName);
                }
            });
            
            tagElement.querySelector('.tag-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeTag(tagName);
            });
        });
    },

    highlightFilterBar() {
        const filterBar = document.querySelector('.filter-bar');
        filterBar.classList.add('highlight');
        setTimeout(() => filterBar.classList.remove('highlight'), 300);
    },

    getEventTags() {
        const input = document.getElementById('event-tags');
        if (!input) return [];
        return input.value
            .split(',')
            .map(tag => tag.trim().toLowerCase())
            .filter(tag => tag.length > 0);
    },

    setEventTags(tags) {
        const input = document.getElementById('event-tags');
        if (input && tags) {
            input.value = tags.join(', ');
        }
    },

    clearEventTags() {
        const input = document.getElementById('event-tags');
        if (input) {
            input.value = '';
        }
    },

    loadTags() {
        const savedTags = localStorage.getItem('calendar-tags');
        if (savedTags) {
            this.tags = new Set(JSON.parse(savedTags));
        }
    },

    saveTags() {
        localStorage.setItem('calendar-tags', JSON.stringify(Array.from(this.tags)));
    }
};

// Initialize the module when the page loads
document.addEventListener('DOMContentLoaded', () => {
    TagsModule.initialize();
});

// Export the module for use in the main calendar code
window.TagsModule = TagsModule;
