// Weather Integration Module
const WeatherModule = {
    API_KEY: 'YOUR_WEATHER_API_KEY', // Replace with your OpenWeatherMap API key
    city: 'London', // Default city, can be made configurable
    weatherCache: new Map(),

    // Weather icon mappings
    weatherIcons: {
        'Clear': 'sun',
        'Clouds': 'cloud',
        'Rain': 'cloud-rain',
        'Drizzle': 'cloud-drizzle',
        'Thunderstorm': 'cloud-lightning',
        'Snow': 'cloud-snow',
        'Mist': 'cloud-fog',
        'Fog': 'cloud-fog',
        'Haze': 'cloud-fog'
    },

    async getWeather(date) {
        const dateStr = this.formatDate(date);
        
        // Check cache first
        if (this.weatherCache.has(dateStr)) {
            return this.weatherCache.get(dateStr);
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
        
        // Find the most relevant forecast for the target date
        const forecast = data.list.find(item => {
            const itemDate = new Date(item.dt * 1000);
            return this.formatDate(itemDate) === targetDateStr;
        });

        if (!forecast) return null;

        return {
            temp: Math.round(forecast.main.temp),
            condition: forecast.weather[0].main,
            icon: this.weatherIcons[forecast.weather[0].main] || 'cloud-question',
            description: forecast.weather[0].description,
            humidity: forecast.main.humidity,
            windSpeed: forecast.wind.speed
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
        `;
        
        // Add detailed weather tooltip
        weatherDiv.title = `
            Condition: ${weatherData.description}
            Temperature: ${weatherData.temp}°C
            Humidity: ${weatherData.humidity}%
            Wind: ${weatherData.windSpeed} m/s
        `.trim();

        return weatherDiv;
    }
};

// Add these styles to your CSS
const weatherStyles = `
.weather-info {
    position: absolute;
    top: 5px;
    right: 5px;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.8em;
    color: var(--text-secondary);
    background: rgba(255, 255, 255, 0.8);
    padding: 2px 6px;
    border-radius: 12px;
    backdrop-filter: blur(4px);
}

.weather-info i {
    font-size: 1.2em;
}

.dark-theme .weather-info {
    background: rgba(0, 0, 0, 0.2);
}
`;

// Add this to your calendar rendering function
async function addWeatherToDay(dayElement, date) {
    if (isWithinFiveDays(date)) {
        const weatherData = await WeatherModule.getWeather(date);
        const weatherElement = WeatherModule.createWeatherElement(weatherData);
        if (weatherElement) {
            dayElement.appendChild(weatherElement);
        }
    }
}

// Utility function to check if date is within the next 5 days
function isWithinFiveDays(date) {
    const today = new Date();
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
    return date >= today && date <= fiveDaysFromNow;
}

// Usage in your main calendar code:
// 1. Add the weatherStyles to your CSS
// 2. In your renderCalendar function, after creating each day element:
/*
    await addWeatherToDay(dayElement, date);
*/
