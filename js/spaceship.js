// Player's spaceship controls and mechanics

class Spaceship {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.speed = 1.5;
        this.rotationSpeed = 0.05;
        this.lasers = [];
        this.health = 100;
        this.laserCooldown = 0;
        this.laserCooldownTime = 10; // Frames until next laser can be fired
        this.isMovingForward = false;
        this.isMovingBackward = false;
        this.isRotatingLeft = false;
        this.isRotatingRight = false;
        this.isFiring = false;
        
        this.createSpaceship();
        this.setupControls();
    }
    
    createSpaceship() {
        // Create a simple spaceship using basic shapes
        this.mesh = new THREE.Group();
        
        // Ship body - change from blue to red/orange
        const bodyGeometry = new THREE.ConeGeometry(2, 8, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xff5533 }); // Changed from blue to orange-red
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2;
        body.position.z = -4;
        
        // Wings - change from dark blue to darker orange/red
        const wingGeometry = new THREE.BoxGeometry(10, 0.5, 3);
        const wingMaterial = new THREE.MeshPhongMaterial({ color: 0xcc3311 }); // Changed from dark blue to darker red
        const wings = new THREE.Mesh(wingGeometry, wingMaterial);
        wings.position.z = -3;
        
        // Cockpit - change to slightly tinted gold
        const cockpitGeometry = new THREE.SphereGeometry(1.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const cockpitMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffdd33, // Changed from blue to gold
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
        
        // Position the ship
        this.mesh.position.set(0, 0, 50);
        this.mesh.rotation.y = Math.PI; // Point forward
        
        this.scene.add(this.mesh);
        
        // Setup a group for lasers
        this.laserGroup = new THREE.Group();
        this.scene.add(this.laserGroup);
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
        
        // Create a smaller laser beam for the stream effect
        const laserGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8); // Shorter, more compact beam
        const laserMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
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
            lifeTime: 40
        };
        
        this.lasers.push(laser);
        this.laserGroup.add(laser);
        
        // Very short cooldown for stream effect
        this.laserCooldown = 2; // Faster firing rate
        
        // Add a simple sound effect with reduced volume (not on every pulse)
        if (Math.random() > 0.7) {
            const audio = new Audio('https://www.soundjay.com/buttons/beep-07.wav');
            audio.volume = 0.1; // Lower volume
            audio.play().catch(e => console.error('Audio play failed:', e));
        }
        
        // Alternate laser colors for visual interest
        const colors = [0xff0000, 0xff3333, 0xff6666];
        this.lastLaserColor = (this.lastLaserColor || 0) + 1;
        if (this.lastLaserColor >= colors.length) this.lastLaserColor = 0;
        
        // Visual feedback - muzzle flash effect
        this.createMuzzleFlash();
    }
    
    createMuzzleFlash() {
        // Create a point light for the muzzle flash
        const flashLight = new THREE.PointLight(0xff3333, 1, 10);
        
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
        // Add health, but cap at 100
        this.health = Math.min(100, this.health + amount);
        
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
} 