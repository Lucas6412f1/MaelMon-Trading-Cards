// DOM element waar de content in wordt geladen
const appDiv = document.getElementById('app');

// Object om gebruikersdata in op te slaan (globaal beschikbaar voor alle "pagina's")
let currentUserData = null;

// --- Navigatie functies ---

// Deze functie pusht een nieuwe URL naar de browser geschiedenis
// en triggert het renderen van de juiste pagina
function navigateTo(path) {
    history.pushState(null, '', path);
    renderPage(path);
}

// Luister naar browser terug/vooruit knoppen om de pagina te updaten
window.addEventListener('popstate', () => {
    renderPage(window.location.pathname);
});

// --- Pagina Render functies ---

// Hoofdfunctie om de juiste "pagina" te renderen op basis van de URL
async function renderPage(path) {
    appDiv.innerHTML = ''; // Maak de app-div leeg voordat nieuwe content geladen wordt

    if (path === '/') {
        renderHomePage();
    } else if (path === '/dashboard') {
        await fetchAndRenderDashboard();
    } else if (path === '/admin') {
        // Eerst controleren of gebruiker is ingelogd en admin is
        // De user data kan al geladen zijn als je van dashboard komt, anders laden we het
        if (!currentUserData || !currentUserData.isLoggedIn) {
            // Probeer gebruikersdata op te halen voor controle
            currentUserData = await fetchUserData();
        }

        if (currentUserData && currentUserData.isLoggedIn && currentUserData.isAdmin) {
            renderAdminPage();
        } else {
            // Geen admin of niet ingelogd, redirect naar home
            navigateTo('/');
        }
    } else {
        // Pagina niet gevonden
        renderNotFoundPage();
    }

    // Zorg ervoor dat alle interne links die dynamisch worden geladen de SPA-navigatie gebruiken
    appDiv.querySelectorAll('a[href^="/"]').forEach(link => {
        // Voorkom dat links die expliciet als 'extern' zijn gemarkeerd, worden onderschept
        if (!link.dataset.external) {
            link.addEventListener('click', (e) => {
                e.preventDefault(); // Voorkom standaard linkgedrag (volledige reload)
                navigateTo(link.getAttribute('href')); // Navigeer via de SPA-router
            });
        }
    });
}

// Render de Homepagina
function renderHomePage() {
    appDiv.innerHTML = `
        <div class="container page-section active" id="home-page">
            <h1>Welkom bij MaelMon Trading Cards!</h1>
            <p>Log in met Twitch om je kaarten te beheren en te bekijken.</p>
            <button id="loginButton">Login met Twitch</button>
        </div>
    `;
    document.getElementById('loginButton').addEventListener('click', () => {
        // Link naar backend login - dit moet de volledige URL van je backend service zijn
        window.location.href = 'https://maelmon-backend.onrender.com/auth/twitch';
    });
}

// Haalt gebruikersdata op en render het dashboard
async function fetchAndRenderDashboard() {
    appDiv.innerHTML = `
        <div class="container page-section active" id="dashboard-page">
            <h1>Dashboard</h1>
            <div id="dashboard-content">
                <p>Laden van gebruikersdata...</p>
            </div>

            <button id="logoutButton" style="margin-top: 20px;">Uitloggen</button>
            <button id="homeButton" style="margin-top: 10px;">Terug naar Home</button>
            <div id="adminLinkContainer"></div>

            <h2>Jouw Kaarten:</h2>
            <div id="userCards">
                <p>Hier wordt later de lijst met kaarten weergegeven.</p>
            </div>

            <hr style="margin: 30px 0; border-color: #555;">

            <h2>Accountinstellingen</h2>
            <div id="settings-section">
                <h3>Gebruikersnaam aanpassen:</h3>
                <input type="text" id="usernameInput" placeholder="Nieuwe gebruikersnaam" style="padding: 8px; margin: 10px 0; border-radius: 4px; border: 1px solid #555; background-color: #444; color: white;">
                <button id="updateUsernameButton">Opslaan</button>
                <p id="usernameMessage" style="color: yellow;"></p>

                <h3>Weergave:</h3>
                <button id="toggleDarkMode">Dark Mode (AAN/UIT)</button>
                <input type="color" id="colorPicker" value="#61dafb" style="margin-top: 10px;">
                <label for="colorPicker">Accentkleur</label>
                <p style="margin-top: 15px;">Tekstgrootte:
                    <button id="decreaseFontSize">-</button>
                    <span id="currentFontSize">16px</span>
                    <button id="increaseFontSize">+</button>
                </p>
            </div>
        </div>
    `;

    const dashboardContent = document.getElementById('dashboard-content');
    const logoutButton = document.getElementById('logoutButton');
    const homeButton = document.getElementById('homeButton');
    const adminLinkContainer = document.getElementById('adminLinkContainer');

    try {
        // DEZE URL MOET NAAR JE BACKEND API WIJZEN
        const response = await fetch('https://maelmon-backend.onrender.com/api/user', {
            credentials: true // Belangrijk om de sessie-cookie mee te sturen
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        currentUserData = await response.json(); // Sla data globaal op
        if (!currentUserData.isLoggedIn) {
            // Als niet ingelogd, redirect naar homepagina van de frontend SPA
            navigateTo('/');
            return;
        }

        // Gebruiker is ingelogd, toon data
        let profileImageHtml = '';
        if (currentUserData.profileImageUrl) {
            profileImageHtml = `<img src="${currentUserData.profileImageUrl}" alt="${currentUserData.username}'s profielfoto" style="width: 100px; height: 100px; border-radius: 50%;">`;
        }

        dashboardContent.innerHTML = `
            <h2>Welkom, ${currentUserData.username}!</h2>
            ${profileImageHtml}
            <p>Jouw Twitch ID: ${currentUserData.twitchId}</p>
        `;

        if (currentUserData.isAdmin) {
            dashboardContent.innerHTML += `<p style="color: green; font-weight: bold;">Je bent een administrator!</p>`;
            adminLinkContainer.innerHTML = `<p><a href="#" onclick="navigateTo('/admin')">Ga naar het Admin Paneel</a></p>`; // Link naar admin path
        }

        // --- Instellingen logica (placeholders) ---
        const usernameInput = document.getElementById('usernameInput');
        const updateUsernameButton = document.getElementById('updateUsernameButton');
        const usernameMessage = document.getElementById('usernameMessage');
        const toggleDarkModeButton = document.getElementById('toggleDarkMode');
        const colorPicker = document.getElementById('colorPicker');
        const decreaseFontSizeButton = document.getElementById('decreaseFontSize');
        const increaseFontSizeButton = document.getElementById('increaseFontSize');
        const currentFontSizeSpan = document.getElementById('currentFontSize');

        usernameInput.value = currentUserData.username; // Vul huidige username in

        updateUsernameButton.addEventListener('click', () => {
            usernameMessage.textContent = 'Functionaliteit voor gebruikersnaam aanpassen nog niet geïmplementeerd.';
            usernameMessage.style.color = 'yellow';
            // Hier zou je een fetch() call naar een backend API endpoint maken om de username te updaten
            // fetch('https://maelmon-backend.onrender.com/api/user/update-username', { ... })
        });

        // Dark mode
        if (localStorage.getItem('darkMode') === 'enabled') {
            document.body.classList.add('dark-mode');
        }
        toggleDarkModeButton.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('darkMode', 'enabled');
            } else {
                localStorage.removeItem('darkMode');
            }
        });

        // Accentkleur
        const savedAccentColor = localStorage.getItem('accentColor');
        if (savedAccentColor) {
            document.body.style.setProperty('--accent-color', savedAccentColor);
            colorPicker.value = savedAccentColor;
        }
        colorPicker.addEventListener('input', (e) => {
            document.body.style.setProperty('--accent-color', e.target.value);
            localStorage.setItem('accentColor', e.target.value);
        });

        // Tekstgrootte
        let currentFontSize = parseInt(localStorage.getItem('fontSize')) || 16;
        document.body.style.fontSize = `${currentFontSize}px`;
        currentFontSizeSpan.textContent = `${currentFontSize}px`;

        decreaseFontSizeButton.addEventListener('click', () => {
            currentFontSize = Math.max(12, currentFontSize - 2);
            document.body.style.fontSize = `${currentFontSize}px`;
            currentFontSizeSpan.textContent = `${currentFontSize}px`;
            localStorage.setItem('fontSize', currentFontSize);
        });

        increaseFontSizeButton.addEventListener('click', () => {
            currentFontSize = Math.min(24, currentFontSize + 2);
            document.body.style.fontSize = `${currentFontSize}px`;
            currentFontSizeSpan.textContent = `${currentFontSize}px`;
            localStorage.setItem('fontSize', currentFontSize);
        });


    } catch (error) {
        dashboardContent.innerHTML = `<p class="error">${error.message}</p>`;
    }

    // Event listeners voor knoppen
    logoutButton.addEventListener('click', () => {
        // Link naar backend logout - dit moet de volledige URL van je backend service zijn
        window.location.href = 'https://maelmon-backend.onrender.com/auth/logout';
    });

    homeButton.addEventListener('click', () => {
        navigateTo('/'); // Navigeer naar de homepage van deze frontend SPA
    });
}

// Render de Admin Pagina
function renderAdminPage() {
    appDiv.innerHTML = `
        <div class="container page-section active" id="admin-page">
            <h1>Admin Paneel</h1>
            <p>Welkom, administrator ${currentUserData.username}!</p>
            <p>Hier kun je kaarten toevoegen, gebruikers beheren, etc.</p>

            <hr style="margin: 30px 0; border-color: #555;">

            <h2>Kaart Toevoegen</h2>
            <form id="addCardForm" style="text-align: left;">
                <label for="cardName">Naam:</label><br>
                <input type="text" id="cardName" name="name" required><br><br>

                <label for="cardType">Type:</label><br>
                <select id="cardType" name="type" required>
                    <option value="Monster">Monster</option>
                    <option value="Spell">Spell</option>
                    <option value="Item">Item</option>
                </select><br><br>

                <label for="cardAttack">Attack:</label><br>
                <input type="number" id="cardAttack" name="attack" required><br><br>

                <label for="cardDefense">Defense:</label><br>
                <input type="number" id="cardDefense" name="defense" required><br><br>

                <label for="characterImageUrl">Karakter Afbeelding URL:</label><br>
                <input type="url" id="characterImageUrl" name="characterImageUrl" required><br><br>

                <label for="backgroundImageUrl">Achtergrond Afbeelding URL:</label><br>
                <input type="url" id="backgroundImageUrl" name="backgroundImageUrl" required><br><br>

                <label for="cardRarity">Zeldzaamheid:</label><br>
                <select id="cardRarity" name="rarity" required>
                    <option value="Common">Common</option>
                    <option value="Uncommon">Uncommon</option>
                    <option value="Rare">Rare</option>
                    <option value="Epic">Epic</option>
                    <option value="Legendary">Legendary</option>
                    <option value="Unique">Unique</option>
                </select><br><br>

                <label for="maxSupply">Max Supply (-1 voor onbeperkt):</label><br>
                <input type="number" id="maxSupply" name="maxSupply" value="-1"><br><br>

                <button type="submit">Kaart Toevoegen</button>
            </form>
            <p id="addCardMessage" style="margin-top: 15px;"></p>

            <p style="margin-top: 20px;">
                <a href="#" onclick="navigateTo('/dashboard')">Terug naar Dashboard</a>
            </p>
            <p>
                <a href="#" onclick="navigateTo('/')">Terug naar Home</a>
            </p>
        </div>
    `;

    const addCardForm = document.getElementById('addCardForm');
    const addCardMessage = document.getElementById('addCardMessage');

    addCardForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        addCardMessage.textContent = 'Kaart toevoegen...';
        addCardMessage.style.color = 'yellow';

        const formData = new FormData(addCardForm);
        const cardData = Object.fromEntries(formData.entries());

        // Convereteer numerieke waarden
        cardData.attack = parseInt(cardData.attack);
        cardData.defense = parseInt(cardData.defense);
        cardData.maxSupply = parseInt(cardData.maxSupply);

        try {
            const response = await fetch('https://maelmon-backend.onrender.com/api/admin/cards', { // Link naar backend API
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
                addCardMessage.style.color = 'lightgreen';
                addCardForm.reset(); // Formulier resetten
            } else {
                addCardMessage.textContent = `Fout: ${result.message}`;
                addCardMessage.style.color = 'red';
            }
        } catch (error) {
            console.error('Fout bij het verzenden van kaartdata:', error);
            addCardMessage.textContent = `Fout: Er ging iets mis bij het toevoegen van de kaart.`;
            addCardMessage.style.color = 'red';
        }
    });
}

// Render de 404 Pagina
function renderNotFoundPage() {
    appDiv.innerHTML = `
        <div class="container page-section active">
            <h2>Pagina niet gevonden!</h2>
            <p>Navigeer naar de <a href="#" onclick="navigateTo('/')">homepage</a>.</p>
        </div>
    `;
}

// Functie om gebruikersdata op te halen (herbruikbaar)
async function fetchUserData() {
    try {
        const response = await fetch('https://maelmon-backend.onrender.com/api/user', {
            credentials: true
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


// --- Initialisatie ---
document.addEventListener('DOMContentLoaded', () => {
    // Rendert de juiste pagina bij het laden van de SPA (afhankelijk van de URL)
    renderPage(window.location.pathname);
});