// Planets creation and management

class SolarSystem {
    constructor(scene) {
        this.scene = scene;
        this.planets = [];
        this.currentPlanetIndex = 0;
        
        // Only keep Earth
        this.planetData = [
            {
                name: 'Earth',
                radius: 20, // Slightly larger for better visibility
                textureUrl: 'https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg',
                position: { x: 0, y: 0, z: 0 }, // At center
                rotationSpeed: 0.002,
                orbitRadius: 0,
                difficulty: 3
            }
        ];
        
        // Create sun but position it farther away
        this.createSun();
        
        // Create Earth
        this.createPlanets();
        
        // Create starfield background
        this.createStarfield();
    }
    
    createSun() {
        const sunMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffdd00,
            emissive: 0xffcc00,
            emissiveIntensity: 0.8,
            shininess: 0
        });
        
        const sunGeometry = new THREE.SphereGeometry(50, 64, 64);
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun.position.set(800, 0, -500); // Position sun far away
        
        // Add a point light at the sun's position
        const sunLight = new THREE.PointLight(0xffffff, 2, 2000);
        this.sun.add(sunLight);
        
        this.scene.add(this.sun);
    }
    
    createPlanets() {
        this.planetData.forEach(data => {
            const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
            
            // Use MeshPhongMaterial with colors instead of textures
            const material = new THREE.MeshPhongMaterial({
                color: this.getPlanetColor(data.name),
                shininess: 5,
                specular: 0x333333
            });
            
            const planet = new THREE.Mesh(geometry, material);
            planet.position.set(data.position.x, data.position.y, data.position.z);
            planet.userData = {
                name: data.name,
                rotationSpeed: data.rotationSpeed,
                orbitRadius: data.orbitRadius,
                orbitSpeed: 0.001 / Math.sqrt(data.orbitRadius),
                orbitAngle: 0,
                difficulty: data.difficulty
            };
            
            // Add rings for Saturn
            if (data.name === 'Saturn') {
                this.addSaturnRings(planet);
            }
            
            this.planets.push(planet);
            this.scene.add(planet);
        });
    }
    
    addSaturnRings(saturn) {
        const innerRadius = saturn.geometry.parameters.radius * 1.2;
        const outerRadius = saturn.geometry.parameters.radius * 2;
        
        const ringsGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
        
        const ringsTexture = loadTexture('https://www.solarsystemscope.com/textures/download/2k_saturn_ring_alpha.png');
        
        // Use a plain material without texture
        const ringsMaterial = new THREE.MeshBasicMaterial({
            color: 0xe6c9a8,       // Light tan/gold color
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6
        });
        
        const rings = new THREE.Mesh(ringsGeometry, ringsMaterial);
        rings.rotation.x = Math.PI / 2;
        saturn.add(rings);
    }
    
    createStarfield() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1,
            sizeAttenuation: false
        });
        
        const starsVertices = [];
        for (let i = 0; i < 10000; i++) {
            const x = random(-2000, 2000);
            const y = random(-2000, 2000);
            const z = random(-2000, 2000);
            starsVertices.push(x, y, z);
        }
        
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        
        this.starfield = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.starfield);
    }
    
    getCurrentPlanet() {
        return this.planets[this.currentPlanetIndex];
    }
    
    getCurrentDifficulty() {
        return this.planetData[this.currentPlanetIndex].difficulty;
    }
    
    nextPlanet() {
        if (this.currentPlanetIndex < this.planets.length - 1) {
            this.currentPlanetIndex++;
            return true;
        }
        return false; // No more planets, game completed
    }
    
    previousPlanet() {
        if (this.currentPlanetIndex > 0) {
            this.currentPlanetIndex--;
            return true;
        }
        return false; // Already at first planet
    }
    
    update() {
        // Rotate planets and update orbits
        this.planets.forEach(planet => {
            // Self rotation
            planet.rotation.y += planet.userData.rotationSpeed;
            
            // Orbit around the sun (except Mercury which is at the center)
            if (planet.userData.orbitRadius > 0) {
                planet.userData.orbitAngle += planet.userData.orbitSpeed;
                planet.position.x = Math.cos(planet.userData.orbitAngle) * planet.userData.orbitRadius;
                planet.position.z = Math.sin(planet.userData.orbitAngle) * planet.userData.orbitRadius;
            }
        });
        
        // Rotate sun
        this.sun.rotation.y += 0.001;
    }
    
    // Helper function to assign colors to planets
    getPlanetColor(planetName) {
        const colors = {
            'Mercury': 0xaaaaaa, // Grey
            'Venus': 0xf9c166,   // Tan
            'Earth': 0x2277ff,   // Blue
            'Mars': 0xdd4422,    // Red
            'Jupiter': 0xecbf8e, // Orange-ish
            'Saturn': 0xd6ba7b,  // Pale gold
            'Uranus': 0x97d8ec,  // Pale blue
            'Neptune': 0x4b70dd  // Dark blue
        };
        return colors[planetName] || 0xffffff;
    }
} 