const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    shift: false,
    r: false,
    p: false,  // Purchase ammo
    f: false,   // Harvest deer
    e: false,   // Toggle scope mode
    v: false    // New harvest key
};

let isPointerLocked = false;
let mouseX = 0, mouseY = 0;
let touchZoomDistance = 0;

function initControls() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        switch (e.key.toLowerCase()) {
            case 'w': keys.w = true; break;
            case 'a': keys.a = true; break;
            case 's': keys.s = true; break;
            case 'd': keys.d = true; break;
            case ' ': 
                keys.space = true; 
                shoot();
                break;
            case 'shift': keys.shift = true; break;
            case 'r': 
                keys.r = true;
                reload();
                break;
            case 'p':
                keys.p = true;
                buyAmmo();
                break;
            case 'f':
                keys.f = true;
                break;
            case 'v':
                keys.v = true;
                // Handle harvest
                break;
            case 'e':
                keys.e = true;
                // E is now handled in main.js for scope mode
                break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch (e.key.toLowerCase()) {
            case 'w': keys.w = false; break;
            case 'a': keys.a = false; break;
            case 's': keys.s = false; break;
            case 'd': keys.d = false; break;
            case ' ': keys.space = false; break;
            case 'shift': keys.shift = false; break;
            case 'r': keys.r = false; break;
            case 'p': keys.p = false; break;
            case 'f': keys.f = false; break;
            case 'v': keys.v = false; break;
            case 'e': keys.e = false; break;
        }
    });

    // Mouse controls
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    
    // Pointer lock change
    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('mozpointerlockchange', onPointerLockChange);
    document.addEventListener('webkitpointerlockchange', onPointerLockChange);
    
    // Touch/trackpad controls
    renderer.domElement.addEventListener('touchstart', onTouchStart);
    renderer.domElement.addEventListener('touchmove', onTouchMove);
    renderer.domElement.addEventListener('touchend', onTouchEnd);
    
    // Zoom controls (trackpad)
    renderer.domElement.addEventListener('wheel', onWheel);

    // Prevent pinch zoom on the entire document
    document.addEventListener('gesturestart', function(event) {
        event.preventDefault();
    });
    
    document.addEventListener('gesturechange', function(event) {
        event.preventDefault();
    });
    
    document.addEventListener('gestureend', function(event) {
        event.preventDefault();
    });
}

function onPointerLockChange() {
    isPointerLocked = (
        document.pointerLockElement === renderer.domElement ||
        document.mozPointerLockElement === renderer.domElement ||
        document.webkitPointerLockElement === renderer.domElement
    );
}

function onMouseMove(event) {
    if (!isPointerLocked || !isGameActive) return;
    
    // Get mouse movement
    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
    
    // Update camera rotation (non-inverted)
    camera.rotation.y -= movementX * player.turnSpeed;
    
    // Limit vertical rotation to prevent flipping
    camera.rotation.x -= movementY * player.turnSpeed;
    camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
    
    // Update player direction
    player.direction.set(0, 0, -1).applyQuaternion(camera.quaternion);
}

function onMouseDown(event) {
    // Only request pointer lock if the game is active
    if (isGameActive && !isPointerLocked) {
        renderer.domElement.requestPointerLock();
    }
    
    if (event.button === 0 && isGameActive) { // Left click and game is active
        shoot();
    }
}

function onTouchStart(event) {
    // Prevent default zoom behavior
    if (event.touches.length === 2) {
        event.preventDefault();
        
        // Start pinch zoom
        const dx = event.touches[0].pageX - event.touches[1].pageX;
        const dy = event.touches[0].pageY - event.touches[1].pageY;
        touchZoomDistance = Math.sqrt(dx * dx + dy * dy);
    }
}

function onTouchMove(event) {
    // Prevent default zoom behavior
    if (event.touches.length === 2) {
        event.preventDefault();
        
        // Handle pinch zoom
        const dx = event.touches[0].pageX - event.touches[1].pageX;
        const dy = event.touches[0].pageY - event.touches[1].pageY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const zoomDelta = (distance - touchZoomDistance) * 0.01;
        touchZoomDistance = distance;
        
        zoomLevel = Math.max(1, Math.min(3, zoomLevel + zoomDelta));
    } else if (event.touches.length === 1) {
        // Handle camera rotation
        const touch = event.touches[0];
        
        if (mouseX && mouseY) {
            const movementX = touch.pageX - mouseX;
            const movementY = touch.pageY - mouseY;
            
            camera.rotation.y -= movementX * player.turnSpeed * 0.5;
            camera.rotation.x -= movementY * player.turnSpeed * 0.5;
            camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
            
            player.direction.set(0, 0, -1).applyQuaternion(camera.quaternion);
        }
        
        mouseX = touch.pageX;
        mouseY = touch.pageY;
    }
}

function onTouchEnd(event) {
    if (event.touches.length < 2) {
        touchZoomDistance = 0;
    }
    
    if (event.touches.length === 0) {
        mouseX = 0;
        mouseY = 0;
    }
}

function onWheel(event) {
    // Prevent default zoom behavior
    event.preventDefault();
}

function updateControls(delta) {
    // Calculate speed (sprint if shift is pressed)
    const speed = keys.shift ? player.speed * 1.5 : player.speed;
    
    // Get camera direction vectors
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.y = 0; // Keep movement on the horizontal plane
    forward.normalize();
    
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    right.y = 0;
    right.normalize();
    
    // Calculate movement direction
    const moveDirection = new THREE.Vector3(0, 0, 0);
    
    if (keys.w) moveDirection.add(forward);
    if (keys.s) moveDirection.sub(forward);
    if (keys.a) moveDirection.sub(right);
    if (keys.d) moveDirection.add(right);
    
    if (moveDirection.length() > 0) {
        moveDirection.normalize();
        
        // Move player
        const moveDistance = speed * delta;
        
        // Calculate new position
        const newX = player.position.x + moveDirection.x * moveDistance;
        const newZ = player.position.z + moveDirection.z * moveDistance;
        
        // Get current and new terrain heights
        const currentHeight = getTerrainHeight(player.position.x, player.position.z);
        const newHeight = getTerrainHeight(newX, newZ);
        
        // Check collision with objects (trees, rocks)
        const hasCollision = checkCollision(moveDirection, moveDistance);
        
        // MUCH MORE PERMISSIVE SLOPE HANDLING:
        
        // 1. Allow going downhill without restriction
        const goingDownhill = newHeight <= currentHeight;
        
        // 2. For uphill, check the slope angle
        let canClimb = true;
        if (!goingDownhill) {
            const heightDifference = newHeight - currentHeight;
            const horizontalDistance = Math.sqrt(
                Math.pow(newX - player.position.x, 2) + 
                Math.pow(newZ - player.position.z, 2)
            );
            
            const slopeAngle = Math.atan2(heightDifference, horizontalDistance);
            const maxClimbAngle = Math.PI / 4; // 45 degrees - exactly as requested
            
            canClimb = slopeAngle <= maxClimbAngle;
            
            // DEBUG - log when we can't climb
            if (!canClimb) {
                console.log(`Slope too steep: ${(slopeAngle * 180 / Math.PI).toFixed(1)} degrees`);
            }
        }
        
        // Move if no collision and we can climb the slope
        if (!hasCollision && (goingDownhill || canClimb)) {
            // Update player position
            player.position.x = newX;
            player.position.z = newZ;
            
            // Update player height based on terrain
            player.position.y = newHeight + 1.7; // Player eye height above terrain
            
            // Update camera position
            camera.position.copy(player.position);
        }
    }
}

function checkCollision(direction, distance) {
    // Simple collision detection
    const raycaster = new THREE.Raycaster(
        player.position.clone(),
        direction.clone(),
        0,
        distance + 0.5 // Add a small buffer
    );
    
    // Only check collision with objects, not terrain
    const collisionObjects = scene.children.filter(obj => 
        obj.isCollidable && !obj.isTerrain
    );
    const intersects = raycaster.intersectObjects(collisionObjects, true);
    
    return intersects.length > 0;
}

function getTerrainHeight(x, z) {
    // Convert world coordinates to terrain grid coordinates
    const terrainX = (x + terrainSize / 2) / terrainSize * (terrainResolution - 1);
    const terrainZ = (z + terrainSize / 2) / terrainSize * (terrainResolution - 1);
    
    // Get the four grid points surrounding this position
    const x1 = Math.floor(terrainX);
    const x2 = Math.ceil(terrainX);
    const z1 = Math.floor(terrainZ);
    const z2 = Math.ceil(terrainZ);
    
    // Clamp to valid grid coordinates
    const clampedX1 = Math.max(0, Math.min(terrainResolution - 1, x1));
    const clampedX2 = Math.max(0, Math.min(terrainResolution - 1, x2));
    const clampedZ1 = Math.max(0, Math.min(terrainResolution - 1, z1));
    const clampedZ2 = Math.max(0, Math.min(terrainResolution - 1, z2));
    
    // If we're exactly on a grid point, just return that height
    if (clampedX1 === clampedX2 && clampedZ1 === clampedZ2) {
        return terrainHeightData[clampedZ1][clampedX1];
    }
    
    // Get the heights at the four corners
    const h00 = terrainHeightData[clampedZ1][clampedX1];
    const h10 = terrainHeightData[clampedZ1][clampedX2];
    const h01 = terrainHeightData[clampedZ2][clampedX1];
    const h11 = terrainHeightData[clampedZ2][clampedX2];
    
    // Calculate the weights for bilinear interpolation
    const xWeight = terrainX - clampedX1;
    const zWeight = terrainZ - clampedZ1;
    
    // Perform bilinear interpolation
    const top = h00 * (1 - xWeight) + h10 * xWeight;
    const bottom = h01 * (1 - xWeight) + h11 * xWeight;
    const height = top * (1 - zWeight) + bottom * zWeight;
    
    return height;
}

function generateHeightmap(width, height) {
    console.log("Generating heightmap...");
    
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
    
    console.log("Heightmap generation complete!");
    return heightmap;
} 