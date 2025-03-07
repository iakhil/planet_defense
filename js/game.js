// Main game class to handle game state

class Game {
    constructor() {
        this.setupScene();
        this.setupLighting();
        this.setupCamera();
        
        this.solarSystem = new SolarSystem(this.scene);
        this.spaceship = new Spaceship(this.scene, this.camera);
        this.enemyManager = new EnemyManager(this.scene, this.solarSystem, this.spaceship, this.camera);
        
        this.isGameOver = false;
        
        // Position player near Earth
        const earthPosition = this.solarSystem.getCurrentPlanet().position.clone();
        earthPosition.z += 60; // Position player in front of Earth
        this.spaceship.mesh.position.copy(earthPosition);
        
        // Update camera
        this.camera.position.copy(earthPosition);
        this.camera.position.y += 20;
        this.camera.position.z += 50;
        
        // Simplified game state - no mission phases
        document.getElementById('level-value').textContent = 'Earth';
        
        // Update health and score displays
        document.getElementById('health-value').textContent = this.spaceship.health;
        document.getElementById('score-value').textContent = '0';
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        
        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000);
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(0, 1, 0);
        this.scene.add(dirLight);
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75, window.innerWidth / window.innerHeight, 0.1, 3000
        );
        this.camera.position.set(0, 50, 100);
        this.camera.lookAt(0, 0, 0);
    }
    
    updateUI() {
        // Update planet name
        const planetName = this.solarSystem.planetData[this.solarSystem.currentPlanetIndex].name;
        document.getElementById('level-value').textContent = planetName;
        document.getElementById('current-location').textContent = `Current: ${planetName}`;
        
        // Update mission phase if needed
        if (this.missionPhase === 'outbound') {
            document.getElementById('mission-phase').textContent = 'Phase: Outbound Journey';
        } else if (this.missionPhase === 'return') {
            document.getElementById('mission-phase').textContent = 'Phase: Return Journey';
        }
    }
    
    gameOver() {
        this.isGameOver = true;
        document.getElementById('final-score').textContent = this.enemyManager.score;
        document.getElementById('game-over').classList.remove('hidden');
        
        // Setup restart button
        document.getElementById('restart-button').addEventListener('click', () => {
            location.reload(); // Simple reload to restart game
        });
    }
    
    completeLevel() {
        this.isLevelComplete = true;
        this.levelCompleteTimer = this.levelCompleteDuration;
        
        // Display level complete message
        const levelCompleteDiv = document.createElement('div');
        levelCompleteDiv.id = 'level-complete';
        levelCompleteDiv.style.position = 'absolute';
        levelCompleteDiv.style.top = '50%';
        levelCompleteDiv.style.left = '50%';
        levelCompleteDiv.style.transform = 'translate(-50%, -50%)';
        levelCompleteDiv.style.color = 'white';
        levelCompleteDiv.style.fontSize = '36px';
        levelCompleteDiv.style.textAlign = 'center';
        levelCompleteDiv.innerHTML = `
            <p>${this.solarSystem.getCurrentPlanet().userData.name} Defended!</p>
            <p>Proceeding to next planet...</p>
        `;
        
        document.getElementById('game-container').appendChild(levelCompleteDiv);
        
        // Schedule removal of message
        setTimeout(() => {
            document.getElementById('level-complete').remove();
        }, 3000);
    }
    
    startNextLevel() {
        // Get current planet name
        const currentPlanetName = this.solarSystem.getCurrentPlanet().userData.name;
        
        // Handle mission phases
        if (this.missionPhase === 'outbound') {
            // Outbound journey: Earth → Mars → Jupiter → Saturn → Uranus → Neptune
            if (currentPlanetName === 'Neptune') {
                // Reached Neptune - collect element
                this.collectElement();
                return true;
            } else {
                // Move to next planet outbound
                this.solarSystem.nextPlanet();
            }
        } 
        else if (this.missionPhase === 'return') {
            // Return journey: Neptune → Uranus → Saturn → Jupiter → Mars → Earth
            if (currentPlanetName === 'Earth') {
                // Reached Earth with element - mission complete!
                this.completeMission();
                return true;
            } else {
                // Move to next planet on return journey
                this.solarSystem.previousPlanet();
            }
        }
        
        // Reset level state
        this.isLevelComplete = false;
        this.levelCompleteTimer = 0;
        
        // Update UI with new planet name
        this.updateUI();
        
        // Move player to the new planet position
        const planetPos = this.solarSystem.getCurrentPlanet().position.clone();
        planetPos.z += 50; // Position player in front of the planet
        this.spaceship.mesh.position.copy(planetPos);
        
        // Reset camera
        this.camera.position.copy(planetPos);
        this.camera.position.y += 10;
        this.camera.position.z += 20;
        
        // Reset enemy defeated counter
        this.enemyManager.enemiesDefeated = 0;
        
        return true;
    }
    
    collectElement() {
        this.missionPhase = 'return';
        this.elementCollected = true;
        
        // Display element collection message
        const elementCollectedDiv = document.createElement('div');
        elementCollectedDiv.id = 'element-collected';
        elementCollectedDiv.style.position = 'absolute';
        elementCollectedDiv.style.top = '50%';
        elementCollectedDiv.style.left = '50%';
        elementCollectedDiv.style.transform = 'translate(-50%, -50%)';
        elementCollectedDiv.style.color = 'white';
        elementCollectedDiv.style.fontSize = '36px';
        elementCollectedDiv.style.backgroundColor = 'rgba(0, 0, 200, 0.8)';
        elementCollectedDiv.style.padding = '20px';
        elementCollectedDiv.style.borderRadius = '10px';
        elementCollectedDiv.style.textAlign = 'center';
        elementCollectedDiv.style.zIndex = '150';
        elementCollectedDiv.innerHTML = `
            <h2>Rare Element Collected!</h2>
            <p>You've obtained the element needed to save Earth.</p>
            <p>Now return to Earth before it's too late!</p>
        `;
        
        document.getElementById('game-container').appendChild(elementCollectedDiv);
        
        // Update mission UI
        document.getElementById('mission-objective').textContent = 'Mission: Return to Earth';
        document.getElementById('mission-phase').textContent = 'Phase: Return Journey';
        document.getElementById('element-status').textContent = 'Element: Collected ✓';
        
        // Create a visual effect for the element
        const glowingElement = new THREE.Mesh(
            new THREE.SphereGeometry(2, 32, 32),
            new THREE.MeshPhongMaterial({
                color: 0x00ffff,
                emissive: 0x0088ff,
                emissiveIntensity: 1,
                transparent: true,
                opacity: 0.8
            })
        );
        
        // Attach the element to the ship
        glowingElement.position.set(0, 2, 0);
        this.spaceship.mesh.add(glowingElement);
        
        // Remove message after 5 seconds
        setTimeout(() => {
            document.getElementById('element-collected').remove();
            // Start return journey
            this.isLevelComplete = false;
            this.startNextLevel();
        }, 5000);
    }
    
    completeMission() {
        // Game completed - mission successful
        const missionCompleteDiv = document.createElement('div');
        missionCompleteDiv.id = 'mission-complete';
        missionCompleteDiv.style.position = 'absolute';
        missionCompleteDiv.style.top = '50%';
        missionCompleteDiv.style.left = '50%';
        missionCompleteDiv.style.transform = 'translate(-50%, -50%)';
        missionCompleteDiv.style.color = 'white';
        missionCompleteDiv.style.fontSize = '36px';
        missionCompleteDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        missionCompleteDiv.style.padding = '20px';
        missionCompleteDiv.style.borderRadius = '10px';
        missionCompleteDiv.style.textAlign = 'center';
        missionCompleteDiv.style.zIndex = '200';
        missionCompleteDiv.innerHTML = `
            <h2>Mission Complete!</h2>
            <p>Congratulations! You've returned to Earth with the rare element!</p>
            <p>Earth is saved thanks to your bravery.</p>
            <p>Final Score: ${this.enemyManager.score}</p>
            <button id="play-again" style="
                background-color: #4CAF50;
                border: none;
                color: white;
                padding: 10px 20px;
                text-align: center;
                text-decoration: none;
                display: inline-block;
                font-size: 16px;
                margin: 10px 0;
                cursor: pointer;
                border-radius: 5px;">
                Play Again
            </button>
        `;
        
        document.getElementById('game-container').appendChild(missionCompleteDiv);
        
        // Setup restart button
        document.getElementById('play-again').addEventListener('click', () => {
            location.reload();
        });
        
        return false;
    }
    
    update() {
        if (this.isGameOver) return;
        
        // Update game entities
        this.solarSystem.update();
        this.spaceship.update();
        const gameOverCondition = this.enemyManager.update();
        
        if (gameOverCondition) {
            this.gameOver();
            return;
        }
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    setupMissionUI() {
        // Create mission status UI
        const missionUI = document.createElement('div');
        missionUI.id = 'mission-status';
        missionUI.style.position = 'absolute';
        missionUI.style.top = '20px';
        missionUI.style.right = '20px';
        missionUI.style.color = 'white';
        missionUI.style.fontSize = '18px';
        missionUI.style.textAlign = 'right';
        missionUI.style.textShadow = '1px 1px 2px black';
        missionUI.style.zIndex = '100';
        
        // Initialize with mission info
        missionUI.innerHTML = `
            <div id="mission-objective">Mission: Travel to Neptune</div>
            <div id="mission-phase">Phase: Outbound Journey</div>
            <div id="current-location">Current: Earth</div>
            <div id="element-status">Element: Not Collected</div>
        `;
        
        document.getElementById('game-container').appendChild(missionUI);
    }
}