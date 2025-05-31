// script.js

// Object om gebruikersdata in op te slaan (globaal beschikbaar voor alle "pagina's")
let currentUserData = null;

// Functie om gebruikersdata op te halen (herbruikbaar)
async function fetchUserData() {
    try {
        const response = await fetch('https://maelmon-backend.onrender.com/api/user', {
            credentials: true // Belangrijk om de sessie-cookie mee te sturen
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Fout bij ophalen gebruikersdata:", error);
        return { isLoggedIn: false, error: "Kon gebruikersdata niet ophalen. Probeer opnieuw in te loggen." };
    }
}

// Functie om gemeenschappelijke instellingen te initialiseren
function initializeSettings() {
    const toggleDarkModeButton = document.getElementById('toggleDarkMode');
    const colorPicker = document.getElementById('colorPicker');
    const decreaseFontSizeButton = document.getElementById('decreaseFontSize');
    const increaseFontSizeButton = document.getElementById('increaseFontSize');
    const currentFontSizeSpan = document.getElementById('currentFontSize');

    // Dark mode
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
    }
    if (toggleDarkModeButton) { // Zorg ervoor dat de knop bestaat op de pagina
        toggleDarkModeButton.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('darkMode', 'enabled');
            } else {
                localStorage.removeItem('darkMode');
            }
        });
    }

    // Accentkleur
    const savedAccentColor = localStorage.getItem('accentColor');
    if (savedAccentColor) {
        document.body.style.setProperty('--accent-color', savedAccentColor);
        if (colorPicker) { // Zorg ervoor dat de color picker bestaat
            colorPicker.value = savedAccentColor;
        }
    }
    if (colorPicker) {
        colorPicker.addEventListener('input', (e) => {
            document.body.style.setProperty('--accent-color', e.target.value);
            localStorage.setItem('accentColor', e.target.value);
        });
    }

    // Tekstgrootte
    let currentFontSize = parseInt(localStorage.getItem('fontSize')) || 16;
    document.body.style.fontSize = `${currentFontSize}px`;
    if (currentFontSizeSpan) {
        currentFontSizeSpan.textContent = `${currentFontSize}px`;
    }

    if (decreaseFontSizeButton) {
        decreaseFontSizeButton.addEventListener('click', () => {
            currentFontSize = Math.max(12, currentFontSize - 2);
            document.body.style.fontSize = `${currentFontSize}px`;
            if (currentFontSizeSpan) currentFontSizeSpan.textContent = `${currentFontSize}px`;
            localStorage.setItem('fontSize', currentFontSize);
        });
    }

    if (increaseFontSizeButton) {
        increaseFontSizeButton.addEventListener('click', () => {
            currentFontSize = Math.min(24, currentFontSize + 2);
            document.body.style.fontSize = `${currentFontSize}px`;
            if (currentFontSizeSpan) currentFontSizeSpan.textContent = `${currentFontSize}px`;
            localStorage.setItem('fontSize', currentFontSize);
        });
    }
}


// --- Initialisatie op basis van de huidige pagina ---
document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;

    if (path === '/' || path === '/index.html') {
        // Logica voor de homepage
        const loginButton = document.getElementById('loginButton');
        if (loginButton) {
            loginButton.addEventListener('click', () => {
                window.location.href = 'https://maelmon-backend.onrender.com/auth/twitch';
            });
        }
    } else if (path === '/dashboard.html') {
        // Logica voor de dashboard pagina
        currentUserData = await fetchUserData();
        const dashboardContent = document.getElementById('dashboard-content');
        const adminLinkContainer = document.getElementById('adminLinkContainer');
        const usernameInput = document.getElementById('usernameInput');
        const updateUsernameButton = document.getElementById('updateUsernameButton');
        const usernameMessage = document.getElementById('usernameMessage');
        const logoutButton = document.getElementById('logoutButton');

        if (!currentUserData.isLoggedIn) {
            // Als niet ingelogd, redirect naar homepagina
            window.location.href = '/';
            return;
        }

        let profileImageHtml = '';
        if (currentUserData.profileImageUrl) {
            // Gebruik de nieuwe class
            profileImageHtml = `<img src="${currentUserData.profileImageUrl}" alt="${currentUserData.username}'s profielfoto" class="profile-image">`;
        }

        dashboardContent.innerHTML = `
            <h2>Welkom, ${currentUserData.username}!</h2>
            ${profileImageHtml}
            <p>Jouw Twitch ID: ${currentUserData.twitchId}</p>
        `;

        if (currentUserData.isAdmin) {
            dashboardContent.innerHTML += `<p style="color: green; font-weight: bold;">Je bent een administrator!</p>`; // Deze inline style kan blijven voor specifieke accenten die niet elders gebruikt worden
            adminLinkContainer.innerHTML = `<p><a href="/admin.html">Ga naar het Admin Paneel</a></p>`; // Link naar admin.html
        }

        if (usernameInput) usernameInput.value = currentUserData.username;
        if (updateUsernameButton) {
            updateUsernameButton.addEventListener('click', () => {
                usernameMessage.textContent = 'Functionaliteit voor gebruikersnaam aanpassen nog niet geïmplementeerd.';
                usernameMessage.style.color = 'yellow'; // Deze inline style kan blijven voor specifieke accenten die niet elders gebruikt worden
            });
        }
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                window.location.href = 'https://maelmon-backend.onrender.com/auth/logout';
            });
        }

        initializeSettings(); // Roep de instellingen functie aan
    } else if (path === '/admin.html') {
        // Logica voor de admin pagina
        currentUserData = await fetchUserData();
        const adminContent = document.getElementById('admin-content');
        const addCardForm = document.getElementById('addCardForm');
        const addCardMessage = document.getElementById('addCardMessage');

        if (!currentUserData.isLoggedIn || !currentUserData.isAdmin) {
            // Als niet ingelogd of geen admin, redirect naar homepagina
            window.location.href = '/';
            return;
        }

        adminContent.innerHTML = `<p>Welkom, administrator ${currentUserData.username}!</p><p>Hier kun je kaarten toevoegen, gebruikers beheren, etc.</p>`;

        if (addCardForm) {
            addCardForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                addCardMessage.textContent = 'Kaart toevoegen...';
                addCardMessage.style.color = 'yellow'; // Deze inline style kan blijven voor specifieke accenten die niet elders gebruikt worden

                const formData = new FormData(addCardForm);
                const cardData = Object.fromEntries(formData.entries());

                cardData.attack = parseInt(cardData.attack);
                cardData.defense = parseInt(cardData.defense);
                cardData.maxSupply = parseInt(cardData.maxSupply);

                try {
                    const response = await fetch('https://maelmon-backend.onrender.com/api/admin/cards', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(cardData),
                        credentials: true
                    });

                    const result = await response.json();

                    if (response.ok) {
                        addCardMessage.textContent = `Succes: ${result.message}`;
                        addCardMessage.style.color = 'lightgreen'; // Deze inline style kan blijven voor specifieke accenten die niet elders gebruikt worden
                        addCardForm.reset();
                    } else {
                        addCardMessage.textContent = `Fout: ${result.message}`;
                        addCardMessage.style.color = 'red'; // Deze inline style kan blijven voor specifieke accenten die niet elders gebruikt worden
                    }
                } catch (error) {
                    console.error('Fout bij het verzenden van kaartdata:', error);
                    addCardMessage.textContent = `Fout: Er ging iets mis bij het toevoegen van de kaart.`;
                    addCardMessage.style.color = 'red'; // Deze inline style kan blijven voor specifieke accenten die niet elders gebruikt worden
                }
            });
        }
    }
});