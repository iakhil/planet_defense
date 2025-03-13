// Player's spaceship controls and mechanics

class Spaceship {
    constructor(scene, camera, shipType = 'fighter') {
        console.log(`Creating spaceship of type: ${shipType}`);
        
        this.scene = scene;
        this.camera = camera;
        this.shipType = shipType;
        
        // Base stats that will be modified by ship type
        this.baseSpeed = 1.5;
        this.baseRotationSpeed = 0.05;
        this.baseHealth = 100;
        this.baseLaserCooldownTime = 10;
        this.baseLaserDamage = 1;
        
        // Initialize with base stats
        this.speed = this.baseSpeed;
        this.rotationSpeed = this.baseRotationSpeed;
        this.health = this.baseHealth;
        this.laserCooldownTime = this.baseLaserCooldownTime;
        this.laserDamage = this.baseLaserDamage;
        
        // Apply ship type modifiers
        this.applyShipTypeModifiers();
        
        this.lasers = [];
        this.laserCooldown = 0;
        this.isMovingForward = false;
        this.isMovingBackward = false;
        this.isRotatingLeft = false;
        this.isRotatingRight = false;
        this.isFiring = false;
        
        // Create a group for the ship mesh
        this.mesh = new THREE.Group();
        
        // Create the spaceship based on type
        this.createSpaceship();
        
        // Only set up controls if we're in the main game (not in preview)
        if (this.scene && this.camera) {
            this.setupControls();
        }
    }
    
    applyShipTypeModifiers() {
        switch(this.shipType) {
            case 'interceptor':
                // Faster, more agile, but less health
                this.speed = this.baseSpeed * 1.4;
                this.rotationSpeed = this.baseRotationSpeed * 1.3;
                this.health = this.baseHealth * 0.8;
                this.laserCooldownTime = this.baseLaserCooldownTime * 0.8; // Fires faster
                this.laserDamage = this.baseLaserDamage * 0.9; // Slightly less damage
                break;
                
            case 'destroyer':
                // Slower, less agile, but more health and damage
                this.speed = this.baseSpeed * 0.7;
                this.rotationSpeed = this.baseRotationSpeed * 0.7;
                this.health = this.baseHealth * 1.5;
                this.laserCooldownTime = this.baseLaserCooldownTime * 1.5; // Fires slower
                this.laserDamage = this.baseLaserDamage * 1.5; // More damage
                break;
                
            case 'fighter':
            default:
                // Balanced ship - no modifications to base stats
                break;
        }
    }
    
    createSpaceship() {
        try {
            // Create a ship based on the selected type
            switch(this.shipType) {
                case 'interceptor':
                    this.createInterceptor();
                    break;
                    
                case 'destroyer':
                    this.createDestroyer();
                    break;
                    
                case 'fighter':
                default:
                    this.createFighter();
                    break;
            }
            
            // Position the ship
            this.mesh.position.set(0, 0, 50);
            this.mesh.rotation.y = Math.PI; // Point forward
            
            // Add the ship to the scene
            if (this.scene) {
                this.scene.add(this.mesh);
            }
            
            // Setup a group for lasers
            this.laserGroup = new THREE.Group();
            if (this.scene) {
                this.scene.add(this.laserGroup);
            }
        } catch (error) {
            console.error("Error creating spaceship:", error);
        }
    }
    
    createFighter() {
        try {
            // Original ship design - balanced fighter
            
            // Ship body - orange-red
            const bodyGeometry = new THREE.ConeGeometry(2, 8, 8);
            const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xff5533 });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.rotation.x = Math.PI / 2;
            body.position.z = -4;
            
            // Wings - darker orange/red
            const wingGeometry = new THREE.BoxGeometry(10, 0.5, 3);
            const wingMaterial = new THREE.MeshPhongMaterial({ color: 0xcc3311 });
            const wings = new THREE.Mesh(wingGeometry, wingMaterial);
            wings.position.z = -3;
            
            // Cockpit - gold tinted
            const cockpitGeometry = new THREE.SphereGeometry(1.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
            const cockpitMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xffdd33,
                transparent: true,
                opacity: 0.7
            });
            const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
            cockpit.rotation.x = -Math.PI / 2;
            cockpit.position.z = -1;
            
            // Add all parts to the ship
            this.mesh.add(body);
            this.mesh.add(wings);
            this.mesh.add(cockpit);
            
            // Add engine glow
            this.addEngineGlow(0xff3300);
        } catch (error) {
            console.error("Error creating fighter:", error);
        }
    }
    
    createInterceptor() {
        try {
            // Sleek, fast interceptor design
            
            // Ship body - blue/cyan
            const bodyGeometry = new THREE.ConeGeometry(1.5, 10, 8); // Longer, thinner body
            const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x00aaff });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.rotation.x = Math.PI / 2;
            body.position.z = -4;
            
            // Wings - swept back for speed
            const wingShape = new THREE.Shape();
            wingShape.moveTo(0, 0);
            wingShape.lineTo(6, -4);
            wingShape.lineTo(6, -5);
            wingShape.lineTo(1, -1);
            wingShape.lineTo(0, 0);
            
            const wingGeometry = new THREE.ExtrudeGeometry(wingShape, {
                depth: 0.3,
                bevelEnabled: false
            });
            
            const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x0088cc });
            
            // Left wing
            const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
            leftWing.position.set(-1, 0, -3);
            
            // Right wing (mirrored)
            const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
            rightWing.position.set(1, 0, -3);
            rightWing.scale.x = -1; // Mirror
            
            // Cockpit - blue tinted
            const cockpitGeometry = new THREE.SphereGeometry(1.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
            const cockpitMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x88ddff,
                transparent: true,
                opacity: 0.7
            });
            const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
            cockpit.rotation.x = -Math.PI / 2;
            cockpit.position.z = -1;
            
            // Add all parts to the ship
            this.mesh.add(body);
            this.mesh.add(leftWing);
            this.mesh.add(rightWing);
            this.mesh.add(cockpit);
            
            // Add engine glow - blue for interceptor
            this.addEngineGlow(0x00aaff);
        } catch (error) {
            console.error("Error creating interceptor:", error);
        }
    }
    
    createDestroyer() {
        try {
            // Heavy, powerful destroyer design
            
            // Ship body - dark gray/purple
            const bodyGeometry = new THREE.BoxGeometry(6, 3, 12);
            const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x554466 });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.z = -4;
            
            // Heavy armor plating
            const armorGeometry = new THREE.BoxGeometry(8, 1, 8);
            const armorMaterial = new THREE.MeshPhongMaterial({ color: 0x443355 });
            const armor = new THREE.Mesh(armorGeometry, armorMaterial);
            armor.position.z = -2;
            
            // Side cannons
            const cannonGeometry = new THREE.CylinderGeometry(0.8, 0.8, 5, 8);
            const cannonMaterial = new THREE.MeshPhongMaterial({ color: 0x332244 });
            
            // Left cannon
            const leftCannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
            leftCannon.rotation.z = Math.PI / 2;
            leftCannon.position.set(-4, 0, -4);
            
            // Right cannon
            const rightCannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
            rightCannon.rotation.z = Math.PI / 2;
            rightCannon.position.set(4, 0, -4);
            
            // Cockpit - purple tinted
            const cockpitGeometry = new THREE.SphereGeometry(2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
            const cockpitMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xaa88cc,
                transparent: true,
                opacity: 0.7
            });
            const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
            cockpit.rotation.x = -Math.PI / 2;
            cockpit.position.z = 0;
            
            // Add all parts to the ship
            this.mesh.add(body);
            this.mesh.add(armor);
            this.mesh.add(leftCannon);
            this.mesh.add(rightCannon);
            this.mesh.add(cockpit);
            
            // Add engine glow - purple for destroyer
            this.addEngineGlow(0x8800aa);
        } catch (error) {
            console.error("Error creating destroyer:", error);
        }
    }
    
    addEngineGlow(color) {
        try {
            // Add engine glow effect
            const engineGlow = new THREE.PointLight(color, 1, 10);
            engineGlow.position.set(0, 0, -8);
            this.mesh.add(engineGlow);
        } catch (error) {
            console.error("Error adding engine glow:", error);
        }
    }
    
    setupControls() {
        // For troubleshooting
        console.log("Setting up ship controls");
        
        document.addEventListener('keydown', (event) => {
            console.log("Key pressed:", event.code); // Debug
            switch(event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.isMovingForward = true;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.isMovingBackward = true;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.isRotatingLeft = true;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.isRotatingRight = true;
                    break;
                case 'Space':
                    this.isFiring = true;
                    break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            switch(event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.isMovingForward = false;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.isMovingBackward = false;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.isRotatingLeft = false;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.isRotatingRight = false;
                    break;
                case 'Space':
                    this.isFiring = false;
                    break;
            }
        });
    }
    
    fireLaser() {
        if (this.laserCooldown > 0) return;
        
        // Create a laser beam with properties based on ship type
        let laserColor, laserSize, laserLength;
        
        switch(this.shipType) {
            case 'interceptor':
                laserColor = 0x00ffff; // Cyan lasers
                laserSize = 0.2;       // Thinner
                laserLength = 2.5;     // Shorter
                break;
                
            case 'destroyer':
                laserColor = 0xff00ff; // Purple lasers
                laserSize = 0.5;       // Thicker
                laserLength = 4;       // Longer
                break;
                
            case 'fighter':
            default:
                laserColor = 0xff0000; // Red lasers
                laserSize = 0.3;       // Standard
                laserLength = 3;       // Standard
                break;
        }
        
        const laserGeometry = new THREE.CylinderGeometry(laserSize, laserSize, laserLength, 8);
        const laserMaterial = new THREE.MeshBasicMaterial({ 
            color: laserColor,
            transparent: true,
            opacity: 0.8
        });
        
        const laser = new THREE.Mesh(laserGeometry, laserMaterial);
        laser.rotation.x = Math.PI / 2;
        
        // Position in front of the ship
        laser.position.copy(this.mesh.position);
        const offset = new THREE.Vector3(0, 0, -8);
        offset.applyQuaternion(this.mesh.quaternion);
        laser.position.add(offset);
        
        // Apply ship rotation to laser
        laser.quaternion.copy(this.mesh.quaternion);
        
        // Set velocity based on ship direction - faster for shorter beams
        const velocity = new THREE.Vector3(0, 0, -3);
        velocity.applyQuaternion(this.mesh.quaternion);
        
        laser.userData = {
            velocity: velocity,
            lifeTime: 40,
            damage: this.laserDamage // Store the damage value for this laser
        };
        
        this.lasers.push(laser);
        this.laserGroup.add(laser);
        
        // Apply cooldown based on ship type
        this.laserCooldown = this.laserCooldownTime;
        
        // Add a simple sound effect with reduced volume (not on every pulse)
        if (Math.random() > 0.7) {
            const audio = new Audio('https://www.soundjay.com/buttons/beep-07.wav');
            audio.volume = 0.1; // Lower volume
            audio.play().catch(e => console.error('Audio play failed:', e));
        }
        
        // Alternate laser colors for visual interest
        const colors = [laserColor, laserColor * 1.2, laserColor * 0.8];
        this.lastLaserColor = (this.lastLaserColor || 0) + 1;
        if (this.lastLaserColor >= colors.length) this.lastLaserColor = 0;
        
        // Visual feedback - muzzle flash effect
        this.createMuzzleFlash(laserColor);
    }
    
    createMuzzleFlash(color = 0xff3333) {
        // Create a point light for the muzzle flash
        const flashLight = new THREE.PointLight(color, 1, 10);
        
        // Position at the front of the ship
        const flashPosition = this.mesh.position.clone();
        const offset = new THREE.Vector3(0, 0, -8);
        offset.applyQuaternion(this.mesh.quaternion);
        flashLight.position.copy(flashPosition.add(offset));
        
        // Add to scene
        this.scene.add(flashLight);
        
        // Remove after a short time
        setTimeout(() => {
            this.scene.remove(flashLight);
        }, 50);
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        
        // Update UI
        document.getElementById('health-value').textContent = this.health;
        
        return this.health <= 0; // Return true if destroyed
    }
    
    update() {
        // Handle movement
        if (this.isMovingForward) {
            const direction = new THREE.Vector3(0, 0, -this.speed);
            direction.applyQuaternion(this.mesh.quaternion);
            this.mesh.position.add(direction);
        }
        
        if (this.isMovingBackward) {
            const direction = new THREE.Vector3(0, 0, this.speed);
            direction.applyQuaternion(this.mesh.quaternion);
            this.mesh.position.add(direction);
        }
        
        // Handle rotation
        if (this.isRotatingLeft) {
            this.mesh.rotation.y += this.rotationSpeed;
        }
        
        if (this.isRotatingRight) {
            this.mesh.rotation.y -= this.rotationSpeed;
        }
        
        // Handle firing
        if (this.isFiring) {
            this.fireLaser();
        }
        
        // Update lasers
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            laser.position.add(laser.userData.velocity);
            
            // Decrease lifetime
            laser.userData.lifeTime--;
            
            // Remove if lifetime is over
            if (laser.userData.lifeTime <= 0) {
                this.laserGroup.remove(laser);
                this.lasers.splice(i, 1);
            }
        }
        
        // Update laser cooldown
        if (this.laserCooldown > 0) {
            this.laserCooldown--;
        }
        
        // Update camera position relative to ship - FIXED VERSION
        const offset = new THREE.Vector3(0, 10, 20); // Camera offset from ship
        offset.applyQuaternion(this.mesh.quaternion); // Rotate offset with ship
        
        this.camera.position.copy(this.mesh.position).add(offset);
        this.camera.lookAt(this.mesh.position);
    }
    
    restoreHealth(amount) {
        // Add health, but cap at max health (which varies by ship type)
        const maxHealth = this.shipType === 'destroyer' ? this.baseHealth * 1.5 : 
                         (this.shipType === 'interceptor' ? this.baseHealth * 0.8 : this.baseHealth);
        
        this.health = Math.min(maxHealth, this.health + amount);
        
        // Update UI
        document.getElementById('health-value').textContent = this.health;
        
        // Flash the health display
        const healthElement = document.getElementById('health');
        healthElement.style.backgroundColor = '#00ff88';
        healthElement.style.transition = 'background-color 1s';
        
        // Reset color after animation
        setTimeout(() => {
            healthElement.style.backgroundColor = '';
        }, 1000);
        
        // Add a healing effect to the ship
        this.createHealEffect();
    }
    
    createHealEffect() {
        // Create a green glow around the ship
        const glowGeometry = new THREE.SphereGeometry(5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.3
        });
        
        const healGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        healGlow.position.copy(this.mesh.position);
        
        this.scene.add(healGlow);
        
        // Animate the glow (expand and fade)
        let scale = 1;
        let opacity = 0.3;
        
        const animateGlow = () => {
            scale += 0.05;
            opacity -= 0.01;
            
            healGlow.scale.set(scale, scale, scale);
            glowMaterial.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(animateGlow);
            } else {
                this.scene.remove(healGlow);
            }
        };
        
        animateGlow();
    }
    
    // Get ship stats for display
    getStats() {
        return {
            type: this.shipType,
            speed: this.speed,
            health: this.health,
            maxHealth: this.shipType === 'destroyer' ? this.baseHealth * 1.5 : 
                      (this.shipType === 'interceptor' ? this.baseHealth * 0.8 : this.baseHealth),
            fireRate: Math.round(60 / this.laserCooldownTime), // Approximate shots per second
            damage: this.laserDamage
        };
    }
} 