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
let scopeCamera, scopeRenderTarget;
let scopeCrosshairTexture;
const SCOPE_ZOOM = 5;

// Global variables for scope mode
let inScopeMode = false;
let scopeZoomLevel = 5; // Starting zoom level
const MIN_ZOOM = 3;
const MAX_ZOOM = 10;
let originalCameraFOV; // Store original camera FOV
let scopeOverlayMaterial;
let scopeOverlayScene;
let scopeOverlayCamera;

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
    
    // Set up scope rendering
    setupScopeRendering();
    
    // Create and add rifle model after camera is initialized
    createPlayerRifle();
    
    // Set up scope mode
    setupScopeMode();
    
    // SIMPLIFIED CONTROLS
    document.addEventListener('keydown', (event) => {
        // E to toggle scope mode (enter/exit)
        if (event.key === 'e' || event.key === 'E') {
            toggleScopeMode();
            event.preventDefault(); // Prevent default behavior
            return; // Stop processing this event
        } 
        // R to zoom in (only when in scope mode)
        else if ((event.key === 'r' || event.key === 'R') && inScopeMode) {
            zoomScope(1);
        }
        // F to zoom out (only when in scope mode)
        else if ((event.key === 'f' || event.key === 'F') && inScopeMode) {
            zoomScope(-1);
        }
        
        // Harvesting with V can be handled in your existing control system
        // if (event.key === 'v' || event.key === 'V') {
        //     attemptToHarvest();
        // }
    });
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
    
    // Update scope view for new aspect ratio
    if (scopeOverlayMaterial) {
        scopeOverlayMaterial.uniforms.aspectRatio.value = window.innerWidth / window.innerHeight;
    }
    
    // Update scope render target
    if (scopeRenderTarget) {
        scopeRenderTarget.setSize(window.innerWidth, window.innerHeight);
    }
    
    // Update scope camera aspect ratio
    if (scopeCamera) {
        scopeCamera.aspect = window.innerWidth / window.innerHeight;
        scopeCamera.updateProjectionMatrix();
    }
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
    
    // Hide harvest prompt by default each frame
    hideHarvestPrompt();
    
    // Check if player can harvest any deer
    checkForHarvest();
    
    // Add subtle rifle sway when moving (optional)
    if (camera.children.length > 0 && (keys.w || keys.a || keys.s || keys.d)) {
        const rifleModel = camera.children[0];
        rifleModel.position.y = -0.2 + Math.sin(time * 0.01) * 0.01;
    }
    
    // Render based on current mode
    if (inScopeMode) {
        updateScopeView(); // Only update scope view when in scope mode
        renderer.render(scopeOverlayScene, scopeOverlayCamera);
    } else {
        // Regular game view with consistent FOV (no zoom)
        renderer.render(scene, camera);
    }
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

// Setup the scope rendering with improved crosshairs
function setupScopeRendering() {
    // Create a render target texture for the scope
    scopeRenderTarget = new THREE.WebGLRenderTarget(256, 256);
    
    // Create a camera specifically for the scope view
    scopeCamera = new THREE.PerspectiveCamera(75 / SCOPE_ZOOM, 1, 0.1, 1000);
    
    // Initial setup - will be updated every frame
    scopeCamera.position.copy(camera.position);
    scopeCamera.rotation.copy(camera.rotation);
    
    // Create a canvas for the crosshairs overlay
    setupCrosshairsOverlay();
}

// Modify only the crosshair texture to be more transparent
function setupCrosshairsOverlay() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas with fully transparent background
    ctx.clearRect(0, 0, 64, 64);
    
    // Draw crosshairs - MORE TRANSPARENT
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'; // 30% opacity
    ctx.lineWidth = 1;
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(16, 32);
    ctx.lineTo(48, 32);
    ctx.stroke();
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(32, 16);
    ctx.lineTo(32, 48);
    ctx.stroke();
    
    // Small circle at center
    ctx.beginPath();
    ctx.arc(32, 32, 2, 0, Math.PI * 2);
    ctx.stroke();
    
    // Create texture
    scopeCrosshairTexture = new THREE.CanvasTexture(canvas);
}

function createPlayerRifle() {
    // Create a rifle model
    const rifleGroup = new THREE.Group();
    
    // Basic rifle stock
    const stockGeometry = new THREE.BoxGeometry(0.12, 0.08, 0.6);
    const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.set(0, 0, 0.2);
    rifleGroup.add(stock);
    
    // Basic barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.04, -0.05);
    rifleGroup.add(barrel);
    
    // Define material first
    const mountMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    
    // Scope cylinder with mount material
    const scopeGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.15, 8);
    const scope = new THREE.Mesh(scopeGeometry, mountMaterial);
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.09, 0.15);
    rifleGroup.add(scope);
    
    // Basic scope lens showing the render target
    const lensGeometry = new THREE.CircleGeometry(0.021, 16);
    const lensMaterial = new THREE.MeshBasicMaterial({ 
        map: scopeRenderTarget.texture,
        side: THREE.DoubleSide
    });
    const lens = new THREE.Mesh(lensGeometry, lensMaterial);
    lens.position.set(0, 0.09, 0.226);
    lens.rotation.set(0, 0, 0);
    rifleGroup.add(lens);
    
    // Add crosshairs overlay
    const crosshairGeometry = new THREE.CircleGeometry(0.0226, 16);
    const crosshairMaterial = new THREE.MeshBasicMaterial({ 
        map: scopeCrosshairTexture,
        transparent: true,
        opacity: 1.0,
        side: THREE.DoubleSide,
        depthTest: false // Draw on top
    });
    const crosshair = new THREE.Mesh(crosshairGeometry, crosshairMaterial);
    crosshair.position.set(0, 0.09, 0.226); // Slightly in front of lens
    crosshair.rotation.set(0, 0, 0);
    rifleGroup.add(crosshair);
    
    // Simple scope mounts
    const mountGeometry = new THREE.BoxGeometry(0.03, 0.02, 0.03);
    
    const frontMount = new THREE.Mesh(mountGeometry, mountMaterial);
    frontMount.position.set(0, 0.065, 0.1);
    rifleGroup.add(frontMount);
    
    const rearMount = new THREE.Mesh(mountGeometry, mountMaterial);
    rearMount.position.set(0, 0.065, 0.2);
    rifleGroup.add(rearMount);
    
    // Position the rifle
    rifleGroup.position.set(0.3, -0.2, -0.5);
    
    // Add the rifle to the camera
    camera.add(rifleGroup);
    scene.add(camera);
}

// Updated function to render scope view with proper reset
function updateScopeView() {
    // Only update if we're in scope mode
    if (!inScopeMode) return;
    
    // Position the scope camera at the same position as the player camera
    scopeCamera.position.copy(camera.position);
    scopeCamera.rotation.copy(camera.rotation);
    
    // Apply zoom level to scope camera only
    scopeCamera.fov = camera.fov / scopeZoomLevel;
    scopeCamera.updateProjectionMatrix();
    
    // Hide the rifle temporarily to avoid recursive rendering
    let rifleVisible = false;
    if (camera.children.length > 0) {
        rifleVisible = camera.children[0].visible;
        camera.children[0].visible = false;
    }
    
    // Render the scene to the scope render target
    renderer.setRenderTarget(scopeRenderTarget);
    renderer.clear();
    renderer.render(scene, scopeCamera);
    renderer.setRenderTarget(null);
    
    // Restore rifle visibility (important for when we exit scope mode)
    if (camera.children.length > 0) {
        camera.children[0].visible = rifleVisible;
    }
}

function setupScopeMode() {
    // Create a render target for the zoomed view
    scopeRenderTarget = new THREE.WebGLRenderTarget(
        window.innerWidth, 
        window.innerHeight
    );
    
    // Create a camera for the scope view
    scopeCamera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );
    
    // Create a full-screen plane for the scope overlay
    const overlayGeometry = new THREE.PlaneGeometry(2, 2);
    
    // Create the scope overlay material with a much larger circle
    scopeOverlayMaterial = new THREE.ShaderMaterial({
        uniforms: {
            scopeTexture: { value: scopeRenderTarget.texture },
            aspectRatio: { value: window.innerWidth / window.innerHeight }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D scopeTexture;
            uniform float aspectRatio;
            varying vec2 vUv;
            
            void main() {
                // Center coordinates
                vec2 center = vec2(0.5, 0.5);
                
                // Adjust UV for aspect ratio to keep circle perfectly round
                vec2 adjustedUV = vUv;
                
                // Make a larger scope circle (80% of height)
                float scopeRadius = 0.4; // 40% of normalized space = 80% diameter
                
                // Calculate distance considering aspect ratio to keep it circular
                float dx = (adjustedUV.x - center.x) * aspectRatio;
                float dy = adjustedUV.y - center.y;
                float dist = sqrt(dx*dx + dy*dy);
                
                if (dist < scopeRadius) {
                    // Inside scope view - show the rendered texture
                    gl_FragColor = texture2D(scopeTexture, vUv);
                    
                    // Add crosshairs
                    float lineWidth = 0.001;
                    // Thicker at edges, thinner near center
                    float centerDist = dist / scopeRadius; // 0 at center, 1 at edge
                    lineWidth = mix(0.0005, 0.002, centerDist);
                    
                    // Horizontal line
                    if (abs(vUv.y - 0.5) < lineWidth) {
                        gl_FragColor = mix(gl_FragColor, vec4(0.0, 0.0, 0.0, 0.7), 0.7);
                    }
                    // Vertical line
                    if (abs(vUv.x - 0.5) < lineWidth) {
                        gl_FragColor = mix(gl_FragColor, vec4(0.0, 0.0, 0.0, 0.7), 0.7);
                    }
                    
                    // Small center dot
                    float centerSize = 0.002;
                    if (dist < centerSize) {
                        gl_FragColor = mix(gl_FragColor, vec4(0.0, 0.0, 0.0, 0.9), 0.9);
                    }
                    
                    // Scope edge - dark vignette around the edge
                    float edgeStart = scopeRadius * 0.95;
                    if (dist > edgeStart) {
                        float t = smoothstep(edgeStart, scopeRadius, dist);
                        gl_FragColor = mix(gl_FragColor, vec4(0.0, 0.0, 0.0, 1.0), t);
                    }
                } else {
                    // Outside scope - black vignette
                    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                }
            }
        `
    });
    
    // Create a separate scene and camera for rendering the scope overlay
    scopeOverlayScene = new THREE.Scene();
    scopeOverlayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    // Add the overlay plane to the scene
    const overlayPlane = new THREE.Mesh(overlayGeometry, scopeOverlayMaterial);
    scopeOverlayScene.add(overlayPlane);
}

function toggleScopeMode() {
    // Toggle scope mode state
    inScopeMode = !inScopeMode;
    
    if (inScopeMode) {
        // Entering scope mode
        console.log("Entering scope mode");
        
        // Store original camera FOV (now always 75 since we removed zoomLevel)
        originalCameraFOV = 75; // Using default FOV
        
        // Hide the rifle when in scope mode
        if (camera.children.length > 0) {
            camera.children[0].visible = false;
        }
    } else {
        // Exiting scope mode
        console.log("Exiting scope mode");
        
        // Restore original FOV
        camera.fov = originalCameraFOV;
        camera.updateProjectionMatrix();
        
        // Make rifle visible again
        if (camera.children.length > 0) {
            camera.children[0].visible = true;
        }
        
        // Reset scope zoom level for next time
        scopeZoomLevel = 5;
    }
}

// Function to increase/decrease scope zoom
function zoomScope(direction) {
    // Only allow zooming when in scope mode
    if (!inScopeMode) return;
    
    // Adjust zoom level
    scopeZoomLevel += direction;
    
    // Clamp zoom level
    if (scopeZoomLevel < MIN_ZOOM) scopeZoomLevel = MIN_ZOOM;
    if (scopeZoomLevel > MAX_ZOOM) scopeZoomLevel = MAX_ZOOM;
    
    console.log("Scope zoom level: " + scopeZoomLevel + "x");
}

// Initialize game
init(); 