// REPLACE THIS URL with your deployed Google Apps Script Web App URL
const GAS_WEB_APP_URL = 'YOUR_DEPLOYED_APPS_SCRIPT_URL_HERE';

const container = document.getElementById('event-container');
const yearSpan = document.getElementById('year');

// Set current year in footer
yearSpan.textContent = new Date().getFullYear();

async function fetchEvents() {
    try {
        if (GAS_WEB_APP_URL.includes('https://script.google.com/macros/s/AKfycbwxwdy9_uvOz0u-cjwvHuUSEYMCxhGcDk4aAqeNkb1AsrivCVagzbREevN1bRsAS-s/exec')) {
            showError('Please deploy your Google Apps Script and paste the Web App URL in script.js');
            return;
        }

        const response = await fetch(GAS_WEB_APP_URL);
        if (!response.ok) throw new Error('Failed to fetch events');
        
        const data = await response.json();
        renderEventsGroupedByCity(data);
    } catch (error) {
        console.error('Error fetching events:', error);
        showError('Could not load events. Please check the Google Sheet setup.');
    }
}

function renderEventsGroupedByCity(events) {
    container.innerHTML = '';
    
    if (events.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 2rem;">No upcoming shows listed at the moment. Check back soon!</p>';
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

    sortedCities.forEach(city => {
        const section = document.createElement('section');
        section.className = 'city-section';
        
        const header = document.createElement('h2');
        header.className = 'city-header';
        header.textContent = city;
        section.appendChild(header);

        const cityEvents = groups[city];
        cityEvents.forEach(event => {
            const card = createEventCard(event);
            section.appendChild(card);
        });

        container.appendChild(section);
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
    container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #be4840;">
            <p>${message}</p>
        </div>
    `;
}

// Start fetching
fetchEvents();
