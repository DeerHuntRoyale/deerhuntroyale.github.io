let scene, camera, renderer;
let player, controls;
let deers = [];
let score = 0;
let ammo = 5;
let maxAmmo = 5;
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
    
    // Setup player and controls
    player = {
        position: new THREE.Vector3(0, 1.7, 0),
        direction: new THREE.Vector3(0, 0, -1),
        speed: 5, // Movement speed
        turnSpeed: 0.002, // Mouse sensitivity
        canShoot: true,
        reloadTime: 1000, // Reload time in ms
    };
    
    // Initialize controls
    initControls();
    
    // Create environment
    createEnvironment();
    
    // Spawn initial deer
    for (let i = 0; i < 5; i++) {
        spawnDeer();
    }
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
    
    // Start game
    document.getElementById('start-button').addEventListener('click', startGame);
}

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    isGameActive = true;
    
    // Lock pointer
    renderer.domElement.requestPointerLock = renderer.domElement.requestPointerLock || 
                                             renderer.domElement.mozRequestPointerLock ||
                                             renderer.domElement.webkitRequestPointerLock;
    renderer.domElement.requestPointerLock();
    
    // Start animation loop
    animate(0);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateScore() {
    document.getElementById('score').textContent = `Score: ${score}`;
}

function updateAmmo() {
    document.getElementById('ammo').textContent = `Ammo: ${ammo}/${maxAmmo}`;
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
    }
    
    // Set shooting cooldown
    player.canShoot = false;
    setTimeout(() => {
        player.canShoot = true;
    }, player.reloadTime);
}

function handleDeerHit(deer) {
    // Increase score
    score += 10;
    updateScore();
    
    // Play hit sound
    playSound('deerHit');
    
    // Remove deer and spawn a new one
    removeDeer(deer);
    setTimeout(spawnDeer, 2000);
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
    
    // Update player movement and camera
    updateControls(delta);
    
    // Apply camera zoom
    camera.fov = 75 / zoomLevel;
    camera.updateProjectionMatrix();
    
    // Render scene
    renderer.render(scene, camera);
}

// Initialize game
init(); 