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
    
    // Add more clouds - 35 instead of 10
    createClouds(35);
    
    // Add trees
    createTrees(100);
    
    // Add rocks
    createRocks(50);
    
    // Add advertising blimps after clouds
    createBlimps(3); // Just a few blimps
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
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    // Create a more complex cloud texture with a less circular shape
    
    // Start with a white background with some transparency
    context.fillStyle = 'rgba(255, 255, 255, 0.1)';
    context.fillRect(0, 0, 256, 256);
    
    // Add several overlapping gradient circles to create a fluffy look
    const numCircles = 8;
    for (let i = 0; i < numCircles; i++) {
        // Random position near center
        const x = 128 + (Math.random() - 0.5) * 80;
        const y = 128 + (Math.random() - 0.5) * 60;
        
        // Random radius
        const radius = Math.random() * 60 + 40;
        
        // Create gradient
        const gradient = context.createRadialGradient(
            x, y, 0,
            x, y, radius
        );
        
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
    }
    
    // Create elongated gradient for more stretched cloud look
    const gradient = context.createLinearGradient(50, 128, 206, 128);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    context.fillStyle = gradient;
    context.fillRect(50, 98, 156, 60);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

function createClouds(count) {
    // Create a cloud texture
    const cloudTexture = createCloudTexture();
    
    for (let i = 0; i < count; i++) {
        // Create a cloud group (multiple planes for more realistic shape)
        const cloud = new THREE.Group();
        
        // Random cloud size
        const baseSize = Math.random() * 30 + 20;
        
        // Number of billboards per cloud (3-7)
        const numBillboards = Math.floor(Math.random() * 5) + 3;
        
        // Create multiple billboards for each cloud
        for (let j = 0; j < numBillboards; j++) {
            // Vary the size of each billboard 
            const size = baseSize * (0.6 + Math.random() * 0.8);
            
            // Create a cloud plane with transparent material
            const cloudGeometry = new THREE.PlaneGeometry(size, size * (0.6 + Math.random() * 0.4));
            const cloudMaterial = new THREE.MeshBasicMaterial({
                map: cloudTexture,
                transparent: true,
                opacity: Math.random() * 0.3 + 0.4, // Varying opacity
                depthWrite: false,
                side: THREE.DoubleSide
            });
            
            const cloudPart = new THREE.Mesh(cloudGeometry, cloudMaterial);
            
            // Position each billboard slightly offset from center
            cloudPart.position.set(
                (Math.random() - 0.5) * baseSize * 0.6,
                (Math.random() - 0.5) * baseSize * 0.2,
                (Math.random() - 0.5) * baseSize * 0.6
            );
            
            // Random rotation for variety
            cloudPart.rotation.z = Math.random() * Math.PI * 2;
            
            // Always face the camera
            cloudPart.lookAt(0, cloudPart.position.y, 0);
            
            // Add to cloud group
            cloud.add(cloudPart);
        }
        
        // Position clouds randomly in the sky
        const radius = Math.random() * 250 + 150; // Distance from center
        const angle = Math.random() * Math.PI * 2; // Random angle
        const height = Math.random() * 50 + 100; // Height above ground
        
        cloud.position.set(
            Math.sin(angle) * radius,
            height,
            Math.cos(angle) * radius
        );
        
        // Add drift animation data
        cloud.userData = {
            driftSpeed: Math.random() * 0.4 + 0.1,
            driftDirection: new THREE.Vector3(
                Math.random() * 2 - 1,
                0,
                Math.random() * 2 - 1
            ).normalize(),
            rotationSpeed: (Math.random() - 0.5) * 0.01 // Slow rotation
        };
        
        // Add cloud to scene
        scene.add(cloud);
        
        // Store reference for animation
        if (!window.clouds) window.clouds = [];
        window.clouds.push(cloud);
    }
}

function createBlimps(count) {
    // Create texture maps for each blimp
    const blimpTextures = [
        createBlimpTexture('Campbell\'s', 0xffff00, 0x0000aa), // Yellow on blue like Goodyear
        createBlimpTexture('Hunt Pro', 0xffffff, 0x008800),    // White on green
        createBlimpTexture('DeerhuntRoyale', 0xffff00, 0xaa0000)  // Yellow on red
    ];
    
    for (let i = 0; i < count; i++) {
        // Create a simple elongated sphere for the blimp
        const blimpGeometry = new THREE.SphereGeometry(15, 32, 16);
        blimpGeometry.scale(2.5, 1, 1);
        
        // Apply the texture to the blimp
        const blimpMaterial = new THREE.MeshLambertMaterial({
            map: blimpTextures[i % blimpTextures.length],
            side: THREE.DoubleSide
        });
        
        const blimp = new THREE.Mesh(blimpGeometry, blimpMaterial);
        
        // Position the blimp in the sky
        const angle = (i / count) * Math.PI * 2;
        const radius = 150;
        const height = 100;
        
        blimp.position.set(
            Math.sin(angle) * radius,
            height,
            Math.cos(angle) * radius
        );
        
        // Rotate blimp to be horizontal and point in the direction of movement
        blimp.rotation.y = angle + Math.PI / 2;
        
        // Add to scene
        scene.add(blimp);
        
        // Store for animation
        if (!window.blimps) window.blimps = [];
        window.blimps.push(blimp);
    }
}

function createBlimpTexture(text, textColor, bgColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    // Create a UV mapping for a sphere that puts the text on the sides
    
    // Fill the entire canvas with the background color
    context.fillStyle = new THREE.Color(bgColor).getStyle();
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add horizontal stripes like the Goodyear blimp
    context.fillStyle = new THREE.Color(textColor).getStyle();
    context.fillRect(0, 0, canvas.width, 20);  // Top stripe
    context.fillRect(0, canvas.height - 20, canvas.width, 20);  // Bottom stripe
    
    // Draw vertical lines at front and back
    context.fillRect(0, 0, 20, canvas.height);  // Front
    context.fillRect(canvas.width - 20, 0, 20, canvas.height);  // Back
    
    // Add text along the middle
    context.fillStyle = new THREE.Color(textColor).getStyle();
    context.font = 'bold 120px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Draw text in the middle section
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    return new THREE.CanvasTexture(canvas);
}

// Update animate function for more cloud effects
function animate(time) {
    // ... existing code ...
    
    // Animate clouds
    if (window.clouds) {
        window.clouds.forEach(cloud => {
            const speed = cloud.userData.driftSpeed * delta;
            const dir = cloud.userData.driftDirection;
            
            // Move cloud
            cloud.position.x += dir.x * speed;
            cloud.position.z += dir.z * speed;
            
            // Slowly rotate the cloud for more dynamic movement
            if (cloud.userData.rotationSpeed) {
                cloud.rotation.y += cloud.userData.rotationSpeed * delta;
            }
            
            // If cloud drifts too far, reset its position on the opposite side
            const distanceFromCenter = Math.sqrt(
                cloud.position.x * cloud.position.x + 
                cloud.position.z * cloud.position.z
            );
            
            if (distanceFromCenter > 350) {
                const angle = Math.atan2(cloud.position.x, cloud.position.z);
                const newAngle = angle + Math.PI; // Opposite direction
                const radius = 300; // Reset distance
                
                cloud.position.x = Math.sin(newAngle) * radius;
                cloud.position.z = Math.cos(newAngle) * radius;
            }
        });
    }
    
    // Animate blimps
    if (window.blimps && window.blimps.length > 0) {
        window.blimps.forEach(blimp => {
            const speed = 0.5 * delta;
            const currentAngle = Math.atan2(blimp.position.x, blimp.position.z);
            const newAngle = currentAngle + speed * 0.01;
            const radius = Math.sqrt(
                blimp.position.x * blimp.position.x + 
                blimp.position.z * blimp.position.z
            );
            
            blimp.position.x = Math.sin(newAngle) * radius;
            blimp.position.z = Math.cos(newAngle) * radius;
            
            // Rotate to follow path
            blimp.rotation.y = newAngle + Math.PI / 2;
            
            // Very subtle wobble
            blimp.position.y += Math.sin(Date.now() * 0.001) * 0.05;
        });
    }
    
    // ... existing code ...
} 