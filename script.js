const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx6syu2YxNkKht2hMfxZz6C-ctoxVBUazkY1qF85AtEW__X3E_Qt9KiIl0ex30y0BXt/exec';
const container = document.getElementById('event-container');
const yearSpan = document.getElementById('year');
yearSpan.textContent = new Date().getFullYear();

const CACHE_KEY = 'cbp_events_data_noimg';

async function init() {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
        try {
            const data = JSON.parse(cachedData);
            renderEventsGroupedByCity(data);
        } catch (e) {
            localStorage.removeItem(CACHE_KEY);
        }
    }
    await fetchEvents();
}

async function fetchEvents() {
    try {
        if (GAS_WEB_APP_URL.includes('YOUR_DEPLOYED_APPS_SCRIPT_URL_HERE')) return;

        const response = await fetch(GAS_WEB_APP_URL);
        if (!response.ok) throw new Error('Network error');
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        const currentDataStr = localStorage.getItem(CACHE_KEY);
        const newDataStr = JSON.stringify(data);

        if (newDataStr !== currentDataStr) {
            localStorage.setItem(CACHE_KEY, newDataStr);
            renderEventsGroupedByCity(data);
        }
    } catch (error) {
        console.error('Fetch failed:', error);
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
    
    const loader = container.querySelector('.loader');
    if (loader) loader.remove();

    if (events.length === 0) {
        contentArea.innerHTML = '<p style="text-align:center; padding: 2rem;">No upcoming shows listed at the moment. Check back soon!</p>';
        return;
    }

    const groups = {};
    events.forEach(event => {
        const city = event.City || 'Other Cities';
        if (!groups[city]) groups[city] = [];
        groups[city].push(event);
    });

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
    const userDesc = event.EventDescription || '';
    const link = event.TicketLink || '#';

    card.innerHTML = `
        <div class="event-content">
            <h3 class="event-title">${title}</h3>
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
    errorDisplay.innerHTML = `<div style="text-align: center; padding: 2rem; color: #be4840; border: 1px dashed #be4840; border-radius: 12px; background: rgba(190, 72, 64, 0.05);"><p>${message}</p></div>`;
    container.appendChild(errorDisplay);
}

init();
