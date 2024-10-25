// Weather Integration Module
const WeatherModule = {
    API_KEY: 'YOUR_WEATHER_API_KEY', // Replace with your OpenWeatherMap API key
    city: 'London', // Default city, can be made configurable
    weatherCache: new Map(),

    // Weather icon mappings to Font Awesome icons
    weatherIcons: {
        'Clear': 'sun',
        'Clouds': 'cloud',
        'Rain': 'cloud-rain',
        'Drizzle': 'cloud-rain',
        'Thunderstorm': 'bolt',
        'Snow': 'snowflake',
        'Mist': 'smog',
        'Fog': 'smog',
        'Haze': 'smog',
        'Dust': 'smog',
        'Sand': 'smog',
        'Ash': 'smog',
        'Squall': 'wind',
        'Tornado': 'tornado'
    },

    initialize() {
        this.setupStyles();
        this.loadConfig();
    },

    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .weather-info {
                position: absolute;
                top: 5px;
                right: 5px;
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 0.8em;
                color: var(--text-secondary);
                background: var(--background);
                padding: 2px 6px;
                border-radius: 12px;
                backdrop-filter: blur(4px);
                border: 1px solid var(--border);
                opacity: 0.9;
                transition: opacity 0.2s;
            }

            .weather-info:hover {
                opacity: 1;
            }

            .weather-info i {
                font-size: 1.2em;
            }

            .dark-theme .weather-info {
                background: rgba(0, 0, 0, 0.2);
            }

            .weather-tooltip {
                position: absolute;
                top: 100%;
                right: 0;
                background: var(--background);
                border: 1px solid var(--border);
                border-radius: 6px;
                padding: 8px;
                font-size: 0.9em;
                display: none;
                z-index: 10;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                min-width: 150px;
            }

            .weather-info:hover .weather-tooltip {
                display: block;
            }

            .weather-tooltip-row {
                display: flex;
                justify-content: space-between;
                margin: 2px 0;
            }

            .weather-loading {
                animation: pulse 1.5s infinite;
            }

            @keyframes pulse {
                0% { opacity: 0.6; }
                50% { opacity: 1; }
                100% { opacity: 0.6; }
            }
        `;
        document.head.appendChild(style);
    },

    loadConfig() {
        const savedCity = localStorage.getItem('weather-city');
        if (savedCity) {
            this.city = savedCity;
        }
    },

    saveConfig() {
        localStorage.setItem('weather-city', this.city);
    },

    async getWeather(date) {
        const dateStr = this.formatDate(date);
        
        // Check cache first
        if (this.weatherCache.has(dateStr)) {
            return this.weatherCache.get(dateStr);
        }

        // Only fetch weather for next 5 days
        const today = new Date();
        const fiveDaysFromNow = new Date(today);
        fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
        
        if (date < today || date > fiveDaysFromNow) {
            return null;
        }

        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/forecast?q=${this.city}&appid=${this.API_KEY}&units=metric`
            );

            if (!response.ok) {
                throw new Error('Weather API request failed');
            }

            const data = await response.json();
            const weatherData = this.processWeatherData(data, date);
            
            // Cache the result
            this.weatherCache.set(dateStr, weatherData);
            
            // Clear old cache entries
            this.cleanCache();
            
            return weatherData;
        } catch (error) {
            console.error('Error fetching weather:', error);
            return null;
        }
    },

    processWeatherData(data, targetDate) {
        const targetDateStr = this.formatDate(targetDate);
        
        // Find the forecast closest to noon on the target date
        const targetForecasts = data.list.filter(item => {
            const itemDate = new Date(item.dt * 1000);
            return this.formatDate(itemDate) === targetDateStr;
        });

        if (targetForecasts.length === 0) return null;

        // Get the forecast closest to noon
        const noonForecast = targetForecasts.reduce((prev, curr) => {
            const prevTime = new Date(prev.dt * 1000).getHours();
            const currTime = new Date(curr.dt * 1000).getHours();
            return Math.abs(prevTime - 12) < Math.abs(currTime - 12) ? prev : curr;
        });

        return {
            temp: Math.round(noonForecast.main.temp),
            condition: noonForecast.weather[0].main,
            icon: this.weatherIcons[noonForecast.weather[0].main] || 'cloud-question',
            description: noonForecast.weather[0].description,
            humidity: noonForecast.main.humidity,
            windSpeed: Math.round(noonForecast.wind.speed),
            feelsLike: Math.round(noonForecast.main.feels_like),
            tempMin: Math.round(noonForecast.main.temp_min),
            tempMax: Math.round(noonForecast.main.temp_max)
        };
    },

    formatDate(date) {
        return date.toISOString().split('T')[0];
    },

    cleanCache() {
        const today = new Date();
        this.weatherCache.forEach((value, key) => {
            const cacheDate = new Date(key);
            if (cacheDate < today) {
                this.weatherCache.delete(key);
            }
        });
    },

    createWeatherElement(weatherData) {
        if (!weatherData) return null;

        const weatherDiv = document.createElement('div');
        weatherDiv.className = 'weather-info';
        
        weatherDiv.innerHTML = `
            <i class="fas fa-${weatherData.icon}" title="${weatherData.description}"></i>
            <span>${weatherData.temp}°C</span>
            <div class="weather-tooltip">
                <div class="weather-tooltip-row">
                    <span>Condition:</span>
                    <span>${weatherData.description}</span>
                </div>
                <div class="weather-tooltip-row">
                    <span>Feels like:</span>
                    <span>${weatherData.feelsLike}°C</span>
                </div>
                <div class="weather-tooltip-row">
                    <span>Min/Max:</span>
                    <span>${weatherData.tempMin}°C / ${weatherData.tempMax}°C</span>
                </div>
                <div class="weather-tooltip-row">
                    <span>Humidity:</span>
                    <span>${weatherData.humidity}%</span>
                </div>
                <div class="weather-tooltip-row">
                    <span>Wind:</span>
                    <span>${weatherData.windSpeed} m/s</span>
                </div>
            </div>
        `;

        return weatherDiv;
    },

    // Helper function to check if weather should be displayed for a date
    shouldShowWeather(date) {
        const today = new Date();
        const fiveDaysFromNow = new Date(today);
        fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
        
        return date >= today && date <= fiveDaysFromNow;
    },

    // Function to add weather to a calendar day element
    async addWeatherToDay(dayElement, date) {
        if (!this.shouldShowWeather(date)) return;

        // Add loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'weather-info weather-loading';
        loadingDiv.innerHTML = `<i class="fas fa-spinner"></i>`;
        dayElement.appendChild(loadingDiv);

        try {
            const weatherData = await this.getWeather(date);
            if (weatherData) {
                const weatherElement = this.createWeatherElement(weatherData);
                dayElement.replaceChild(weatherElement, loadingDiv);
            } else {
                loadingDiv.remove();
            }
        } catch (error) {
            console.error('Error adding weather:', error);
            loadingDiv.remove();
        }
    }
};

// Initialize the module when the page loads
document.addEventListener('DOMContentLoaded', () => {
    WeatherModule.initialize();
});

// Export the module for use in the main calendar code
window.WeatherModule = WeatherModule;
