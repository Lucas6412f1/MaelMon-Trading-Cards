// script.js

// --- Backend URL Configuratie ---
// Dit is de URL van je gedeployde backend op Render.
const BACKEND_URL = 'https://maelmon-backend.onrender.com';

// Functie om kaarten op te halen van de backend
async function getCardsFromBackend() {
    console.log(`Attempting to fetch cards from backend: ${BACKEND_URL}/api/cards`);
    try {
        const response = await fetch(`${BACKEND_URL}/api/cards`);
        if (!response.ok) {
            // Als de response niet OK is (bijv. 404, 500), gooi dan een error
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const cards = await response.json(); // Parse de JSON response
        console.log('Kaarten succesvol opgehaald van backend:', cards);

        // Hier kun je de opgehaalde 'cards' array gebruiken om je frontend te vullen.
        // Bijvoorbeeld:
        // const cardsContainer = document.getElementById('cards-container');
        // cards.forEach(card => {
        //     const cardElement = document.createElement('div');
        //     cardElement.textContent = `ID: ${card.id}, Naam: ${card.name}, Type: ${card.type}`;
        //     cardsContainer.appendChild(cardElement);
        // });

        return cards; // Retourneer de opgehaalde kaarten
    } catch (error) {
        console.error('Fout bij ophalen kaarten van backend:', error);
        // Geef een lege array terug of rethrow de error, afhankelijk van hoe je errors wilt afhandelen
        return [];
    }
}

// Zorg ervoor dat de DOM volledig geladen is voordat we proberen elementen te benaderen
document.addEventListener('DOMContentLoaded', () => {
    console.log('Frontend geladen en DOM is klaar.');
    // Roep de functie aan om kaarten op te halen zodra de pagina geladen is
    getCardsFromBackend();

    // Hieronder kun je de rest van je bestaande frontend JavaScript code plaatsen
    // Bijvoorbeeld event listeners voor knoppen, DOM-manipulatie, etc.
    console.log('Hieronder kan de rest van je frontend JS code staan.');
});