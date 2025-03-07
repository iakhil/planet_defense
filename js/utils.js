// Utility functions for the game

// Convert degrees to radians
const degToRad = (degrees) => {
    return degrees * (Math.PI / 180);
};

// Random number between min and max
const random = (min, max) => {
    return Math.random() * (max - min) + min;
};

// Random integer between min and max (inclusive)
const randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Calculate distance between two 3D points
const distance = (point1, point2) => {
    return Math.sqrt(
        Math.pow(point2.x - point1.x, 2) +
        Math.pow(point2.y - point1.y, 2) +
        Math.pow(point2.z - point1.z, 2)
    );
};

// Load texture
const loadTexture = (path) => {
    return new THREE.TextureLoader().load(path);
}; 