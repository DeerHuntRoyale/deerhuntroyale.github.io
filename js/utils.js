// Utility functions for the game

// Clamp value between min and max
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// Generate a random number between min and max
function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

// Check if a point is within a radius of another point
function isPointInRadius(point1, point2, radius) {
    const dx = point1.x - point2.x;
    const dz = point1.z - point2.z;
    return (dx * dx + dz * dz) <= (radius * radius);
}

// Calculate distance between two points
function distanceBetween(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = point1.z - point2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Convert degrees to radians
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

// Convert radians to degrees
function radToDeg(radians) {
    return radians * 180 / Math.PI;
}

// Linear interpolation
function lerp(start, end, factor) {
    return start + (end - start) * factor;
}

// Get random position within a circle
function randomPositionInCircle(centerX, centerZ, radius) {
    const angle = Math.random() * Math.PI * 2;
    const distance = radius * Math.sqrt(Math.random());
    const x = centerX + Math.cos(angle) * distance;
    const z = centerZ + Math.sin(angle) * distance;
    return { x, z };
} 