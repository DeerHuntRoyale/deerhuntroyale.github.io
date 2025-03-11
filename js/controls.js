const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    shift: false,
    r: false,
    q: false,  // Zoom out
    e: false,  // Zoom in
    p: false   // Purchase ammo
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
            case 'q': 
                keys.q = true; 
                zoomOut();
                break;
            case 'e': 
                keys.e = true; 
                zoomIn();
                break;
            case 'p':
                keys.p = true;
                buyAmmo();
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
            case 'q': keys.q = false; break;
            case 'e': keys.e = false; break;
            case 'p': keys.p = false; break;
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
    
    // Handle trackpad/mouse wheel zoom
    const zoomDelta = -event.deltaY * 0.001;
    zoomLevel = Math.max(1, Math.min(3, zoomLevel + zoomDelta));
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
        
        // Check collision before moving
        if (!checkCollision(moveDirection, moveDistance)) {
            player.position.x += moveDirection.x * moveDistance;
            player.position.z += moveDirection.z * moveDistance;
            
            // Update camera position
            camera.position.x = player.position.x;
            camera.position.z = player.position.z;
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
    
    const collisionObjects = scene.children.filter(obj => obj.isCollidable);
    const intersects = raycaster.intersectObjects(collisionObjects, true);
    
    return intersects.length > 0;
}

function zoomIn() {
    if (!isGameActive) return;
    zoomLevel = Math.min(3, zoomLevel + 0.1);
}

function zoomOut() {
    if (!isGameActive) return;
    zoomLevel = Math.max(1, zoomLevel - 0.1);
} 