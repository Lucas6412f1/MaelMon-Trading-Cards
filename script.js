document.addEventListener('DOMContentLoaded', () => {
    console.log('MaelMon Trading Cards frontend loaded!');

    const startButton = document.getElementById('startButton');
    const welcomeMessageSection = document.getElementById('welcome-message');
    const cardsDisplaySection = document.getElementById('cards-display');
    const battleArenaSection = document.getElementById('battle-arena'); // Not used yet, but good to have

    // Function to show the "Your Cards" section
    function showCardsSection() {
        welcomeMessageSection.style.display = 'none'; // Hide the welcome message
        cardsDisplaySection.style.display = 'grid'; // Show the cards section
        // battleArenaSection.style.display = 'none'; // Hide the battle arena (uncomment if needed)
        console.log('Cards section displayed.');
        // In the future, you would load your cards from a JSON or backend here
        // For now, let's add a test card
        addTestCard();
    }

    // Example: Add a test card to demonstrate how the card-grid works
    function addTestCard() {
        const cardGrid = document.querySelector('#cards-display.card-grid');
        const testCard = document.createElement('div');
        testCard.classList.add('card');
        testCard.innerHTML = `
            <img src="https://via.placeholder.com/150/FF8C00/FFFFFF?text=MaelMon" alt="Test MaelMon">
            <h3>Test MaelMon</h3>
            <p>An example MaelMon to show what cards look like.</p>
            <div class="stats">
                <span style="color: red;">Attack: 5</span>
                <span style="color: blue;">Defense: 4</span>
            </div>
        `;
        cardGrid.appendChild(testCard);
    }

    // Event listener for the Start Game button
    if (startButton) {
        startButton.addEventListener('click', showCardsSection);
    }
});