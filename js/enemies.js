// Enemy types: asteroids and alien ships

class EnemyManager {
    constructor(scene, solarSystem, spaceship) {
        this.scene = scene;
        this.solarSystem = solarSystem;
        this.spaceship = spaceship;
        this.enemies = [];
        this.spawnRate = 300; // Increased from 100 to 300 (3x slower)
        this.spawnCounter = 0;  
        this.asteroidGeometries = [];
        this.score = 0;
        this.enemiesDefeated = 0;
        
        // Create asteroid geometries
        this.createAsteroidGeometries();
        
        // Force spawn just a few initial asteroids after a delay
        setTimeout(() => {
            for (let i = 0; i < 3; i++) {
                this.spawnAsteroid();
            }
        }, 3000); // 3 seconds after game starts
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
        
        // Direction towards the planet
        const direction = new THREE.Vector3()
            .subVectors(planetPos, asteroid.position)
            .normalize()
            .multiplyScalar(0.1 + (this.solarSystem.getCurrentDifficulty() * 0.02));
        
        // Rotation speed
        const rotationSpeed = {
            x: random(-0.02, 0.02),
            y: random(-0.02, 0.02),
            z: random(-0.02, 0.02)
        };
        
        asteroid.userData = {
            type: 'asteroid',
            velocity: direction,
            rotationSpeed: rotationSpeed,
            health: 1,
            damage: 10
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
        
        // Direction towards the planet
        const speed = 0.2 + (this.solarSystem.getCurrentDifficulty() * 0.05);
        const direction = new THREE.Vector3()
            .subVectors(planetPos, alienShip.position)
            .normalize()
            .multiplyScalar(speed);
        
        // Setup alien ship properties
        alienShip.userData = {
            type: 'alien',
            velocity: direction,
            health: 3,
            fireCooldown: 60,
            fireRate: 120
        };
        
        // Add a light to make the alien ship more visible
        const alienLight = new THREE.PointLight(0xaa00ff, 1, 30);
        alienLight.position.set(0, 0, 0);
        alienShip.add(alienLight);
        
        this.scene.add(alienShip);
        this.enemies.push(alienShip);
    }
    
    spawnEnemy() {
        console.log("Spawning enemy...");
        
        // Almost always spawn asteroids (95% chance)
        if (Math.random() < 0.95) {
            console.log("Spawning asteroid");
            this.spawnAsteroid();
        } else {
            console.log("Spawning alien ship");
            this.spawnAlienShip();
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
        
        // Point at target (planet or player with some randomness)
        const target = Math.random() < 0.3 ? this.spaceship.mesh.position : alienShip.userData.target.position;
        
        // Calculate direction to target
        const direction = new THREE.Vector3()
            .subVectors(target, alienShip.position)
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
        // Create a more complex explosion with multiple elements
        
        // 1. Create core particle burst
        const particleCount = 50; // Increased from 30
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
        
        // 2. Add a smoke cloud effect (slower expanding, darker particles)
        const smokeCount = 30;
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
        
        // 4. Create floating score display
        this.createFloatingScore(position, enemy.userData.type === 'asteroid' ? 100 : 300, enemy);
        
        // Add everything to the scene
        this.scene.add(explosion);
        this.scene.add(smoke);
        this.scene.add(explosionLight);
        
        // Add to enemies array for updates
        this.enemies.push(explosion);
        this.enemies.push(smoke);
        
        // Add sound effect
        if (typeof Audio !== 'undefined') {
            try {
                const explosionSound = new Audio('https://freesound.org/data/previews/369/369921_4582659-lq.mp3');
                explosionSound.volume = 0.3;
                explosionSound.play().catch(e => console.log("Could not play explosion sound", e));
            } catch (e) {
                console.log("Audio not supported");
            }
        }
    }
    
    createFloatingScore(position, score, enemy) {
        // Create a div for the score
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'floating-score';
        scoreDiv.textContent = `+${score}`;
        scoreDiv.style.position = 'absolute';
        scoreDiv.style.color = score >= 300 ? '#ff44ff' : '#ffff44'; // Purple for aliens, yellow for asteroids
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
                
                // Show hit area for debugging (uncomment to enable visualization)
                // this.showHitArea(enemy.position, hitDistance);
                
                if (distance(laser.position, enemy.position) < hitDistance) {
                    // Reduce enemy health
                    enemy.userData.health--;
                    
                    // Remove laser
                    this.spaceship.laserGroup.remove(laser);
                    this.spaceship.lasers.splice(i, 1);
                    
                    // Create a small flash/impact effect even if not destroyed
                    if (enemy.userData.health > 0) {
                        this.createImpactFlash(enemy.position.clone());
                    }
                    
                    // Check if enemy destroyed
                    if (enemy.userData.health <= 0) {
                        // Create explosion at enemy position before removing it
                        if (enemy.userData.type === 'asteroid') {
                            // Get the asteroid's color for the explosion
                            const explosionColor = enemy.material.color.getHex();
                            this.createExplosion(enemy.position.clone(), explosionColor, 5, enemy);
                        } else if (enemy.userData.type === 'alien') {
                            // Purple explosion for alien ships
                            this.createExplosion(enemy.position.clone(), 0xaa00ff, 8, enemy);
                        }
                        
                        // Remove enemy
                        this.scene.remove(enemy);
                        this.enemies.splice(j, 1);
                        
                        this.enemiesDefeated++;
                        
                        // Add score based on enemy type
                        if (enemy.userData.type === 'asteroid') {
                            this.score += 100;
                        } else if (enemy.userData.type === 'alien') {
                            this.score += 300;
                        }
                        
                        // Update score display
                        document.getElementById('score-value').textContent = this.score;
                    }
                    
                    break; // Laser can only hit one enemy
                }
            }
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
            
            if (distance(enemy.position, this.spaceship.mesh.position) < 5) {
                // Player is hit
                const isDestroyed = this.spaceship.takeDamage(enemy.userData.damage);
                
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
            
            // Check distance to current planet
            if (distance(enemy.position, currentPlanet.position) < planetRadius + 2) {
                // Planet is hit
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
    
    update() {
        // Debug info about enemies
        if (this.enemies.length === 0) {
            console.log("No enemies present, spawning soon...");
        }
        
        // Spawn new enemies
        this.spawnCounter++;
        if (this.spawnCounter >= this.spawnRate) {
            this.spawnEnemy();
            // Keep spawn rate fixed at 300 frames (about 5 seconds at 60fps)
            this.spawnRate = 300;
            this.spawnCounter = 0;
        }
        
        // Update existing enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Handle explosion and smoke animations
            if (enemy.userData.type === 'explosion' || enemy.userData.type === 'smoke') {
                // Update particle positions
                const positions = enemy.geometry.attributes.position.array;
                const velocities = enemy.userData.velocities;
                
                for (let j = 0; j < positions.length / 3; j++) {
                    const j3 = j * 3;
                    
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
            }
            
            // Move enemy
            enemy.position.add(enemy.userData.velocity);
            
            // Handle different enemy types
            if (enemy.userData.type === 'asteroid') {
                // Rotate asteroid
                enemy.rotation.x += enemy.userData.rotationSpeed.x;
                enemy.rotation.y += enemy.userData.rotationSpeed.y;
                enemy.rotation.z += enemy.userData.rotationSpeed.z;
            } 
            else if (enemy.userData.type === 'alien') {
                // Alien ships can fire lasers
                enemy.userData.fireCooldown--;
                
                if (enemy.userData.fireCooldown <= 0) {
                    this.fireAlienLaser(enemy);
                    enemy.userData.fireCooldown = enemy.userData.fireRate;
                }
                
                // Aliens rotate to face their direction of travel
                enemy.lookAt(
                    enemy.position.x + enemy.userData.velocity.x,
                    enemy.position.y + enemy.userData.velocity.y,
                    enemy.position.z + enemy.userData.velocity.z
                );
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
            if (distance(enemy.position, this.solarSystem.getCurrentPlanet().position) > 1000) {
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
} 