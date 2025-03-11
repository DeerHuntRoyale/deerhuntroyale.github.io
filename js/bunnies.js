// Bunny creation and behavior

const bunnies = [];

function spawnBunny() {
    // Define bunny spawn boundaries (away from player)
    let x, z;
    do {
        x = Math.random() * 400 - 200;
        z = Math.random() * 400 - 200;
    } while (Math.sqrt(x*x + z*z) < 30); // Ensure bunny spawns at least 30 units away
    
    // Create bunny model
    const bunny = createBunnyModel();
    
    // Get terrain height at spawn position
    const y = getTerrainHeight(x, z);
    bunny.position.set(x, y, z);
    
    // Add bunny to scene and tracking array
    scene.add(bunny);
    
    // Store bunny data
    const bunnyData = {
        model: bunny,
        position: new THREE.Vector3(x, y, z),
        velocity: new THREE.Vector3(0, 0, 0),
        speed: 3 + Math.random() * 3, // Random speed between 3-6 (faster than deer)
        direction: Math.random() * Math.PI * 2, // Random direction
        state: 'idle', // idle, hopping, running
        lastStateChange: Date.now(),
        timers: {
            changeDirection: Math.random() * 3000 + 1000, // 1-4 seconds
            stateChange: Math.random() * 5000 + 2000, // 2-7 seconds
            hopDuration: 0
        },
        hopHeight: 0,
        isHopping: false,
        health: 30, // Lower health than deer
        isHarvestable: false,
        value: 5 // Lower value than deer
    };
    
    // Store reference on the model
    bunny.bunnyData = bunnyData;
    
    bunnies.push(bunnyData);
    
    return bunnyData;
}

function createBunnyModel() {
    const group = new THREE.Group();
    
    // Body - elongated sphere
    const bodyGeometry = new THREE.SphereGeometry(0.4, 12, 8);
    bodyGeometry.scale(1.5, 1, 1);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc }); // Light gray
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.4;
    group.add(body);
    
    // Head - sphere
    const headGeometry = new THREE.SphereGeometry(0.3, 12, 8);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xdddddd }); // Slightly lighter gray
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0.5, 0.7, 0);
    group.add(head);
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Black
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.7, 0.8, 0.15);
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.7, 0.8, -0.15);
    group.add(rightEye);
    
    // Ears - tall cones
    const earGeometry = new THREE.CylinderGeometry(0.05, 0.1, 0.4, 8);
    const earMaterial = new THREE.MeshLambertMaterial({ color: 0xdddddd }); // Slightly lighter gray
    
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(0.5, 1.1, 0.1);
    leftEar.rotation.x = -0.2;
    leftEar.rotation.z = -0.1;
    group.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(0.5, 1.1, -0.1);
    rightEar.rotation.x = 0.2;
    rightEar.rotation.z = -0.1;
    group.add(rightEar);
    
    // Legs - simple cylinders
    const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc }); // Light gray
    
    const legPositions = [
        [0.3, 0.2, 0.2],  // Front left
        [0.3, 0.2, -0.2], // Front right
        [-0.3, 0.2, 0.2],  // Back left
        [-0.3, 0.2, -0.2]  // Back right
    ];
    
    legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(pos[0], pos[1], pos[2]);
        group.add(leg);
    });
    
    // Tail - small sphere
    const tailGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const tailMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff }); // White
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(-0.8, 0.4, 0);
    group.add(tail);
    
    // Scale the entire bunny down - they're much smaller than deer
    group.scale.set(0.4, 0.4, 0.4);
    
    // Tag for identification and shooting
    group.isBunny = true;
    
    // Make all parts of the bunny shootable
    group.traverse(child => {
        if (child.isMesh) {
            child.isBunny = true;
            child.bunnyParent = group; // Reference back to the parent
        }
    });
    
    return group;
}

function updateBunnies(delta) {
    const currentTime = Date.now();
    
    bunnies.forEach(bunny => {
        // SKIP ALL UPDATES FOR DEAD BUNNIES
        if (bunny.state === 'dead') {
            // Only update the harvest indicator animation
            return;
        }
        
        // Check for state changes
        if (currentTime - bunny.lastStateChange > bunny.timers.stateChange) {
            changeBunnyState(bunny);
            bunny.lastStateChange = currentTime;
            bunny.timers.stateChange = Math.random() * 5000 + 2000; // 2-7 seconds
        }
        
        // Check for direction changes when idle or hopping
        if ((bunny.state === 'idle' || bunny.state === 'hopping') && 
            currentTime - bunny.lastStateChange > bunny.timers.changeDirection) {
            bunny.direction = Math.random() * Math.PI * 2;
            bunny.lastStateChange = currentTime;
            bunny.timers.changeDirection = Math.random() * 3000 + 1000; // 1-4 seconds
        }
        
        // Handle bunny behavior based on state
        switch (bunny.state) {
            case 'idle':
                // Simply update the position on the terrain
                updateBunnyPosition(bunny);
                break;
                
            case 'hopping':
                // Move in small hops
                if (!bunny.isHopping) {
                    startHop(bunny);
                }
                moveBunny(bunny, delta, bunny.speed * 0.5);
                updateHop(bunny, delta);
                break;
                
            case 'running':
                // Run fast
                if (!bunny.isHopping) {
                    startHop(bunny);
                }
                moveBunny(bunny, delta, bunny.speed);
                updateHop(bunny, delta);
                
                // Chance to change direction while running
                if (Math.random() < 0.05) {
                    bunny.direction += (Math.random() - 0.5) * Math.PI / 2;
                }
                break;
        }
        
        // Check if bunny is close to player
        const distanceToPlayer = bunny.position.distanceTo(player.position);
        
        if (distanceToPlayer < 10 && bunny.state !== 'running') {
            // Run away from player
            bunny.state = 'running';
            
            // Set direction away from player
            const awayVector = new THREE.Vector3()
                .subVectors(bunny.position, player.position)
                .normalize();
            
            bunny.direction = Math.atan2(awayVector.x, awayVector.z);
            bunny.lastStateChange = currentTime;
        }
    });
}

function changeBunnyState(bunny) {
    // Don't change state if bunny is dead
    if (bunny.state === 'dead') return;
    
    // Random state change with probabilities
    const rand = Math.random();
    
    if (bunny.state === 'idle') {
        if (rand < 0.7) bunny.state = 'hopping'; // Bunnies hop a lot
    } else if (bunny.state === 'hopping') {
        if (rand < 0.3) bunny.state = 'idle';
    } else if (bunny.state === 'running') {
        if (rand < 0.2) bunny.state = 'hopping';
    }
}

function startHop(bunny) {
    bunny.isHopping = true;
    bunny.hopHeight = 0;
    bunny.timers.hopDuration = 0;
}

function updateHop(bunny, delta) {
    // Don't hop if bunny is dead
    if (bunny.state === 'dead') return;
    
    // Progress the hop animation
    bunny.timers.hopDuration += delta;
    
    // Complete hop cycle in about 0.5 seconds
    const hopCycleDuration = bunny.state === 'running' ? 0.3 : 0.5;
    
    if (bunny.timers.hopDuration >= hopCycleDuration) {
        // End of hop cycle
        bunny.isHopping = false;
        bunny.model.position.y = bunny.position.y;
    } else {
        // During hop - move up and down in a sine wave
        const hopProgress = bunny.timers.hopDuration / hopCycleDuration;
        const hopFactor = Math.sin(hopProgress * Math.PI);
        const maxHopHeight = bunny.state === 'running' ? 0.5 : 0.3;
        
        bunny.model.position.y = bunny.position.y + hopFactor * maxHopHeight;
    }
}

function moveBunny(bunny, delta, speed) {
    // Don't move if bunny is dead
    if (bunny.state === 'dead') return;
    
    // Calculate movement vector
    const moveX = Math.sin(bunny.direction) * speed * delta;
    const moveZ = Math.cos(bunny.direction) * speed * delta;
    
    // Update position
    const newX = bunny.position.x + moveX;
    const newZ = bunny.position.z + moveZ;
    
    // Get terrain height
    const newY = getTerrainHeight(newX, newZ);
    
    // Check if slope is too steep (bunnies can climb better than players)
    const heightDifference = Math.abs(newY - bunny.position.y);
    const horizontalDistance = Math.sqrt(moveX * moveX + moveZ * moveZ);
    
    // If slope is climbable or going downhill
    if (horizontalDistance === 0 || heightDifference / horizontalDistance < 1.0) { // About 45 degrees
        bunny.position.set(newX, newY, newZ);
        
        // Update model position (horizontal only - vertical is handled by hop)
        bunny.model.position.x = bunny.position.x;
        bunny.model.position.z = bunny.position.z;
        
        // Set the rotation to face movement direction
        bunny.model.rotation.y = bunny.direction;
    } else {
        // Slope too steep, change direction
        bunny.direction += Math.PI / 2 + Math.random() * Math.PI; // 90-270 degree turn
    }
    
    // Boundary check - reverse direction if near edge
    if (Math.abs(bunny.position.x) > 200 || Math.abs(bunny.position.z) > 200) {
        bunny.direction += Math.PI;
    }
}

function updateBunnyPosition(bunny) {
    // Update the model position to match the bunny data position
    // Used in idle state or after movement
    bunny.model.position.copy(bunny.position);
}

// Spawn multiple bunnies
function spawnInitialBunnies(count) {
    for (let i = 0; i < count; i++) {
        spawnBunny();
    }
    console.log(`Spawned ${count} bunnies`);
}

// Add function to handle bunny death
function killBunny(bunny) {
    // Set state to dead - this will prevent any further updates
    bunny.state = 'dead';
    bunny.isHarvestable = true;
    
    // Rotate bunny to lying position
    bunny.model.rotation.z = Math.PI; // Roll onto back
    
    // Lower to ground
    bunny.model.position.y = bunny.position.y + 0.1;
    
    // Play death sound
    playSound('bunnyDeath');
    
    // Add harvesting indicator
    addHarvestIndicator(bunny);
    
    // Log the death to help with debugging
    console.log("Bunny killed and set to dead state");
}

// Add function to remove bunny
function removeBunny(bunny) {
    // Remove from scene
    scene.remove(bunny.model);
    
    // Remove from tracking array
    const index = bunnies.indexOf(bunny);
    if (index !== -1) {
        bunnies.splice(index, 1);
    }
}

// Harvesting function for bunnies
function harvestBunny(bunny) {
    // Remove harvest indicator
    if (bunny.harvestIndicator) {
        bunny.model.remove(bunny.harvestIndicator);
    }
    
    // Give player money
    score += bunny.value;
    updateScore();
    
    // Show harvest message
    showMessage(`Harvested bunny: +$${bunny.value}`);
    
    // Play sound
    playSound('harvest');
    
    // Mark as harvested
    bunny.isHarvestable = false;
    
    // Make the bunny disappear after a delay
    setTimeout(() => {
        removeBunny(bunny);
        // Spawn a new bunny somewhere else
        setTimeout(spawnBunny, 2000);
    }, 1000);
}

// Use the same harvest indicator as for deer
function addHarvestIndicator(bunny) {
    // Create floating text or icon above the bunny
    const indicatorGeometry = new THREE.SphereGeometry(0.2, 8, 8); // Smaller than deer
    const indicatorMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        transparent: true,
        opacity: 0.7
    });
    const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    
    // Position higher above the bunny - scaled to bunny size
    indicator.position.set(0, 2.0, 0);
    bunny.model.add(indicator);
    bunny.harvestIndicator = indicator;
    
    // Add animation
    animateHarvestIndicator(indicator);
}

// Animation function (reused from deer.js)
function animateHarvestIndicator(indicator) {
    const startY = indicator.position.y;
    const animateUp = () => {
        indicator.position.y = startY + Math.sin(Date.now() * 0.003) * 0.3;
        
        if (indicator.parent) { // Only continue if still in scene
            requestAnimationFrame(animateUp);
        }
    };
    
    animateUp();
} 