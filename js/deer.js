function spawnDeer() {
    // Define deer spawn boundaries (away from player)
    let x, z;
    do {
        x = Math.random() * 400 - 200;
        z = Math.random() * 400 - 200;
    } while (Math.sqrt(x*x + z*z) < 50); // Ensure deer spawns at least 50 units away
    
    // Create deer model
    const deer = createDeerModel();
    deer.position.set(x, 0, z);
    
    // Add deer to scene and tracking array
    scene.add(deer);
    
    // Store deer data
    const deerData = {
        model: deer,
        position: new THREE.Vector3(x, 0, z),
        velocity: new THREE.Vector3(0, 0, 0),
        speed: 2 + Math.random() * 2, // Random speed between 2-4
        direction: Math.random() * Math.PI * 2, // Random direction
        state: 'idle', // idle, running, alert
        health: 100,
        lastStateChange: Date.now(),
        timers: {
            changeDirection: Math.random() * 5000 + 2000, // 2-7 seconds
            stateChange: Math.random() * 10000 + 5000 // 5-15 seconds
        }
    };
    
    // Tag all parts of the deer for raycasting
    deer.traverse(child => {
        if (child.isMesh) {
            child.isDeer = true;
            child.deerData = deerData;
        }
    });
    
    deers.push(deerData);
    
    return deerData;
}

function removeDeer(deerData) {
    // Remove deer from scene
    scene.remove(deerData.model);
    
    // Remove from tracking array
    const index = deers.indexOf(deerData);
    if (index !== -1) {
        deers.splice(index, 1);
    }
}

function updateDeers(delta) {
    const currentTime = Date.now();
    
    deers.forEach(deer => {
        // Check for state changes
        if (currentTime - deer.lastStateChange > deer.timers.stateChange) {
            changeDeerState(deer);
            deer.lastStateChange = currentTime;
            deer.timers.stateChange = Math.random() * 10000 + 5000; // 5-15 seconds
        }
        
        // Check for direction changes when idle or alert
        if ((deer.state === 'idle' || deer.state === 'alert') && 
            currentTime - deer.lastStateChange > deer.timers.changeDirection) {
            deer.direction = Math.random() * Math.PI * 2;
            deer.lastStateChange = currentTime;
            deer.timers.changeDirection = Math.random() * 5000 + 2000; // 2-7 seconds
        }
        
        // Handle deer behavior based on state
        switch (deer.state) {
            case 'idle':
                // Slow wandering
                moveDeer(deer, delta, deer.speed * 0.3);
                break;
                
            case 'alert':
                // Look around but don't move much
                deer.model.rotation.y += Math.sin(currentTime * 0.001) * 0.02;
                break;
                
            case 'running':
                // Move faster
                moveDeer(deer, delta, deer.speed);
                
                // Chance to change direction while running
                if (Math.random() < 0.01) {
                    deer.direction += (Math.random() - 0.5) * Math.PI / 2;
                }
                break;
        }
        
        // Check if deer is close to player
        const distanceToPlayer = deer.position.distanceTo(player.position);
        
        if (distanceToPlayer < 20 && deer.state !== 'running') {
            // Run away from player
            deer.state = 'running';
            
            // Set direction away from player
            const awayVector = new THREE.Vector3()
                .subVectors(deer.position, player.position)
                .normalize();
            
            deer.direction = Math.atan2(awayVector.x, awayVector.z);
            deer.lastStateChange = currentTime;
        }
        
        // Update animation based on state
        updateDeerAnimation(deer, delta);
    });
}

function changeDeerState(deer) {
    // Random state change with probabilities
    const rand = Math.random();
    
    if (deer.state === 'idle') {
        if (rand < 0.3) deer.state = 'alert';
        else if (rand < 0.5) deer.state = 'running';
    } else if (deer.state === 'alert') {
        if (rand < 0.6) deer.state = 'idle';
        else if (rand < 0.8) deer.state = 'running';
    } else if (deer.state === 'running') {
        if (rand < 0.7) deer.state = 'idle';
    }
}

function moveDeer(deer, delta, speed) {
    // Calculate movement vector
    const moveX = Math.sin(deer.direction) * speed * delta;
    const moveZ = Math.cos(deer.direction) * speed * delta;
    
    // Update position
    deer.position.x += moveX;
    deer.position.z += moveZ;
    
    // Update model position and rotation
    deer.model.position.set(deer.position.x, deer.position.y, deer.position.z);
    deer.model.rotation.y = deer.direction;
    
    // Boundary check - reverse direction if near edge
    if (Math.abs(deer.position.x) > 200 || Math.abs(deer.position.z) > 200) {
        deer.direction += Math.PI;
    }
}

function updateDeerAnimation(deer, delta) {
    // This would be more sophisticated with actual animations
    // For now, we'll just do a simple bob up and down when moving
    
    if (deer.state === 'running') {
        deer.model.position.y = deer.position.y + Math.abs(Math.sin(Date.now() * 0.01)) * 0.2;
    } else if (deer.state === 'idle') {
        deer.model.position.y = deer.position.y;
    }
}

function createDeerModel() {
    const group = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.7, 0.7, 2, 8);
    bodyGeometry.rotateZ(Math.PI / 2);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.5;
    group.add(body);
    
    // Head
    const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 1);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(1.3, 2, 0);
    group.add(head);
    
    // Neck
    const neckGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.8, 8);
    neckGeometry.rotateX(Math.PI / 4);
    const neckMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const neck = new THREE.Mesh(neckGeometry, neckMaterial);
    neck.position.set(0.8, 1.8, 0);
    group.add(neck);
    
    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    const legPositions = [
        [-0.5, 0.75, 0.4],  // Front left
        [-0.5, 0.75, -0.4], // Front right
        [0.5, 0.75, 0.4],   // Back left
        [0.5, 0.75, -0.4]   // Back right
    ];
    
    legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(pos[0], pos[1], pos[2]);
        group.add(leg);
    });
    
    // Antlers (only for male deer)
    if (Math.random() > 0.5) {
        const antlerMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        
        // Left antler
        const leftAntler = createAntler();
        leftAntler.position.set(1.3, 2.5, 0.3);
        group.add(leftAntler);
        
        // Right antler
        const rightAntler = createAntler();
        rightAntler.position.set(1.3, 2.5, -0.3);
        group.add(rightAntler);
    }
    
    // Tail
    const tailGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const tailMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(-1.1, 1.5, 0);
    group.add(tail);
    
    return group;
}

function createAntler() {
    const group = new THREE.Group();
    
    // Main antler stem
    const stemGeometry = new THREE.CylinderGeometry(0.05, 0.1, 0.8, 8);
    stemGeometry.rotateX(-Math.PI / 8);
    const antlerMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
    const stem = new THREE.Mesh(stemGeometry, antlerMaterial);
    stem.position.set(0, 0.3, 0);
    group.add(stem);
    
    // Antler branches (random number of branches)
    const numBranches = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numBranches; i++) {
        const branchGeometry = new THREE.CylinderGeometry(0.03, 0.05, 0.4, 8);
        const angle = (i / numBranches) * Math.PI - Math.PI / 4;
        branchGeometry.rotateZ(angle);
        
        const branch = new THREE.Mesh(branchGeometry, antlerMaterial);
        branch.position.set(0, 0.5 + i * 0.2, 0);
        group.add(branch);
    }
    
    return group;
} 