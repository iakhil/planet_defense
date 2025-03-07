// Main entry point for the game

let game;

function init() {
    // Initialize the game
    game = new Game();
    
    // Start animation loop
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    
    // Update game state
    game.update();
    
    // Render the scene
    game.render();
}

// Start the game when the page loads
window.addEventListener('load', init); 