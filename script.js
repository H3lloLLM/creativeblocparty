const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzcNZGgvv-Ff0DQ3W-RWW1rjfHP6w1q-ESEhJe7k_ph1bMirIIu2i2_CrYDRmundqEB/exec';
const container = document.getElementById('event-container');
const yearSpan = document.getElementById('year');
yearSpan.textContent = new Date().getFullYear();

// Cache Key for local storage
const CACHE_KEY = 'cbp_events_data';

async function init() {
    // 1. Try to load from Local Storage immediately for "instant" feel
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
        try {
            const data = JSON.parse(cachedData);
            renderEventsGroupedByCity(data);
        } catch (e) {
            console.error('Failed to parse cache:', e);
            localStorage.removeItem(CACHE_KEY);
        }
    }

    // 2. Fetch fresh data from the sheet in the background
    await fetchEvents();
}

async function fetchEvents() {
    try {
        if (GAS_WEB_APP_URL.includes('YOUR_DEPLOYED_APPS_SCRIPT_URL_HERE')) return;

        const response = await fetch(GAS_WEB_APP_URL);
        if (!response.ok) throw new Error('Network error');
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        // 3. Check if new data is different from what we already have
        const currentDataStr = localStorage.getItem(CACHE_KEY);
        const newDataStr = JSON.stringify(data);

        if (newDataStr !== currentDataStr) {
            // Update storage and refresh the UI silently
            localStorage.setItem(CACHE_KEY, newDataStr);
            renderEventsGroupedByCity(data);
        }
    } catch (error) {
        console.error('Fetch failed:', error);
        // Only show error message if the page is totally empty
        if (!localStorage.getItem(CACHE_KEY)) {
            showError('Could not load events. Please check your connection.');
        }
    }
}

function renderEventsGroupedByCity(events) {
    let contentArea = document.getElementById('event-content-area');
    if (!contentArea) {
        contentArea = document.createElement('div');
        contentArea.id = 'event-content-area';
        container.appendChild(contentArea);
    }
    
    // Remove loader if present
    const loader = container.querySelector('.loader');
    if (loader) loader.remove();

    if (events.length === 0) {
        contentArea.innerHTML = '<p style="text-align:center; padding: 2rem;">No upcoming shows listed at the moment. Check back soon!</p>';
        return;
    }

    // Group events by city
    const groups = {};
    events.forEach(event => {
        const city = event.City || 'Other Cities';
        if (!groups[city]) groups[city] = [];
        groups[city].push(event);
    });

    // Define preferred city order
    const preferredOrder = ['Mumbai', 'Pune', 'Bengaluru'];
    const sortedCities = Object.keys(groups).sort((a, b) => {
        const indexA = preferredOrder.indexOf(a);
        const indexB = preferredOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });

    contentArea.innerHTML = '';
    sortedCities.forEach(city => {
        const section = document.createElement('section');
        section.className = 'city-section';
        
        const header = document.createElement('h2');
        header.className = 'city-header';
        header.textContent = city;
        section.appendChild(header);

        groups[city].forEach(event => {
            section.appendChild(createEventCard(event));
        });

        contentArea.appendChild(section);
    });
}

function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    
    const title = event.Title || 'Upcoming Show';
    const image = event.Image || 'transparent.png';
    const metaDesc = event.LinkDescription || '';
    const userDesc = event.EventDescription || '';
    const link = event.TicketLink || '#';

    card.innerHTML = `
        ${image ? `<img src="${image}" alt="${title}" class="event-image" onerror="this.onerror=null; this.src='transparent.png'">` : ''}
        <div class="event-content">
            <h3 class="event-title">${title}</h3>
            ${metaDesc ? `<p class="event-meta-description">${metaDesc}</p>` : ''}
            ${userDesc ? `<div class="user-description">${userDesc}</div>` : ''}
            <a href="${link}" target="_blank" class="ticket-button">Get Tickets</a>
        </div>
    `;
    return card;
}

function showError(message) {
    const loader = container.querySelector('.loader');
    if (loader) loader.remove();
    
    const errorDisplay = document.createElement('div');
    errorDisplay.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #be4840; border: 1px dashed #be4840; border-radius: 12px; background: rgba(190, 72, 64, 0.05);">
            <p>${message}</p>
        </div>
    `;
    container.appendChild(errorDisplay);
}

// Kick off the process
init();
