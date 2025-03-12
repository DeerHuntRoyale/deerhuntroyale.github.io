let scene, camera, renderer;
let player, controls;
let deers = [];
let score = 0;
let ammo = 5;
let maxAmmo = 15;  // Increased max ammo capacity
let ammoPackSize = 5;  // How many bullets per purchase
let ammoCost = 10;  // Cost for a pack of ammo
let isGameActive = false;
let lastTime = 0;
let zoomLevel = 1;

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x88ccee, 0.002);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.7, 0); // Player eye height
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x88ccee); // Sky color
    renderer.shadowMap.enabled = true;
    document.getElementById('game-container').appendChild(renderer.domElement);
    
    // Setup player with initial position
    player = {
        position: new THREE.Vector3(0, 1.7, 0), // Initial position
        direction: new THREE.Vector3(0, 0, -1),
        speed: 5,
        turnSpeed: 0.002,
        canShoot: true,
        reloadTime: 1000,
    };
    
    // Initialize controls
    initControls();
    
    // Create environment (including terrain)
    createEnvironment();
    
    // Position player on terrain after terrain is created
    const terrainHeight = getTerrainHeight(0, 0);
    player.position.y = terrainHeight + 1.7; // Player eye height
    camera.position.copy(player.position);
    
    // Spawn initial deer
    for (let i = 0; i < 5; i++) {
        spawnDeer();
    }
    
    // Spawn MANY more bunnies
    spawnInitialBunnies(10);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
    
    // Start game
    document.getElementById('start-button').addEventListener('click', startGame);
    
    // Update ammo info text with current values
    document.querySelector('#start-screen p:nth-child(3)').textContent = 
        `Press P to purchase ${ammoPackSize} bullets for $${ammoCost}`;
    
    // Create harvest prompt element
    const harvestPrompt = document.createElement('div');
    harvestPrompt.id = 'harvest-prompt';
    harvestPrompt.textContent = 'Press F to harvest';
    harvestPrompt.style.position = 'absolute';
    harvestPrompt.style.bottom = '50%';
    harvestPrompt.style.left = '50%';
    harvestPrompt.style.transform = 'translate(-50%, 50%)';
    harvestPrompt.style.color = 'white';
    harvestPrompt.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    harvestPrompt.style.padding = '10px';
    harvestPrompt.style.borderRadius = '5px';
    harvestPrompt.style.display = 'none';
    document.getElementById('game-container').appendChild(harvestPrompt);
    
    // Create and add rifle model after camera is initialized
    createPlayerRifle();
}

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    isGameActive = true;
    
    // Lock pointer only after the game has started
    renderer.domElement.requestPointerLock = renderer.domElement.requestPointerLock || 
                                           renderer.domElement.mozRequestPointerLock ||
                                           renderer.domElement.webkitRequestPointerLock;
    renderer.domElement.requestPointerLock();
    
    // Start animation loop
    animate(0);
    
    // Update UI
    updateScore();
    updateAmmo();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateScore() {
    document.getElementById('score').textContent = `$${score}`;
}

function updateAmmo() {
    document.getElementById('ammo').textContent = `Ammo: ${ammo}/${maxAmmo}`;
}

function buyAmmo() {
    if (!isGameActive) return;
    
    // Check if player has enough money
    if (score >= ammoCost) {
        // Check if player has room for more ammo
        if (ammo < maxAmmo) {
            // Deduct cost
            score -= ammoCost;
            updateScore();
            
            // Add ammo pack
            ammo = Math.min(maxAmmo, ammo + ammoPackSize);
            updateAmmo();
            
            // Show purchase message
            showMessage(`Purchased ${ammoPackSize} bullets!`);
        } else {
            // Show max ammo message
            showMessage(`Ammo full! Max: ${maxAmmo}`);
        }
    } else {
        // Show insufficient funds message
        showMessage(`Not enough money! Need $${ammoCost}`);
    }
}

function showMessage(text) {
    const message = document.getElementById('message');
    message.textContent = text;
    message.style.opacity = 1;
    
    // Fade out after 2 seconds
    setTimeout(() => {
        message.style.opacity = 0;
    }, 2000);
}

function shoot() {
    if (!isGameActive || !player.canShoot || ammo <= 0) return;
    
    ammo--;
    updateAmmo();
    
    // Play gunshot sound
    playSound('gunshot');
    
    // Create muzzle flash effect
    createMuzzleFlash();
    
    // Raycasting to check for hits
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    const hits = raycaster.intersectObjects(scene.children, true);
    
    for (let i = 0; i < hits.length; i++) {
        const hit = hits[i];
        
        // Check if we hit a deer
        if (hit.object.isDeer) {
            // Handle deer hit
            handleDeerHit(hit.object.deerData);
            break;
        }
        
        // Check if we hit a bunny
        if (hit.object.isBunny) {
            // Get the bunny data from either the hit object or its parent
            const bunnyData = hit.object.bunnyData || hit.object.bunnyParent.bunnyData;
            
            // Only handle hit if bunny exists and is not already dead
            if (bunnyData && bunnyData.state !== 'dead') {
                handleBunnyHit(bunnyData);
                break;
            }
        }
    }
    
    // Set shooting cooldown
    player.canShoot = false;
    setTimeout(() => {
        player.canShoot = true;
    }, player.reloadTime);
}

function handleDeerHit(deer) {
    // Play hit sound
    playSound('deerHit');
    
    // Kill the deer instead of removing it
    killDeer(deer);
}

function handleBunnyHit(bunny) {
    // Play hit sound
    playSound('bunnyHit');
    
    // Kill the bunny
    killBunny(bunny);
}

function reload() {
    if (ammo < maxAmmo) {
        // Play reload sound
        playSound('reload');
        
        ammo = maxAmmo;
        updateAmmo();
    }
}

function playSound(soundName) {
    // Implement sound playing logic
    console.log(`Playing sound: ${soundName}`);
}

function createMuzzleFlash() {
    // Create a temporary light for muzzle flash
    const flashLight = new THREE.PointLight(0xffaa00, 3, 10);
    flashLight.position.set(
        camera.position.x + camera.getWorldDirection(new THREE.Vector3()).x * 2,
        camera.position.y + camera.getWorldDirection(new THREE.Vector3()).y * 2,
        camera.position.z + camera.getWorldDirection(new THREE.Vector3()).z * 2
    );
    scene.add(flashLight);
    
    // Remove the flash after a short delay
    setTimeout(() => {
        scene.remove(flashLight);
    }, 100);
}

function animate(time) {
    if (!isGameActive) return;
    
    requestAnimationFrame(animate);
    
    const delta = (time - lastTime) / 1000;
    lastTime = time;
    
    // Update deer movement
    updateDeers(delta);
    
    // Update bunny movement
    updateBunnies(delta);
    
    // Update player movement and camera
    updateControls(delta);
    
    // Apply camera zoom
    camera.fov = 75 / zoomLevel;
    camera.updateProjectionMatrix();
    
    // Hide harvest prompt by default each frame
    hideHarvestPrompt();
    
    // Check if player can harvest any deer
    checkForHarvest();
    
    // Add subtle rifle sway when moving (optional)
    if (camera.children.length > 0 && (keys.w || keys.a || keys.s || keys.d)) {
        const rifleModel = camera.children[0];
        rifleModel.position.y = -0.2 + Math.sin(time * 0.01) * 0.01;
    }
    
    // Render scene
    renderer.render(scene, camera);
}

// Show and hide harvest prompt
function showHarvestPrompt() {
    document.getElementById('harvest-prompt').style.display = 'block';
}

function hideHarvestPrompt() {
    document.getElementById('harvest-prompt').style.display = 'none';
}

// Add bunny check to the harvest function
function checkForHarvest() {
    if (!isGameActive) return;
    
    // Check deer
    deers.forEach(deer => {
        if (deer.isHarvestable) {
            // Calculate distance between player and deer
            const distance = deer.position.distanceTo(player.position);
            
            // If close enough, show harvest prompt
            if (distance < 3) {
                showHarvestPrompt();
                
                // If player presses harvest key (F)
                if (keys.f) {
                    harvestDeer(deer);
                    keys.f = false; // Reset to prevent multiple harvests
                }
            }
        }
    });
    
    // Check bunnies
    bunnies.forEach(bunny => {
        if (bunny.isHarvestable) {
            // Calculate distance between player and bunny
            const distance = bunny.position.distanceTo(player.position);
            
            // If close enough, show harvest prompt
            if (distance < 3) {
                showHarvestPrompt();
                
                // If player presses harvest key (F)
                if (keys.f) {
                    harvestBunny(bunny);
                    keys.f = false; // Reset to prevent multiple harvests
                }
            }
        }
    });
}

// Add this new function to create the rifle
function createPlayerRifle() {
    // Create a rifle model
    const rifleGroup = new THREE.Group();
    
    // Rifle stock (wooden part) - make longer to extend toward player
    const stockGeometry = new THREE.BoxGeometry(0.12, 0.08, 0.6); // Increased length from 0.4 to 0.6
    const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown wooden color
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.set(0, 0, 0.2); // Moved backward (toward player) from 0.1 to 0.2
    rifleGroup.add(stock);
    
    // Rifle barrel (metal part) - extended length and repositioned
    const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.7, 8); // Increased length from 0.6 to 0.7
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 }); // Dark metal color
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.04, -0.2); // Adjusted z position from -0.25 to -0.2
    rifleGroup.add(barrel);
    
    // Rifle scope - moved further back as requested
    const scopeGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.15, 8);
    const scopeMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 }); // Black color
    const scope = new THREE.Mesh(scopeGeometry, scopeMaterial);
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.09, 0.05); // Moved backward from -0.1 to 0.05
    rifleGroup.add(scope);
    
    // Add scope mounts (small connections between scope and rifle)
    const mountGeometry = new THREE.BoxGeometry(0.03, 0.02, 0.03);
    const mountMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 }); // Dark metal color
    
    const frontMount = new THREE.Mesh(mountGeometry, mountMaterial);
    frontMount.position.set(0, 0.065, 0);
    rifleGroup.add(frontMount);
    
    const rearMount = new THREE.Mesh(mountGeometry, mountMaterial);
    rearMount.position.set(0, 0.065, 0.1);
    rifleGroup.add(rearMount);
    
    // Position the rifle in the bottom-right corner of the camera view
    rifleGroup.position.set(0.3, -0.2, -0.5);
    
    // Add the rifle to the camera so it moves with the view
    camera.add(rifleGroup);
    
    // Make sure the scene includes the camera for proper rendering
    scene.add(camera);
}

// Initialize game
init(); 