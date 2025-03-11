// Terrain generation and handling

// Store terrain data globally for access by player movement
let terrainGeometry;
let terrainHeightData;
let terrainSize = 1000;
let terrainResolution = 128; // Number of segments in the terrain grid
let terrainMaxHeight = 30; // Maximum height of hills

function createTerrain() {
    // Create a heightmap
    terrainHeightData = generateHeightmap(terrainResolution, terrainResolution);
    
    // Create geometry
    terrainGeometry = new THREE.PlaneGeometry(
        terrainSize, 
        terrainSize, 
        terrainResolution - 1, 
        terrainResolution - 1
    );
    
    // Apply height data to geometry
    const vertices = terrainGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        // Z is up in PlaneGeometry's local space, but we'll use y as up in world space
        const x = Math.floor((i / 3) % terrainResolution);
        const z = Math.floor((i / 3) / terrainResolution);
        vertices[i + 2] = terrainHeightData[z][x]; // Set y to height value
    }
    
    // Update normals for lighting
    terrainGeometry.computeVertexNormals();
    
    // Create material with darker grass
    const terrainMaterial = new THREE.MeshLambertMaterial({
        color: 0x227722,
        side: THREE.DoubleSide
    });
    
    // Create terrain mesh
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    terrain.receiveShadow = true;
    terrain.isCollidable = true;
    terrain.isTerrain = true; // Mark for special collision handling
    
    // Add to scene
    scene.add(terrain);
    
    return terrain;
}

function generateHeightmap(width, height) {
    // Create 2D array to store height data
    const heightmap = Array(height).fill().map(() => Array(width).fill(0));
    
    // Generate some random hills
    const numHills = 15;
    for (let i = 0; i < numHills; i++) {
        const hillX = Math.floor(Math.random() * width);
        const hillY = Math.floor(Math.random() * height);
        const hillRadius = 10 + Math.random() * 20;
        const hillHeight = 5 + Math.random() * terrainMaxHeight;
        
        addHill(heightmap, hillX, hillY, hillRadius, hillHeight);
    }
    
    // Add a large flat area near the center for player spawn
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const spawnRadius = 15;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const distSq = Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2);
            if (distSq < spawnRadius * spawnRadius) {
                heightmap[y][x] = 0; // Flat area for player spawn
            }
        }
    }
    
    // Smooth the heightmap
    smoothHeightmap(heightmap, 2);
    
    return heightmap;
}

function addHill(heightmap, centerX, centerY, radius, height) {
    const width = heightmap[0].length;
    const height2D = heightmap.length;
    
    for (let y = 0; y < height2D; y++) {
        for (let x = 0; x < width; x++) {
            const distSq = Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2);
            const dist = Math.sqrt(distSq);
            
            if (dist < radius) {
                // Use a cosine falloff for smooth hills
                const factor = 0.5 * (1 + Math.cos(Math.PI * dist / radius));
                heightmap[y][x] += height * factor;
            }
        }
    }
}

function smoothHeightmap(heightmap, iterations) {
    const width = heightmap[0].length;
    const height = heightmap.length;
    
    // Create temporary array for smoothing
    const tempMap = Array(height).fill().map(() => Array(width).fill(0));
    
    for (let iter = 0; iter < iterations; iter++) {
        // Copy current heightmap to temp
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                tempMap[y][x] = heightmap[y][x];
            }
        }
        
        // Smooth each point (except edges)
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                heightmap[y][x] = (
                    tempMap[y-1][x] + tempMap[y+1][x] + 
                    tempMap[y][x-1] + tempMap[y][x+1] + 
                    tempMap[y][x]
                ) / 5;
            }
        }
    }
}

// Get terrain height at a specific world position
function getTerrainHeight(x, z) {
    // Convert world coordinates to terrain grid coordinates
    const gridX = Math.floor(((x + terrainSize / 2) / terrainSize) * (terrainResolution - 1));
    const gridZ = Math.floor(((z + terrainSize / 2) / terrainSize) * (terrainResolution - 1));
    
    // Clamp to valid grid coordinates
    const clampedX = Math.max(0, Math.min(terrainResolution - 1, gridX));
    const clampedZ = Math.max(0, Math.min(terrainResolution - 1, gridZ));
    
    // Get height from heightmap
    return terrainHeightData[clampedZ][clampedX];
}

// Position an object on the terrain surface
function positionOnTerrain(object, x, z) {
    const height = getTerrainHeight(x, z);
    object.position.set(x, height, z);
    
    // Optional: Orient object to match terrain slope
    // This would require calculating the terrain normal at this position
} 