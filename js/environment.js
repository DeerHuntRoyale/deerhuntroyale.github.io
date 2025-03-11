function createEnvironment() {
    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x33aa33,
        side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    ground.isCollidable = true;
    scene.add(ground);
    
    // Create sky - change color to a clearer blue
    scene.background = new THREE.Color(0x87CEEB); // Sky blue color
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.002);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);
    
    // Add directional light (sun)
    const sunPosition = new THREE.Vector3(100, 150, 50);
    const sunLight = new THREE.DirectionalLight(0xffffcc, 1.2);
    sunLight.position.copy(sunPosition);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    scene.add(sunLight);
    
    // Create visible sun
    const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffff99,
        emissive: 0xffff00,
        emissiveIntensity: 1
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.copy(sunPosition);
    scene.add(sun);
    
    // Create a subtle glow effect for the sun
    const sunGlowGeometry = new THREE.SphereGeometry(15, 32, 32);
    const sunGlowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffff44,
        transparent: true,
        opacity: 0.3
    });
    const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    sunGlow.position.copy(sunPosition);
    scene.add(sunGlow);
    
    // Add clouds
    createClouds(10); // Just 10 clouds - not too many
    
    // Add trees
    createTrees(100);
    
    // Add rocks
    createRocks(50);
}

function createSkybox() {
    const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
    const skyboxMaterials = [
        new THREE.MeshBasicMaterial({ 
            map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/cube/skybox/px.jpg'), 
            side: THREE.BackSide 
        }),
        new THREE.MeshBasicMaterial({ 
            map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/cube/skybox/nx.jpg'), 
            side: THREE.BackSide 
        }),
        new THREE.MeshBasicMaterial({ 
            map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/cube/skybox/py.jpg'), 
            side: THREE.BackSide 
        }),
        new THREE.MeshBasicMaterial({ 
            map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/cube/skybox/ny.jpg'), 
            side: THREE.BackSide 
        }),
        new THREE.MeshBasicMaterial({ 
            map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/cube/skybox/pz.jpg'), 
            side: THREE.BackSide 
        }),
        new THREE.MeshBasicMaterial({ 
            map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/cube/skybox/nz.jpg'), 
            side: THREE.BackSide 
        })
    ];
    
    const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterials);
    scene.add(skybox);
}

function createTrees(count) {
    // Simple tree model
    for (let i = 0; i < count; i++) {
        const x = Math.random() * 400 - 200;
        const z = Math.random() * 400 - 200;
        
        // Don't place trees too close to the player
        if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;
        
        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, 2.5, z);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        trunk.isCollidable = true;
        scene.add(trunk);
        
        // Tree top (leaves)
        const leavesGeometry = new THREE.ConeGeometry(3, 7, 8);
        const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x005500 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.set(x, 8, z);
        leaves.castShadow = true;
        leaves.isCollidable = true;
        scene.add(leaves);
    }
}

function createRocks(count) {
    for (let i = 0; i < count; i++) {
        const x = Math.random() * 400 - 200;
        const z = Math.random() * 400 - 200;
        const size = Math.random() * 1 + 0.5;
        
        // Don't place rocks too close to the player
        if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;
        
        const rockGeometry = new THREE.DodecahedronGeometry(size, 0);
        const rockMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x888888,
            flatShading: true
        });
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        
        // Randomize rock rotation for variety
        rock.rotation.x = Math.random() * Math.PI;
        rock.rotation.y = Math.random() * Math.PI;
        rock.rotation.z = Math.random() * Math.PI;
        
        rock.position.set(x, size / 2, z);
        rock.castShadow = true;
        rock.receiveShadow = true;
        rock.isCollidable = true;
        scene.add(rock);
    }
}

function createCloudTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    
    // Create a radial gradient
    const gradient = context.createRadialGradient(
        64, 64, 0,    // Inner circle center and radius
        64, 64, 64    // Outer circle center and radius
    );
    
    // Add color stops
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');   // Center: solid white
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.8)'); // Mid: semi-transparent
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');   // Edge: transparent
    
    // Fill with gradient
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

function createClouds(count) {
    // Create a cloud texture
    const cloudTexture = createCloudTexture();
    
    for (let i = 0; i < count; i++) {
        // Random cloud size
        const size = Math.random() * 30 + 20;
        
        // Create cloud plane with transparent material
        const cloudGeometry = new THREE.PlaneGeometry(size, size);
        const cloudMaterial = new THREE.MeshBasicMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: Math.random() * 0.5 + 0.5, // Varying opacity
            depthWrite: false, // Prevents z-fighting between clouds
            side: THREE.DoubleSide
        });
        
        const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
        
        // Position clouds randomly in the sky
        const radius = Math.random() * 200 + 100; // Distance from center
        const angle = Math.random() * Math.PI * 2; // Random angle
        const height = Math.random() * 50 + 100; // Height above ground
        
        cloud.position.set(
            Math.sin(angle) * radius,
            height,
            Math.cos(angle) * radius
        );
        
        // Random rotation for variety
        cloud.rotation.z = Math.random() * Math.PI * 2;
        
        // Add drift animation data
        cloud.userData = {
            driftSpeed: Math.random() * 0.5 + 0.1,
            driftDirection: new THREE.Vector3(
                Math.random() * 2 - 1,
                0,
                Math.random() * 2 - 1
            ).normalize()
        };
        
        // Add cloud to scene
        scene.add(cloud);
        
        // Store reference for animation
        if (!window.clouds) window.clouds = [];
        window.clouds.push(cloud);
    }
}

// Add this to your animate function in main.js:
function animate(time) {
    // ... existing code ...
    
    // Animate clouds
    if (window.clouds) {
        window.clouds.forEach(cloud => {
            const speed = cloud.userData.driftSpeed * delta;
            const dir = cloud.userData.driftDirection;
            
            cloud.position.x += dir.x * speed;
            cloud.position.z += dir.z * speed;
            
            // If cloud drifts too far, reset its position on the opposite side
            const distanceFromCenter = Math.sqrt(
                cloud.position.x * cloud.position.x + 
                cloud.position.z * cloud.position.z
            );
            
            if (distanceFromCenter > 300) {
                const angle = Math.atan2(cloud.position.x, cloud.position.z);
                const newAngle = angle + Math.PI; // Opposite direction
                const radius = 250; // Reset distance
                
                cloud.position.x = Math.sin(newAngle) * radius;
                cloud.position.z = Math.cos(newAngle) * radius;
            }
        });
    }
    
    // ... existing code ...
} 