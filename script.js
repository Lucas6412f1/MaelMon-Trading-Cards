// script.js

let currentUserData = null;
const DAILY_PACK_COOLDOWN_MS = 24 * 60 * 60 * 1000; // Must match backend

// Functie om gebruikersdata op te halen
async function fetchUserData() {
    try {
        const response = await fetch('https://maelmon-backend.onrender.com/api/user', {
            credentials: 'include'
        });
        if (!response.ok) {
            // If not logged in or another error (e.g., 401), return false
            // This means the session might be expired or not present
            return { isLoggedIn: false, error: `HTTP error! status: ${response.status}` };
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching user data:", error);
        // Network error or other issue, assume not logged in for safety
        return { isLoggedIn: false, error: "Could not retrieve user data. Please try logging in again." };
    }
}

// Functie om gemeenschappelijke instellingen te initialiseren (Donkere modus, lettergrootte, accentkleur)
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
    if (toggleDarkModeButton) {
        toggleDarkModeButton.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('darkMode', 'enabled');
            } else {
                localStorage.removeItem('darkMode');
            }
        });
    }

    // Accent color
    const savedAccentColor = localStorage.getItem('accentColor');
    if (savedAccentColor) {
        document.body.style.setProperty('--accent-color', savedAccentColor);
        if (colorPicker) {
            colorPicker.value = savedAccentColor;
        }
    }
    if (colorPicker) {
        colorPicker.addEventListener('input', (e) => {
            document.body.style.setProperty('--accent-color', e.target.value);
            localStorage.setItem('accentColor', e.target.value);
        });
    }

    // Font size
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

// Functie om de navbar en algemene gebruikersinfo bij te werken
function updateNavbarAndUserInfo() {
    const welcomeMessage = document.getElementById('welcomeMessage');
    const currencyDisplay = document.getElementById('currencyDisplay');
    const adminLink = document.getElementById('adminLink');
    const logoutButtonNav = document.getElementById('logoutButtonNav');

    if (currentUserData && currentUserData.isLoggedIn) {
        if (welcomeMessage) welcomeMessage.textContent = `Welcome, ${currentUserData.username}!`;
        if (currencyDisplay) currencyDisplay.textContent = `Currency: ${currentUserData.currency} ⭐`;

        // Manage 'hidden' class for adminLink
        if (adminLink) {
            if (currentUserData.isAdmin) {
                adminLink.classList.remove('hidden'); // Show Admin link
            } else {
                adminLink.classList.add('hidden'); // Hide Admin link
            }
        }

        if (logoutButtonNav) {
            logoutButtonNav.addEventListener('click', () => {
                window.location.href = 'https://maelmon-backend.onrender.com/auth/logout';
            });
        }
    } else {
        // Hide navbar elements if not logged in
        if (welcomeMessage) welcomeMessage.textContent = '';
        if (currencyDisplay) currencyDisplay.textContent = '';
        if (adminLink) adminLink.classList.add('hidden'); // Ensure hidden if not logged in
        if (logoutButtonNav) logoutButtonNav.style.display = 'none'; // Keep as inline for specific logout button
    }
}


// Functions for the MODAL
const modal = document.getElementById('modal');
const closeButton = document.querySelector('.close-button');
const modalBody = document.getElementById('modal-body');

if (closeButton) {
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

function showModal(contentHtml) {
    modalBody.innerHTML = contentHtml;
    modal.style.display = 'block';
}


// Functie om Dagelijks Pakket te claimen
async function claimDailyPack() {
    if (!currentUserData || !currentUserData.isLoggedIn) {
        showModal('<p class="error">You need to be logged in to claim a daily pack.</p>');
        return;
    }

    try {
        const response = await fetch('https://maelmon-backend.onrender.com/api/user/claim-daily-pack', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: true
        });

        const result = await response.json();

        if (response.ok) {
            // Update lastPackClaimed locally and then fetch user data again to get the latest currency and other updates
            // A full fetch ensures consistency, though a local update + `updateNavbarAndUserInfo` is faster for immediate feedback
            currentUserData = await fetchUserData(); // Fetch updated user data
            showModal(`
                <p style="color: lightgreen; font-weight: bold;">${result.message}</p>
                ${result.card ? `
                    <h3>You won: ${result.card.name}!</h3>
                    <img src="${result.card.characterImageUrl}" alt="${result.card.name}" class="profile-image">
                    <p>Type: ${result.card.type}</p>
                    <p>Attack: ${result.card.attack}, Defense: ${result.card.defense}</p>
                    <p>Rarity: ${result.card.rarity}</p>
                ` : ''}
            `);
            updateNavbarAndUserInfo(); // Update navbar with potentially new currency/cooldown
        } else {
            showModal(`<p class="error">${result.message}</p>`);
        }
    } catch (error) {
        console.error('Error claiming daily pack:', error);
        showModal('<p class="error">Something went wrong while claiming your daily pack. Please try again later.</p>');
    }
}


// --- Initialisatie op basis van de huidige pagina ---
document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;

    // Always fetch user data when any page loads
    // This call determines login status based on the session cookie
    currentUserData = await fetchUserData();

    // Handle page redirection based on login status and admin role
    if (path === '/' || path === '/index.html') {
        // If on the main app page but not logged in, redirect to login.html
        if (!currentUserData.isLoggedIn) {
            window.location.href = '/login.html';
            return; // Stop further execution
        }
        // If logged in, proceed with index.html specific logic
        const appContainer = document.getElementById('app');
        if (appContainer) {
            appContainer.innerHTML = `
                <h2>Welcome to MaelMon Trading Cards, ${currentUserData.username}!</h2>
                <p>Collect unique cards and build your deck!</p>
                <div class="main-features">
                    <button id="claimDailyPackButton">Claim Daily Pack</button>
                    <p id="dailyPackCooldownMessage"></p>
                </div>
            `;
            const claimDailyPackButton = document.getElementById('claimDailyPackButton');
            if (claimDailyPackButton) {
                claimDailyPackButton.addEventListener('click', claimDailyPack);
            }
            updateDailyPackCooldownMessage(); // Update cooldown immediately
            // Update cooldown every minute
            setInterval(updateDailyPackCooldownMessage, 60 * 1000);
        }

        // Event listener for the dailyPackLink in the navbar
        const dailyPackLink = document.getElementById('dailyPackLink');
        if (dailyPackLink) {
            dailyPackLink.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default link behavior
                claimDailyPack();
            });
        }
        // Event listener for the shopLink
        const shopLink = document.getElementById('shopLink');
        if (shopLink) {
            shopLink.addEventListener('click', (e) => {
                e.preventDefault();
                showModal('<p>Shop functionality is still under development!</p>');
            });
        }


    } else if (path === '/login.html') {
        // If on the login page but already logged in, redirect to index.html
        if (currentUserData.isLoggedIn) {
            window.location.href = '/';
            return; // Stop further execution
        }
        // Otherwise, initialize the login button
        const loginButton = document.getElementById('loginButton');
        if (loginButton) {
            loginButton.addEventListener('click', () => {
                window.location.href = 'https://maelmon-backend.onrender.com/auth/twitch';
            });
        }

    } else if (path === '/dashboard.html') {
        // If on dashboard.html but not logged in, redirect to login.html
        if (!currentUserData.isLoggedIn) {
            window.location.href = '/login.html';
            return;
        }
        // Logic for the dashboard page (remains largely the same)
        const dashboardContent = document.getElementById('dashboard-content');
        const adminLinkContainer = document.getElementById('adminLinkContainer');
        const usernameInput = document.getElementById('usernameInput');
        const updateUsernameButton = document.getElementById('updateUsernameButton');
        const usernameMessage = document.getElementById('usernameMessage');
        const logoutButton = document.getElementById('logoutButton'); // The logout button on dashboard.html itself

        let profileImageHtml = '';
        if (currentUserData.profileImageUrl) {
            profileImageHtml = `<img src="${currentUserData.profileImageUrl}" alt="${currentUserData.username}'s profile picture" class="profile-image">`;
        }

        dashboardContent.innerHTML = `
            <h2>Welcome, ${currentUserData.username}!</h2>
            ${profileImageHtml}
            <p>Your Twitch ID: ${currentUserData.twitchId}</p>
        `;

        if (currentUserData.isAdmin) {
            dashboardContent.innerHTML += `<p style="color: green; font-weight: bold;">You are an administrator!</p>`;
            adminLinkContainer.innerHTML = `<p><a href="/admin.html">Go to Admin Panel</a></p>`;
        }

        if (usernameInput) usernameInput.value = currentUserData.username;
        if (updateUsernameButton) {
            updateUsernameButton.addEventListener('click', () => {
                usernameMessage.textContent = 'Username update functionality not yet implemented.';
                usernameMessage.style.color = 'yellow';
            });
        }
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                window.location.href = 'https://maelmon-backend.onrender.com/auth/logout';
            });
        }
        initializeSettings(); // Call the settings function
    } else if (path === '/admin.html') {
        // If on admin.html but not logged in or not an admin, redirect
        if (!currentUserData.isLoggedIn) {
            window.location.href = '/login.html'; // Not logged in, redirect to login
            return;
        }
        if (!currentUserData.isAdmin) {
            window.location.href = '/'; // Logged in but not admin, redirect to home
            return;
        }
        // Logic for the admin page (remains largely the same)
        const adminContent = document.getElementById('admin-content');
        const addCardForm = document.getElementById('addCardForm');
        const addCardMessage = document.getElementById('addCardMessage');

        adminContent.innerHTML = `<p>Welcome, administrator ${currentUserData.username}!</p><p>Here you can add cards, manage users, etc.</p>`;

        if (addCardForm) {
            addCardForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                addCardMessage.textContent = 'Adding card...';
                addCardMessage.style.color = 'yellow';

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
                        addCardMessage.textContent = `Success: ${result.message}`;
                        addCardMessage.style.color = 'lightgreen';
                        addCardForm.reset();
                    } else {
                        addCardMessage.textContent = `Error: ${result.message}`;
                        addCardMessage.style.color = 'red';
                    }
                } catch (error) {
                    console.error('Error sending card data:', error);
                    addCardMessage.textContent = `Error: Something went wrong while adding the card.`;
                    addCardMessage.style.color = 'red';
                }
            });
        }
    }

    // Always initialize navbar and settings if they are present on the page
    updateNavbarAndUserInfo();
    initializeSettings();
});


function updateDailyPackCooldownMessage() {
    const dailyPackCooldownMessageElement = document.getElementById('dailyPackCooldownMessage');
    if (!dailyPackCooldownMessageElement || !currentUserData || !currentUserData.isLoggedIn) {
        return;
    }

    if (!currentUserData.lastPackClaimed) {
        dailyPackCooldownMessageElement.textContent = "You can claim your daily pack now!";
        dailyPackCooldownMessageElement.style.color = "lightgreen";
        return;
    }

    const lastClaimTime = new Date(currentUserData.lastPackClaimed).getTime();
    const now = new Date().getTime();
    const timeLeft = DAILY_PACK_COOLDOWN_MS - (now - lastClaimTime);

    if (timeLeft <= 0) {
        dailyPackCooldownMessageElement.textContent = "You can claim your daily pack now!";
        dailyPackCooldownMessageElement.style.color = "lightgreen";
    } else {
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        dailyPackCooldownMessageElement.textContent = `Next pack available in ${hours} hours and ${minutes} minutes.`;
        dailyPackCooldownMessageElement.style.color = "yellow";
    }
}