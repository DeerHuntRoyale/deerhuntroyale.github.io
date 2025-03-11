function createEnvironment() {
    // Create terrain instead of flat ground
    createTerrain();
    
    // Create sky - change color to a clearer blue
    scene.background = new THREE.Color(0x87CEEB); // Sky blue color
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.002);
    
    // Moderate ambient light - not too bright, not too dark
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // Moderate ambient light
    scene.add(ambientLight);
    
    // Add hemisphere light for natural sky illumination (bright blue from sky, greenish from ground)
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x33aa33, 0.5);
    scene.add(hemisphereLight);
    
    // Add directional light (sun)
    const sunPosition = new THREE.Vector3(100, 150, 50);
    const sunLight = new THREE.DirectionalLight(0xffffcc, 1);
    sunLight.position.copy(sunPosition);
    
    // Soften shadows
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.radius = 2; // Soften shadow edges
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
    
    // Create trees positioned on terrain
    createTreesOnTerrain(100);
    
    // Create rocks positioned on terrain
    createRocksOnTerrain(50);
    
    // Add advertising blimps after clouds
    createBlimpsWithText(3);
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

function createTreesOnTerrain(count) {
    for (let i = 0; i < count; i++) {
        const x = Math.random() * 400 - 200;
        const z = Math.random() * 400 - 200;
        
        // Don't place trees too close to the player
        if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;
        
        // Get height at this position
        const y = getTerrainHeight(x, z);
        
        // Create tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
        const trunkMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x9E6B4A,
            emissive: 0x3E2B1A,
            emissiveIntensity: 0.1
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, y + 2.5, z); // Position on terrain
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        trunk.isCollidable = true;
        scene.add(trunk);
        
        // Create tree top
        const leavesGeometry = new THREE.ConeGeometry(3, 7, 8);
        const leavesMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x22AA22,
            emissive: 0x005500,
            emissiveIntensity: 0.1
        });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.set(x, y + 8, z); // Position on terrain
        leaves.castShadow = true;
        leaves.isCollidable = true;
        scene.add(leaves);
    }
}

function createRocksOnTerrain(count) {
    for (let i = 0; i < count; i++) {
        const x = Math.random() * 400 - 200;
        const z = Math.random() * 400 - 200;
        const size = Math.random() * 1 + 0.5;
        
        // Don't place rocks too close to the player
        if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;
        
        // Get height at this position
        const y = getTerrainHeight(x, z);
        
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
        
        rock.position.set(x, y + size / 2, z); // Position on terrain
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

function createBlimpsWithText(count) {
    // Create textures for different blimps
    const blimpTextures = [
        createBlimpTexture('Campbell\'s', 0xffff00, 0xaa0000), // Yellow on RED
        createBlimpTexture('Hunt Pro', 0xffffff, 0x006600),    // White on DARK GREEN
        createBlimpTexture('DeerhuntRoyale', 0xffff00, 0x0000aa)  // Yellow on BLUE
    ];
    
    for (let i = 0; i < count; i++) {
        // Create a blimp group
        const blimp = new THREE.Group();
        
        // Create the main blimp
        const bodyGeometry = new THREE.SphereGeometry(15, 32, 16);
        bodyGeometry.scale(2.5, 1, 1);
        
        // Apply solid color based on the background color from texture
        const bodyMaterial = new THREE.MeshLambertMaterial({ 
            color: blimpTextures[i].userData.bgColor,
            side: THREE.DoubleSide
        });
        
        const blimpBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        blimp.add(blimpBody);
        
        // Create TEXT PLANES that are much larger and more visible
        const textGeometry = new THREE.PlaneGeometry(40, 20); // LARGER text planes
        const textMaterial = new THREE.MeshBasicMaterial({
            map: blimpTextures[i],
            transparent: true,
            side: THREE.DoubleSide,
            depthTest: true // Re-enable depth test
        });
        
        // Left side text
        const leftText = new THREE.Mesh(textGeometry, textMaterial);
        leftText.position.set(0, 0, -8); // Position slightly outside the blimp
        leftText.rotation.y = Math.PI / 2;
        blimp.add(leftText);
        
        // Right side text (same)
        const rightText = new THREE.Mesh(textGeometry, textMaterial);
        rightText.position.set(0, 0, 8); // Position slightly outside the blimp
        rightText.rotation.y = -Math.PI / 2;
        blimp.add(rightText);
        
        // Position the blimp
        const angle = (i / count) * Math.PI * 2;
        const radius = 150;
        const height = 100;
        
        blimp.position.set(
            Math.sin(angle) * radius,
            height,
            Math.cos(angle) * radius
        );
        
        // Rotate to face center
        blimp.lookAt(0, blimp.position.y, 0);
        
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
    
    // Fill with TRANSPARENT background - this is key for seeing the text only
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Add HUGE, BOLD text
    context.fillStyle = new THREE.Color(textColor).getStyle();
    context.font = 'bold 200px Arial'; // MUCH larger text
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // Store color data for reference
    const texture = new THREE.CanvasTexture(canvas);
    texture.userData = { textColor: textColor, bgColor: bgColor };
    
    return texture;
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
            
            // Rotate to follow path - always face center
            blimp.lookAt(0, blimp.position.y, 0);
            
            // Very subtle wobble
            blimp.position.y += Math.sin(Date.now() * 0.001) * 0.05;
        });
    }
    
    // ... existing code ...
} 