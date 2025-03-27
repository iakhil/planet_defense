// Main entry point for the game

let game;
let selectedShipType = 'fighter'; // Default ship type

function setupShipSelection() {
    console.log("Setting up ship selection");
    
    // Add click handlers to ship options
    const shipOptions = document.querySelectorAll('.ship-option');
    
    if (shipOptions.length === 0) {
        console.error("No ship options found");
    }
    
    shipOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected class from all options
            shipOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            option.classList.add('selected');
            
            // Update selected ship type
            selectedShipType = option.getAttribute('data-ship-type');
            
            console.log(`Selected ship: ${selectedShipType}`);
        });
    });
    
    // Select the fighter by default
    const defaultShip = document.querySelector('.ship-option[data-ship-type="fighter"]');
    if (defaultShip) {
        defaultShip.classList.add('selected');
    } else {
        console.error("Default ship option not found");
    }
    
    // Add click handler to start button
    const startButton = document.getElementById('start-game-final');
    if (startButton) {
        startButton.addEventListener('click', () => {
            console.log("Start button clicked");
            // Hide ship selection screen
            const shipSelection = document.getElementById('ship-selection');
            if (shipSelection) {
                shipSelection.style.display = 'none';
                
                // Initialize the game with selected ship
                initGame();
            } else {
                console.error("Ship selection container not found");
            }
        });
    } else {
        console.error("Start button not found");
    }
}

function initGame() {
    console.log(`Initializing game with ship type: ${selectedShipType}`);
    
    try {
        // Initialize the game with the selected ship type
        game = new Game(selectedShipType);
        
        // Start animation loop
        animate();
    } catch (error) {
        console.error("Error initializing game:", error);
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    try {
        if (game) {
            // Update game state
            game.update();
            
            // Render the scene
            game.render();
        }
    } catch (error) {
        console.error("Error in animation loop:", error);
    }
}

// Initialize when the window loads
window.addEventListener('load', () => {
    console.log("Window loaded, showing game objective");
    // Show game objective first
    Game.initialize();
    // Setup ship selection (will be shown after objective screen)
    setupShipSelection();
}); 