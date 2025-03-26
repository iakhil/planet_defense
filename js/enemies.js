// Enemy types: asteroids and alien ships

class EnemyManager {
    constructor(scene, solarSystem, spaceship, camera) {
        this.scene = scene;
        this.solarSystem = solarSystem;
        this.spaceship = spaceship;
        this.camera = camera;
        this.enemies = [];
        this.spawnRate = 300; // Initial spawn rate (about 5 seconds at 60fps)
        this.spawnCounter = 0;  
        this.asteroidGeometries = [];
        this.score = 0;
        this.enemiesDefeated = 0;
        
        // Difficulty progression variables
        this.baseSpawnRate = 300;
        this.minSpawnRate = 60; // Fastest spawn rate (1 second at 60fps)
        this.difficultyLevel = 1;
        this.lastDifficultyIncrease = 0;
        this.alienChance = 0.05; // Initial 5% chance for aliens
        this.maxAlienChance = 0.4; // Maximum 40% chance for aliens
        this.multiSpawnChance = 0; // Initial 0% chance to spawn multiple enemies at once
        this.maxMultiSpawnChance = 0.7; // Maximum 70% chance to spawn multiple enemies
        this.maxEnemiesPerSpawn = 1; // Start with 1 enemy per spawn
        
        // Preload sounds to avoid lag
        this.preloadSounds();
        
        // Create asteroid geometries
        this.createAsteroidGeometries();
        
        // Force spawn just a few initial asteroids after a delay
        setTimeout(() => {
            for (let i = 0; i < 3; i++) {
                this.spawnAsteroid();
            }
        }, 3000); // 3 seconds after game starts
    }
    
    preloadSounds() {
        // Preload explosion sound
        this.explosionSound = new Audio('https://freesound.org/data/previews/369/369921_4582659-lq.mp3');
        this.explosionSound.volume = 0.3;
        this.explosionSound.load();
        
        // Preload laser hit sound
        this.laserHitSound = new Audio('sounds/laser.mp3');
        this.laserHitSound.volume = 0.4;
        this.laserHitSound.load();
        
        // Fallback laser hit sound
        this.fallbackLaserSound = new Audio('https://s3-us-west-2.amazonaws.com/s.cdpn.io/28963/laser-sound.mp3');
        this.fallbackLaserSound.volume = 0.4;
        this.fallbackLaserSound.load();
        
        // Preload health pickup sound
        this.healthPickupSound = new Audio('https://freesound.org/data/previews/270/270304_5123851-lq.mp3');
        this.healthPickupSound.volume = 0.3;
        this.healthPickupSound.load();
    }
    
    createAsteroidGeometries() {
        // Create different asteroid shapes for variety
        for (let i = 0; i < 5; i++) {
            const radius = random(2, 5);
            const detail = 1;
            const geometry = new THREE.DodecahedronGeometry(radius, detail);
            
            // Distort vertices for a more natural look
            const positions = geometry.attributes.position.array;
            for (let j = 0; j < positions.length; j += 3) {
                positions[j] += random(-0.4, 0.4);
                positions[j + 1] += random(-0.4, 0.4);
                positions[j + 2] += random(-0.4, 0.4);
            }
            
            this.asteroidGeometries.push(geometry);
        }
    }
    
    spawnAsteroid() {
        const currentPlanet = this.solarSystem.getCurrentPlanet();
        const planetPos = currentPlanet.position.clone();
        
        // Random position for asteroid to spawn, but not too close to the planet
        const spawnRadius = currentPlanet.geometry.parameters.radius * 5;
        const angle = random(0, Math.PI * 2);
        const height = random(-10, 10);
        
        const xPos = planetPos.x + spawnRadius * Math.cos(angle);
        const zPos = planetPos.z + spawnRadius * Math.sin(angle);
        
        // Get random asteroid geometry
        const geometry = this.asteroidGeometries[Math.floor(random(0, this.asteroidGeometries.length))];
        
        // Choose a random color from brown/gray tones
        const color = new THREE.Color(
            random(0.3, 0.6),
            random(0.2, 0.5),
            random(0.1, 0.4)
        );
        
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 1.0,
            metalness: 0.2
        });
        
        const asteroid = new THREE.Mesh(geometry, material);
        asteroid.position.set(xPos, height, zPos);
        
        // Direction towards the planet - speed increases with difficulty
        const baseSpeed = 0.1;
        const difficultyBonus = 0.02 * (this.difficultyLevel - 1);
        const speed = baseSpeed + difficultyBonus;
        
        const direction = new THREE.Vector3()
            .subVectors(planetPos, asteroid.position)
            .normalize()
            .multiplyScalar(speed);
        
        // Rotation speed increases with difficulty
        const rotationMultiplier = 1 + (this.difficultyLevel * 0.1);
        const rotationSpeed = {
            x: random(-0.02, 0.02) * rotationMultiplier,
            y: random(-0.02, 0.02) * rotationMultiplier,
            z: random(-0.02, 0.02) * rotationMultiplier
        };
        
        // Chance for tougher asteroids at higher difficulties
        let health = 1;
        let damage = 10;
        let size = 1.0;
        
        // At higher difficulties, some asteroids are tougher
        if (this.difficultyLevel > 2 && Math.random() < 0.2 + (this.difficultyLevel * 0.05)) {
            health = 2;
            damage = 15;
            size = 1.3;
            
            // Scale up the asteroid for visual indication
            asteroid.scale.set(size, size, size);
            
            // Make tougher asteroids redder
            material.color.r += 0.2;
            material.color.g -= 0.1;
            material.color.b -= 0.1;
        }
        
        // At even higher difficulties, some asteroids are very tough
        if (this.difficultyLevel > 4 && Math.random() < 0.1 + (this.difficultyLevel * 0.02)) {
            health = 3;
            damage = 20;
            size = 1.6;
            
            // Scale up the asteroid for visual indication
            asteroid.scale.set(size, size, size);
            
            // Make very tough asteroids even redder
            material.color.r += 0.3;
            material.color.g -= 0.2;
            material.color.b -= 0.2;
            
            // Add a glowing effect to indicate danger
            const glow = new THREE.PointLight(0xff0000, 1, 20);
            asteroid.add(glow);
        }
        
        asteroid.userData = {
            type: 'asteroid',
            velocity: direction,
            rotationSpeed: rotationSpeed,
            health: health,
            damage: damage,
            difficultyLevel: this.difficultyLevel // Store the difficulty level for reference
        };
        
        // Add a stronger light to make asteroid more visible
        const asteroidLight = new THREE.PointLight(0xff6600, 1.5, 30); // Brighter light
        asteroidLight.position.set(0, 0, 0);
        asteroid.add(asteroidLight);
        
        console.log(`Asteroid spawned at position: x=${xPos.toFixed(1)}, y=${height.toFixed(1)}, z=${zPos.toFixed(1)}`);
        
        this.enemies.push(asteroid);
        this.scene.add(asteroid);
    }
    
    spawnAlienShip() {
        const currentPlanet = this.solarSystem.getCurrentPlanet();
        const planetPos = currentPlanet.position.clone();
        
        // Random position for alien to spawn
        const spawnRadius = currentPlanet.geometry.parameters.radius * 8;
        const angle = random(0, Math.PI * 2);
        const height = random(-20, 20);
        
        const xPos = planetPos.x + spawnRadius * Math.cos(angle);
        const zPos = planetPos.z + spawnRadius * Math.sin(angle);
        
        // Create alien ship using basic geometries instead of CapsuleGeometry
        const alienShip = new THREE.Group();
        
        // Ship body (use sphere instead of capsule)
        const bodyGeometry = new THREE.SphereGeometry(3, 16, 16);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x8800ff,
            shininess: 30,
            specular: 0x333333
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.scale.set(1.5, 0.5, 1);
        alienShip.add(body);
        
        // Add details to make it look like a ship
        const detailGeometry = new THREE.ConeGeometry(2, 4, 8);
        const detailMaterial = new THREE.MeshPhongMaterial({
            color: 0xaa00ff,
        });
        
        // Add top cone
        const topDetail = new THREE.Mesh(detailGeometry, detailMaterial);
        topDetail.rotation.x = Math.PI;
        topDetail.position.y = 0.5;
        alienShip.add(topDetail);
        
        // Add bottom cone
        const bottomDetail = new THREE.Mesh(detailGeometry, detailMaterial);
        bottomDetail.position.y = -0.5;
        alienShip.add(bottomDetail);
        
        // Position the ship
        alienShip.position.set(xPos, height, zPos);
        
        // Direction towards the planet - speed increases with difficulty
        const baseSpeed = 0.2;
        const difficultyBonus = 0.03 * (this.difficultyLevel - 1);
        const speed = baseSpeed + difficultyBonus;
        
        const direction = new THREE.Vector3()
            .subVectors(planetPos, alienShip.position)
            .normalize()
            .multiplyScalar(speed);
        
        // Health increases with difficulty
        const baseHealth = 3;
        const healthBonus = Math.floor((this.difficultyLevel - 1) / 2);
        const health = baseHealth + healthBonus;
        
        // Fire rate increases with difficulty (lower number = faster firing)
        const baseFireRate = 120;
        const fireRateReduction = Math.min(60, 10 * (this.difficultyLevel - 1));
        const fireRate = Math.max(30, baseFireRate - fireRateReduction);
        
        // Setup alien ship properties
        alienShip.userData = {
            type: 'alien',
            velocity: direction,
            health: health,
            fireCooldown: fireRate / 2, // Start halfway to firing
            fireRate: fireRate,
            damage: 10 + (this.difficultyLevel - 1) * 2, // Damage increases with difficulty
            difficultyLevel: this.difficultyLevel, // Store the difficulty level for reference
            target: currentPlanet // Set the current planet as the default target
        };
        
        // Add a light to make the alien ship more visible
        const alienLight = new THREE.PointLight(0xaa00ff, 1, 30);
        alienLight.position.set(0, 0, 0);
        alienShip.add(alienLight);
        
        // Add visual indicator of difficulty level
        if (this.difficultyLevel > 1) {
            // Add a ring around the ship for each difficulty level above 1
            for (let i = 0; i < Math.min(4, this.difficultyLevel - 1); i++) {
                const ringGeometry = new THREE.TorusGeometry(3 + (i * 0.5), 0.2, 8, 16);
                const ringMaterial = new THREE.MeshPhongMaterial({
                    color: 0xff00ff,
                    emissive: 0x550055,
                    transparent: true,
                    opacity: 0.7
                });
                const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                ring.rotation.x = Math.PI / 2;
                alienShip.add(ring);
            }
        }
        
        this.scene.add(alienShip);
        this.enemies.push(alienShip);
    }
    
    spawnEnemy() {
        console.log("Spawning enemy...");
        
        // Calculate current difficulty
        this.calculateDifficulty();
        
        // Determine how many enemies to spawn
        let enemiesToSpawn = 1;
        
        // Chance to spawn multiple enemies at once based on difficulty
        if (Math.random() < this.multiSpawnChance) {
            enemiesToSpawn = Math.floor(Math.random() * this.maxEnemiesPerSpawn) + 1;
            console.log(`Spawning ${enemiesToSpawn} enemies at once!`);
        }
        
        // Spawn the determined number of enemies
        for (let i = 0; i < enemiesToSpawn; i++) {
            // Determine enemy type based on current alien chance
            if (Math.random() < this.alienChance) {
                console.log("Spawning alien ship");
                this.spawnAlienShip();
            } else {
                console.log("Spawning asteroid");
                this.spawnAsteroid();
            }
        }
    }
    
    fireAlienLaser(alienShip) {
        // Create alien laser
        const laserGeometry = new THREE.CylinderGeometry(0.2, 0.2, 15, 8);
        const laserMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 1
        });
        
        const laser = new THREE.Mesh(laserGeometry, laserMaterial);
        laser.rotation.x = Math.PI / 2;
        
        // Position laser at alien ship
        laser.position.copy(alienShip.position);
        
        // Get the current planet as a fallback target
        const currentPlanet = this.solarSystem.getCurrentPlanet();
        
        // Point at target (player or planet with some randomness)
        let targetPosition;
        if (Math.random() < 0.3) {
            // Target the player 30% of the time
            targetPosition = this.spaceship.mesh.position;
        } else {
            // Target the planet 70% of the time
            // Use the alien's target if defined, otherwise use the current planet
            targetPosition = (alienShip.userData.target && alienShip.userData.target.position) 
                ? alienShip.userData.target.position 
                : currentPlanet.position;
        }
        
        // Calculate direction to target
        const direction = new THREE.Vector3()
            .subVectors(targetPosition, alienShip.position)
            .normalize()
            .multiplyScalar(2);
            
        // Add slight randomness to aim
        direction.x += random(-0.2, 0.2);
        direction.y += random(-0.2, 0.2);
        direction.z += random(-0.2, 0.2);
        
        laser.userData = {
            type: 'alienLaser',
            velocity: direction,
            lifeTime: 100,
            damage: 5
        };
        
        this.enemies.push(laser);
        this.scene.add(laser);
    }
    
    createExplosion(position, color = 0xff6600, size = 5, enemy) {
        // Make sure we handle case when enemy isn't passed
        const scoreValue = enemy && enemy.userData ? 
            (enemy.userData.type === 'asteroid' ? 100 : 300) : 100;
        
        // Create a more complex explosion with multiple elements
        
        // 1. Create core particle burst - REDUCED PARTICLE COUNT
        const particleCount = 30; // Reduced from 50 for better performance
        const particleGeometry = new THREE.BufferGeometry();
        const particleMaterial = new THREE.PointsMaterial({
            color: color,
            size: 1.5,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        // Create particle positions
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        const particleSizes = new Float32Array(particleCount);
        
        // Initialize particles at the asteroid position with varying sizes
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = position.x + (Math.random() - 0.5) * 0.5;
            positions[i3 + 1] = position.y + (Math.random() - 0.5) * 0.5;
            positions[i3 + 2] = position.z + (Math.random() - 0.5) * 0.5;
            
            // Random velocity direction with varying speed
            const speed = 0.3 + Math.random() * 0.7;
            velocities.push(
                (Math.random() - 0.5) * speed,
                (Math.random() - 0.5) * speed,
                (Math.random() - 0.5) * speed
            );
            
            // Random particle sizes
            particleSizes[i] = 0.5 + Math.random() * 2;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
        
        // Create particle system
        const explosion = new THREE.Points(particleGeometry, particleMaterial);
        explosion.userData = {
            velocities: velocities,
            lifeTime: 60,
            type: 'explosion'
        };
        
        // 2. Add a smoke cloud effect - REDUCED PARTICLE COUNT
        const smokeCount = 20; // Reduced from 30 for better performance
        const smokeGeometry = new THREE.BufferGeometry();
        const smokeMaterial = new THREE.PointsMaterial({
            color: 0x444444,
            size: 3,
            transparent: true,
            opacity: 0.7,
            sizeAttenuation: true
        });
        
        // Create smoke particle positions
        const smokePositions = new Float32Array(smokeCount * 3);
        const smokeVelocities = [];
        
        for (let i = 0; i < smokeCount; i++) {
            const i3 = i * 3;
            smokePositions[i3] = position.x + (Math.random() - 0.5) * 0.3;
            smokePositions[i3 + 1] = position.y + (Math.random() - 0.5) * 0.3;
            smokePositions[i3 + 2] = position.z + (Math.random() - 0.5) * 0.3;
            
            // Slower velocities for smoke
            smokeVelocities.push(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2 + 0.05, // Slight upward drift
                (Math.random() - 0.5) * 0.2
            );
        }
        
        smokeGeometry.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
        
        const smoke = new THREE.Points(smokeGeometry, smokeMaterial);
        smoke.userData = {
            velocities: smokeVelocities,
            lifeTime: 90, // Longer lifetime for smoke
            type: 'smoke'
        };
        
        // 3. Add a point light to enhance the explosion effect
        const explosionLight = new THREE.PointLight(color, 2, 30);
        explosionLight.position.copy(position);
        
        // Add temporary flash of bright light
        const flashLight = new THREE.PointLight(0xffffff, 5, 50);
        flashLight.position.copy(position);
        this.scene.add(flashLight);
        
        // Remove flash after a short time
        setTimeout(() => {
            this.scene.remove(flashLight);
        }, 100);
        
        // 4. Create floating score display - only show positive score for laser hits
        // Check if this explosion is from a laser hit (positive score) or a collision (negative score)
        // If health is -1, it's explicitly marked as a collision, not a laser hit
        const calledFromLaserCollision = enemy && enemy.userData && enemy.userData.health !== -1;
        
        // Only show positive score for laser hits, not for collisions
        if (calledFromLaserCollision) {
            // This is from a laser hit - show positive score
            this.createFloatingScore(position, scoreValue);
        }
        
        // Add everything to the scene
        this.scene.add(explosion);
        this.scene.add(smoke);
        this.scene.add(explosionLight);
        
        // Add to enemies array for updates
        this.enemies.push(explosion);
        this.enemies.push(smoke);
        
        // Play sound effect using preloaded sound
        if (typeof Audio !== 'undefined') {
            try {
                // Clone the preloaded sound to allow multiple simultaneous playback
                this.explosionSound.cloneNode().play().catch(e => console.log("Could not play explosion sound", e));
            } catch (e) {
                console.log("Audio not supported");
            }
        }
    }
    
    createFloatingScore(position, score, color = null) {
        // Check if camera exists before proceeding
        if (!this.camera) {
            console.warn("Camera not available, can't create floating score");
            return;
        }
        
        // Create a div for the score
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'floating-score';
        
        // Handle both positive and negative scores
        const isNegative = typeof score === 'string' && score.startsWith('-');
        scoreDiv.textContent = isNegative ? score : `+${score}`;
        
        // Set color based on score type or passed color
        if (color) {
            scoreDiv.style.color = `#${color.toString(16).padStart(6, '0')}`;
        } else {
            scoreDiv.style.color = isNegative ? '#ff4444' : 
                                  (score >= 300 ? '#ff44ff' : '#ffff44');
        }
        
        scoreDiv.style.position = 'absolute';
        scoreDiv.style.fontSize = '24px';
        scoreDiv.style.fontWeight = 'bold';
        scoreDiv.style.textShadow = '0 0 5px black';
        scoreDiv.style.pointerEvents = 'none'; // Don't capture mouse events
        scoreDiv.style.opacity = '1';
        scoreDiv.style.transition = 'opacity 1s, transform 1s';
        
        // Add to DOM
        document.getElementById('game-container').appendChild(scoreDiv);
        
        // Position score at the 3D position in screen coordinates
        const vector = position.clone();
        vector.project(this.camera);
        
        const widthHalf = window.innerWidth / 2;
        const heightHalf = window.innerHeight / 2;
        
        const x = (vector.x * widthHalf) + widthHalf;
        const y = -(vector.y * heightHalf) + heightHalf;
        
        scoreDiv.style.left = `${x}px`;
        scoreDiv.style.top = `${y}px`;
        
        // Animate
        setTimeout(() => {
            scoreDiv.style.transform = 'translateY(-50px)';
            scoreDiv.style.opacity = '0';
        }, 10);
        
        // Remove after animation
        setTimeout(() => {
            scoreDiv.remove();
        }, 1000);
    }
    
    checkLaserCollisions() {
        // Check player lasers against enemies
        for (let i = this.spaceship.lasers.length - 1; i >= 0; i--) {
            const laser = this.spaceship.lasers[i];
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                // Skip if enemy is a laser or explosion
                if (enemy.userData.type === 'alienLaser' || 
                    enemy.userData.type === 'explosion' ||
                    enemy.userData.type === 'smoke') continue;
                
                // Much larger hit detection radius for asteroids
                const hitDistance = enemy.userData.type === 'asteroid' ? 15 : 8;
                
                // Check collision with increased hit distance
                if (distance(laser.position, enemy.position) < hitDistance) {
                    // Get laser damage from the laser's userData (set by the spaceship)
                    const laserDamage = laser.userData.damage || 1;
                    
                    // Reduce enemy health by the laser's damage
                    enemy.userData.health -= laserDamage;
                    
                    // Remove laser
                    this.spaceship.laserGroup.remove(laser);
                    this.spaceship.lasers.splice(i, 1);
                    
                    // Play laser hit sound for asteroids - IMPROVED VERSION
                    if (enemy.userData.type === 'asteroid') {
                        this.playLaserHitSound();
                    }
                    
                    // Create a small flash/impact effect even if not destroyed
                    if (enemy.userData.health > 0) {
                        this.createImpactFlash(enemy.position.clone());
                    }
                    
                    // Check if enemy destroyed
                    if (enemy.userData.health <= 0) {
                        // Add to score when destroying enemies
                        const scoreValue = enemy.userData.type === 'asteroid' ? 100 : 300;
                        this.score += scoreValue;
                        this.enemiesDefeated++;
                        
                        // Update score display
                        document.getElementById('score-value').textContent = this.score;
                        
                        // Create explosion at enemy position before removing it
                        if (enemy.userData.type === 'asteroid') {
                            // Get the asteroid's color for the explosion
                            const explosionColor = enemy.material.color.getHex();
                            // This is a laser hit, so we don't set health to -1
                            this.createExplosion(enemy.position.clone(), explosionColor, 5, enemy);
                        } else if (enemy.userData.type === 'alien') {
                            // Purple explosion for alien ships
                            // This is a laser hit, so we don't set health to -1
                            this.createExplosion(enemy.position.clone(), 0xaa00ff, 8, enemy);
                        }
                        
                        // Remove the enemy
                        this.scene.remove(enemy);
                        this.enemies.splice(j, 1);
                    }
                    
                    break; // Laser can only hit one enemy
                }
            }
        }
    }
    
    // Add a dedicated method for playing the laser hit sound
    playLaserHitSound() {
        try {
            // Use the preloaded sound and clone it for multiple simultaneous playback
            const soundToPlay = this.laserHitSound.cloneNode();
            soundToPlay.play().catch(error => {
                console.error('Play error:', error);
                // Try fallback sound if main one fails
                this.fallbackLaserSound.cloneNode().play().catch(e => console.error('Fallback sound failed:', e));
            });
        } catch (e) {
            console.error('Sound playback error:', e);
        }
    }
    
    createImpactFlash(position) {
        // Create a small flash of light
        const flashLight = new THREE.PointLight(0xffff00, 3, 20);
        flashLight.position.copy(position);
        this.scene.add(flashLight);
        
        // Remove flash after a short time
        setTimeout(() => {
            this.scene.remove(flashLight);
        }, 100);
    }
    
    checkPlayerCollisions() {
        // Check if enemies hit the player
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Skip effects and non-damaging entities
            if (enemy.userData.type === 'explosion' || 
                enemy.userData.type === 'smoke' ||
                enemy.userData.type === 'effect') continue;
            
            // Skip enemies that have been destroyed by lasers (health <= 0)
            // This prevents asteroids that were just shot from damaging the player
            if (enemy.userData.health !== undefined && enemy.userData.health <= 0) continue;
            
            if (distance(enemy.position, this.spaceship.mesh.position) < 5) {
                // Player is hit
                const isDestroyed = this.spaceship.takeDamage(enemy.userData.damage);
                
                // Deduct score when player is hit
                if (enemy.userData.type === 'asteroid' || enemy.userData.type === 'alien' || enemy.userData.type === 'alienLaser') {
                    const deduction = enemy.userData.type === 'alienLaser' ? 25 : 50;
                    this.score -= deduction;
                    if (this.score < 0) this.score = 0; // Don't go below zero
                    
                    // Update score display
                    document.getElementById('score-value').textContent = this.score;
                    
                    // Create a negative score indicator
                    this.createFloatingScore(enemy.position.clone(), `-${deduction}`, 0xff0000);
                }
                
                // Create explosion for the collision - pass false to indicate this is not a laser hit
                if (enemy.userData.type === 'asteroid') {
                    const explosionColor = enemy.material.color.getHex();
                    // Set health to -1 to indicate this is not a laser hit (for explosion logic)
                    enemy.userData.health = -1;
                    this.createExplosion(enemy.position.clone(), explosionColor, 5, enemy);
                } else if (enemy.userData.type === 'alien') {
                    // Set health to -1 to indicate this is not a laser hit (for explosion logic)
                    enemy.userData.health = -1;
                    this.createExplosion(enemy.position.clone(), 0xaa00ff, 8, enemy);
                }
                
                // Remove the enemy
                this.scene.remove(enemy);
                this.enemies.splice(i, 1);
                
                // Check if game over
                if (isDestroyed) {
                    return true; // Player destroyed
                }
            }
        }
        
        return false; // Player still alive
    }
    
    checkPlanetCollisions() {
        const currentPlanet = this.solarSystem.getCurrentPlanet();
        const planetRadius = currentPlanet.geometry.parameters.radius;
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Skip non-physical objects
            if (enemy.userData.type === 'explosion' || 
                enemy.userData.type === 'smoke' ||
                enemy.userData.type === 'effect') continue;
            
            // Check distance to current planet
            if (distance(enemy.position, currentPlanet.position) < planetRadius + 2) {
                // Planet is hit
                
                // Deduct score when planet is hit
                if (enemy.userData.type === 'asteroid') {
                    this.score -= 50; // Deduct 50 points for asteroid hits
                    if (this.score < 0) this.score = 0; // Don't go below zero
                    
                    // Update score display
                    document.getElementById('score-value').textContent = this.score;
                    
                    // Create a negative score indicator
                    this.createFloatingScore(enemy.position.clone(), "-50", 0xff0000);
                    
                    // Darken the planet when hit by asteroid
                    this.solarSystem.damageCurrentPlanet();
                }
                
                // Create explosion - pass false to indicate this is not a laser hit
                if (enemy.userData.type === 'asteroid') {
                    const explosionColor = enemy.material.color.getHex();
                    // Set health to -1 to indicate this is not a laser hit (for explosion logic)
                    enemy.userData.health = -1;
                    this.createExplosion(enemy.position.clone(), explosionColor, 5, enemy);
                }
                
                // Remove the enemy
                this.scene.remove(enemy);
                this.enemies.splice(i, 1);
                
                // Decrease player health as penalty
                const isDestroyed = this.spaceship.takeDamage(10);
                
                if (isDestroyed) {
                    return true; // Game over if player health reaches 0
                }
            }
        }
        
        return false;
    }
    
    spawnHealthPickup() {
        const currentPlanet = this.solarSystem.getCurrentPlanet();
        const planetPos = currentPlanet.position.clone();
        
        // Position the health pickup near the player's area but not too close to the planet
        const spawnRadius = currentPlanet.geometry.parameters.radius * 3;
        const angle = random(0, Math.PI * 2);
        const height = random(-5, 5);
        
        const xPos = planetPos.x + spawnRadius * Math.cos(angle);
        const zPos = planetPos.z + spawnRadius * Math.sin(angle);
        
        // Create a health pickup (medical cross shape)
        const healthPickup = new THREE.Group();
        
        // Main sphere
        const sphereGeometry = new THREE.SphereGeometry(2, 16, 16);
        const sphereMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff88,
            shininess: 80,
            transparent: true,
            opacity: 0.8
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        healthPickup.add(sphere);
        
        // Cross/plus shape
        const crossVGeometry = new THREE.BoxGeometry(0.8, 3, 0.8);
        const crossHGeometry = new THREE.BoxGeometry(3, 0.8, 0.8);
        const crossMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            shininess: 100
        });
        
        const crossV = new THREE.Mesh(crossVGeometry, crossMaterial);
        const crossH = new THREE.Mesh(crossHGeometry, crossMaterial);
        
        healthPickup.add(crossV);
        healthPickup.add(crossH);
        
        // Position pickup
        healthPickup.position.set(xPos, height, zPos);
        
        // Add pulsing light
        const pickupLight = new THREE.PointLight(0x00ff88, 1, 30);
        pickupLight.position.set(0, 0, 0);
        healthPickup.add(pickupLight);
        
        // Setup pickup properties
        healthPickup.userData = {
            type: 'healthPickup',
            healAmount: 25, // Amount of health to restore
            rotationSpeed: 0.02,
            pulseSpeed: 0.03,
            pulseTime: 0,
            velocity: new THREE.Vector3(0, 0.02, 0) // Gentle floating motion
        };
        
        console.log(`Health pickup spawned at position: x=${xPos.toFixed(1)}, y=${height.toFixed(1)}, z=${zPos.toFixed(1)}`);
        
        this.scene.add(healthPickup);
        this.enemies.push(healthPickup); // Add to the enemies array for updating
    }
    
    update() {
        // Debug info about enemies
        if (this.enemies.length === 0) {
            console.log("No enemies present, spawning soon...");
        }
        
        // Calculate current difficulty (even when not spawning)
        this.calculateDifficulty();
        
        // Spawn new enemies
        this.spawnCounter++;
        if (this.spawnCounter >= this.spawnRate) {
            this.spawnEnemy();
            this.spawnCounter = 0;
        }
        
        // Chance to spawn a health pickup when enemies are low
        if (this.enemies.length < 3 && Math.random() < 0.005) {
            this.spawnHealthPickup();
        }
        
        // Update existing enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            // Safety check - skip if enemy is undefined or has been removed
            if (i >= this.enemies.length || !this.enemies[i]) continue;
            
            const enemy = this.enemies[i];
            
            // Safety check - skip if enemy has no userData
            if (!enemy.userData) continue;
            
            // Handle health pickup special behavior
            if (enemy.userData.type === 'healthPickup') {
                // Floating animation
                enemy.position.add(enemy.userData.velocity);
                
                // Bounce gently
                if (enemy.position.y > 3 || enemy.position.y < -3) {
                    enemy.userData.velocity.y *= -1;
                }
                
                // Rotate pickup
                enemy.rotation.y += enemy.userData.rotationSpeed;
                
                // Pulsing effect
                enemy.userData.pulseTime += enemy.userData.pulseSpeed;
                const pulseScale = 1 + 0.1 * Math.sin(enemy.userData.pulseTime);
                enemy.scale.set(pulseScale, pulseScale, pulseScale);
                
                // Check collision with player
                if (distance(enemy.position, this.spaceship.mesh.position) < 8) {
                    // Player collected health pickup
                    this.spaceship.restoreHealth(enemy.userData.healAmount);
                    
                    // Create collection effect
                    this.createHealthCollectEffect(enemy.position.clone());
                    
                    // Remove pickup
                    this.scene.remove(enemy);
                    this.enemies.splice(i, 1);
                    
                    // Add score bonus
                    this.score += 50;
                    document.getElementById('score-value').textContent = this.score;
                    
                    continue;
                }
            }
            
            // Handle explosion and smoke animations
            if (enemy.userData.type === 'explosion' || enemy.userData.type === 'smoke') {
                try {
                    // Safety check - ensure geometry and attributes exist
                    if (!enemy.geometry || !enemy.geometry.attributes || !enemy.geometry.attributes.position) {
                        // If geometry is missing, remove the enemy and continue
                        this.scene.remove(enemy);
                        this.enemies.splice(i, 1);
                        continue;
                    }
                    
                    // Update particle positions
                    const positions = enemy.geometry.attributes.position.array;
                    const velocities = enemy.userData.velocities;
                    
                    // Safety check - ensure velocities exist and arrays have matching lengths
                    if (!velocities || positions.length / 3 * 3 !== velocities.length) {
                        // If velocities are missing or arrays don't match, remove the enemy and continue
                        this.scene.remove(enemy);
                        this.enemies.splice(i, 1);
                        continue;
                    }
                    
                    for (let j = 0; j < positions.length / 3; j++) {
                        const j3 = j * 3;
                        
                        // Safety check - ensure all indices are valid
                        if (j3 + 2 >= positions.length || j3 + 2 >= velocities.length) continue;
                        
                        // Move each particle
                        positions[j3] += velocities[j3];
                        positions[j3 + 1] += velocities[j3 + 1];
                        positions[j3 + 2] += velocities[j3 + 2];
                        
                        // Handle different acceleration for explosion vs smoke
                        if (enemy.userData.type === 'explosion') {
                            // Accelerate expansion over time
                            velocities[j3] *= 1.05;
                            velocities[j3 + 1] *= 1.05;
                            velocities[j3 + 2] *= 1.05;
                        } else if (enemy.userData.type === 'smoke') {
                            // Slower deceleration for smoke
                            velocities[j3] *= 0.98;
                            velocities[j3 + 1] *= 0.98;
                            velocities[j3 + 2] *= 0.98;
                            
                            // Add a slight upward drift to smoke
                            velocities[j3 + 1] += 0.003;
                        }
                    }
                    
                    // Update the geometry
                    enemy.geometry.attributes.position.needsUpdate = true;
                    
                    // Fade out the particles
                    enemy.material.opacity -= 1 / enemy.userData.lifeTime;
                    
                    // Decrease lifetime
                    enemy.userData.lifeTime--;
                    
                    // Remove explosion/smoke when animation completes
                    if (enemy.userData.lifeTime <= 0) {
                        this.scene.remove(enemy);
                        this.enemies.splice(i, 1);
                        continue;
                    }
                } catch (error) {
                    // If any error occurs during particle update, safely remove the enemy
                    console.error("Error updating particle effect:", error);
                    this.scene.remove(enemy);
                    this.enemies.splice(i, 1);
                    continue;
                }
            }
            
            // Safety check - ensure position and velocity exist
            if (!enemy.position || !enemy.userData.velocity) {
                this.scene.remove(enemy);
                this.enemies.splice(i, 1);
                continue;
            }
            
            // Move enemy
            try {
                enemy.position.add(enemy.userData.velocity);
            } catch (error) {
                console.error("Error moving enemy:", error);
                this.scene.remove(enemy);
                this.enemies.splice(i, 1);
                continue;
            }
            
            // Handle different enemy types
            if (enemy.userData.type === 'asteroid') {
                // Safety check - ensure rotation and rotationSpeed exist
                if (!enemy.rotation || !enemy.userData.rotationSpeed) continue;
                
                // Rotate asteroid
                enemy.rotation.x += enemy.userData.rotationSpeed.x;
                enemy.rotation.y += enemy.userData.rotationSpeed.y;
                enemy.rotation.z += enemy.userData.rotationSpeed.z;
            } 
            else if (enemy.userData.type === 'alien') {
                // Alien ships can fire lasers
                enemy.userData.fireCooldown--;
                
                if (enemy.userData.fireCooldown <= 0) {
                    try {
                        this.fireAlienLaser(enemy);
                        enemy.userData.fireCooldown = enemy.userData.fireRate;
                    } catch (error) {
                        console.error("Error firing alien laser:", error);
                    }
                }
                
                // Aliens rotate to face their direction of travel
                try {
                    enemy.lookAt(
                        enemy.position.x + enemy.userData.velocity.x,
                        enemy.position.y + enemy.userData.velocity.y,
                        enemy.position.z + enemy.userData.velocity.z
                    );
                } catch (error) {
                    console.error("Error rotating alien ship:", error);
                }
            }
            else if (enemy.userData.type === 'alienLaser') {
                // Update alien laser lifetime
                enemy.userData.lifeTime--;
                
                if (enemy.userData.lifeTime <= 0) {
                    this.scene.remove(enemy);
                    this.enemies.splice(i, 1);
                }
            }
            
            // Remove enemies that are too far away
            try {
                if (distance(enemy.position, this.solarSystem.getCurrentPlanet().position) > 1000) {
                    this.scene.remove(enemy);
                    this.enemies.splice(i, 1);
                }
            } catch (error) {
                console.error("Error checking enemy distance:", error);
                this.scene.remove(enemy);
                this.enemies.splice(i, 1);
            }
        }
        
        // Check for collisions
        this.checkLaserCollisions();
        const playerDestroyed = this.checkPlayerCollisions();
        const planetHit = this.checkPlanetCollisions();
        
        return playerDestroyed || planetHit; // Return true if game over
    }
    
    showHitArea(position, radius) {
        // Create a wireframe sphere to show the hit area
        const geometry = new THREE.SphereGeometry(radius, 16, 16);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xffff00, 
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        const hitSphere = new THREE.Mesh(geometry, material);
        hitSphere.position.copy(position);
        
        // Add to scene
        this.scene.add(hitSphere);
        
        // Remove after a short time
        setTimeout(() => {
            this.scene.remove(hitSphere);
        }, 500);
    }
    
    createHealthCollectEffect(position) {
        // Create particle system for the health collection effect - REDUCED PARTICLE COUNT
        const particleCount = 25; // Reduced from 40 for better performance
        const particleGeometry = new THREE.BufferGeometry();
        const particleMaterial = new THREE.PointsMaterial({
            color: 0x00ff88,
            size: 1,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });
        
        // Create particle positions
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        
        // Initialize particles at the health pickup position
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = position.x;
            positions[i3 + 1] = position.y;
            positions[i3 + 2] = position.z;
            
            // Random velocity direction for each particle
            velocities.push(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3 + 0.2, // Slight upward bias
                (Math.random() - 0.5) * 0.3
            );
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Create particle system
        const effect = new THREE.Points(particleGeometry, particleMaterial);
        effect.userData = {
            velocities: velocities,
            lifeTime: 40,
            type: 'effect'
        };
        
        // Add a point light for the glow effect
        const healthLight = new THREE.PointLight(0x00ffaa, 2, 30);
        healthLight.position.copy(position);
        
        // Add to scene
        this.scene.add(effect);
        this.scene.add(healthLight);
        
        // Add effect to be updated
        this.enemies.push(effect);
        
        // Remove light after a short time
        setTimeout(() => {
            this.scene.remove(healthLight);
        }, 500);
        
        // Play collection sound using preloaded sound
        if (typeof Audio !== 'undefined') {
            try {
                this.healthPickupSound.cloneNode().play().catch(e => console.log("Could not play collect sound", e));
            } catch (e) {
                console.log("Audio not supported");
            }
        }
        
        // Show floating text indicating health restored
        this.createFloatingScore(position, "+25 Health", 0x00ff88);
    }
    
    // Add a new method to calculate difficulty based on score
    calculateDifficulty() {
        // Increase difficulty every 500 points
        const newDifficultyLevel = Math.floor(this.score / 500) + 1;
        
        // If difficulty level has increased, update parameters
        if (newDifficultyLevel > this.difficultyLevel) {
            this.difficultyLevel = newDifficultyLevel;
            this.lastDifficultyIncrease = this.score;
            
            // Display difficulty increase message
            this.showDifficultyIncreaseMessage();
            
            // Log difficulty increase
            console.log(`Difficulty increased to level ${this.difficultyLevel}!`);
        }
        
        // Update difficulty display in UI
        document.getElementById('difficulty-value').textContent = this.difficultyLevel;
        
        // Calculate spawn rate (decreases as score increases)
        this.spawnRate = Math.max(
            this.minSpawnRate,
            this.baseSpawnRate - (this.difficultyLevel * 30)
        );
        
        // Calculate alien chance (increases with difficulty)
        this.alienChance = Math.min(
            this.maxAlienChance,
            0.05 + (this.difficultyLevel * 0.04)
        );
        
        // Calculate multi-spawn chance (increases with difficulty)
        this.multiSpawnChance = Math.min(
            this.maxMultiSpawnChance,
            (this.difficultyLevel - 1) * 0.1
        );
        
        // Calculate max enemies per spawn (increases with difficulty)
        this.maxEnemiesPerSpawn = Math.min(5, 1 + Math.floor(this.difficultyLevel / 2));
    }
    
    // Add a method to show difficulty increase message
    showDifficultyIncreaseMessage() {
        // Create a message element
        const messageDiv = document.createElement('div');
        messageDiv.style.position = 'absolute';
        messageDiv.style.top = '50%';
        messageDiv.style.left = '50%';
        messageDiv.style.transform = 'translate(-50%, -50%)';
        messageDiv.style.color = '#ff5500';
        messageDiv.style.fontSize = '36px';
        messageDiv.style.fontWeight = 'bold';
        messageDiv.style.textShadow = '0 0 10px #ff0000';
        messageDiv.style.zIndex = '1000';
        messageDiv.style.textAlign = 'center';
        messageDiv.innerHTML = `
            <div>DIFFICULTY INCREASED!</div>
            <div style="font-size: 24px">Level ${this.difficultyLevel}</div>
        `;
        
        // Add to DOM
        document.getElementById('game-container').appendChild(messageDiv);
        
        // Animate and remove
        setTimeout(() => {
            messageDiv.style.transition = 'opacity 1s';
            messageDiv.style.opacity = '0';
            setTimeout(() => {
                messageDiv.remove();
            }, 1000);
        }, 1500);
    }
} 