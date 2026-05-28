class Environment {
  constructor(scene) {
    this.scene = scene;
    this.speed = 0.5; // Default speed, can be increased

    this.trees = [];
    this.treeGroup = new THREE.Group();
    this.scene.add(this.treeGroup);

    this.houses = [];
    this.houseGroup = new THREE.Group();
    this.scene.add(this.houseGroup);

    this.birds = [];
    this.birdGroup = new THREE.Group();
    this.scene.add(this.birdGroup);

    // Ground setup - simple scrolling plane with grid/stripes to convey speed
    const groundGeo = new THREE.PlaneGeometry(100, 1000, 10, 100);
    
    // Create a material that looks a bit retro/vibrant
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1e4a21, // Forest green grass
      wireframe: true, 
      emissive: 0x0a1e0b // Deep green glow
    });

    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.z = -400; // Stretch far back
    this.scene.add(this.ground);

    // Add an ambient light and directional light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffcc88, 0.8);
    dirLight.position.set(20, 50, -20);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    // Fog to fade out distance matching the forest green background
    this.scene.fog = new THREE.Fog(0x2d4c1e, 40, 180);

    this.isTransitioning = false;
    this.targetFogColor = new THREE.Color(0x2d4c1e);
    this.targetGroundColor = new THREE.Color(0x1e4a21);

    this.createTrees();
    this.createHouses();
    this.createBirds();
  }

  createBird() {
    const bird = new THREE.Group();
    
    const mat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    
    // Left wing
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.2), mat);
    wingL.position.set(-0.4, 0, 0);
    wingL.rotation.z = Math.PI / 6; // Angle up
    bird.add(wingL);

    // Right wing
    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.2), mat);
    wingR.position.set(0.4, 0, 0);
    wingR.rotation.z = -Math.PI / 6;
    bird.add(wingR);

    // Give it a random flying speed logic attached to object
    bird.userData = {
      flySpeed: 0.05 + Math.random() * 0.05,
      bobOffset: Math.random() * Math.PI * 2,
      bobSpeed: 0.05 + Math.random() * 0.05
    };

    return bird;
  }

  createBirds() {
    // Generate some birds high in the sky
    for (let i = 0; i < 15; i++) {
      const bird = this.createBird();
      
      const xPos = (Math.random() - 0.5) * 40; // Spread across width
      const yPos = 15 + Math.random() * 15; // High up
      const zPos = -Math.random() * 300;
      
      bird.position.set(xPos, yPos, zPos);
      
      this.birds.push(bird);
      this.birdGroup.add(bird);
    }
  }

  createTree() {
    const tree = new THREE.Group();
    
    // Trunk
    const trunkGeo = new THREE.BoxGeometry(0.5, 2, 0.5);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // Tree type variation
    const type = Math.floor(Math.random() * 3);
    if (type === 0) {
      // Pine tree (stacked boxes)
      const colors = [0x1b4332, 0x2d6a4f, 0x40916c];
      const leafColor = colors[Math.floor(Math.random() * colors.length)];
      const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.8 });
      
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 2.2), leafMat);
      b1.position.y = 2.2;
      b1.castShadow = true;
      
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 1.6), leafMat);
      b2.position.y = 3.2;
      b2.castShadow = true;
      
      const b3 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 1.0), leafMat);
      b3.position.y = 4.0;
      b3.castShadow = true;
      
      tree.add(b1, b2, b3);
    } else if (type === 1) {
      // Round/Spreading tree
      const colors = [0x38b000, 0x70e000, 0x008000];
      const leafColor = colors[Math.floor(Math.random() * colors.length)];
      const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.8 });
      
      const leaves = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 2.4), leafMat);
      leaves.position.y = 3.0;
      leaves.castShadow = true;
      leaves.receiveShadow = true;
      tree.add(leaves);
    } else {
      // Autumn/Orange tree
      const colors = [0xd90429, 0xf77f00, 0xfcbf49];
      const leafColor = colors[Math.floor(Math.random() * colors.length)];
      const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.8 });
      
      const leaves = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.6, 2.0), leafMat);
      leaves.position.y = 3.0;
      leaves.castShadow = true;
      leaves.receiveShadow = true;
      tree.add(leaves);
    }

    return tree;
  }

  createTrees() {
    // Generate 40 trees on left and right sides
    for (let i = 0; i < 40; i++) {
      const tree = this.createTree();
      
      // Randomly left or right side, outside the lanes
      const isLeft = Math.random() > 0.5;
      const xPos = isLeft ? (-8 - Math.random() * 15) : (8 + Math.random() * 15);
      
      // Spread out over Z
      const zPos = -Math.random() * 400;
      
      tree.position.set(xPos, 0, zPos);
      
      // Random scale and rotation
      tree.scale.setScalar(0.8 + Math.random() * 0.6);
      tree.rotation.y = Math.random() * Math.PI;
      
      this.trees.push(tree);
      this.treeGroup.add(tree);
    }
  }

  createHouse() {
    const house = new THREE.Group();
    
    // Pick random wall color
    const wallColors = [0xddcba4, 0x90e0ef, 0xffb703, 0xfb8500, 0x8ecae6, 0xe07a5f, 0x81b29a, 0xf4f1de];
    const wallColor = wallColors[Math.floor(Math.random() * wallColors.length)];
    
    // Walls/Base
    const baseGeo = new THREE.BoxGeometry(3, 2.2, 3);
    const baseMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.8 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 1.1; // Rest on ground
    base.castShadow = true;
    base.receiveShadow = true;
    house.add(base);
    
    // Roof (Gable roof: rotated box)
    const roofColors = [0x780000, 0x264653, 0x6f4e37, 0x1d3557, 0xd90429];
    const roofColor = roofColors[Math.floor(Math.random() * roofColors.length)];
    const roofGeo = new THREE.BoxGeometry(2.4, 2.4, 3.2); // Rotated
    const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.7 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 2.4;
    roof.rotation.z = Math.PI / 4;
    roof.castShadow = true;
    house.add(roof);
    
    // Door
    const doorGeo = new THREE.BoxGeometry(0.7, 1.2, 0.1);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x5c3d2e });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 0.6, 1.51); // front of house
    house.add(door);
    
    // Windows (front and sides)
    const windowGeo = new THREE.BoxGeometry(0.5, 0.5, 0.1);
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0xffe66d,
      emissive: 0xffd500,
      emissiveIntensity: 0.8
    });
    
    // Front windows (left and right of door)
    const winFL = new THREE.Mesh(windowGeo, windowMat);
    winFL.position.set(-0.8, 1.2, 1.51);
    const winFR = new THREE.Mesh(windowGeo, windowMat);
    winFR.position.set(0.8, 1.2, 1.51);
    house.add(winFL, winFR);
    
    // Side windows (rotated)
    const sideWindowGeo = new THREE.BoxGeometry(0.1, 0.5, 0.5);
    const winSL = new THREE.Mesh(sideWindowGeo, windowMat);
    winSL.position.set(-1.51, 1.2, 0);
    const winSR = new THREE.Mesh(sideWindowGeo, windowMat);
    winSR.position.set(1.51, 1.2, 0);
    house.add(winSL, winSR);
    
    // Chimney
    const chimneyGeo = new THREE.BoxGeometry(0.4, 1.2, 0.4);
    const chimneyMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
    const chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
    chimney.position.set(0.8, 2.6, -0.6);
    chimney.castShadow = true;
    house.add(chimney);
    
    return house;
  }

  createHouses() {
    // Generate 15 houses on left and right sides
    for (let i = 0; i < 15; i++) {
      const house = this.createHouse();
      
      const isLeft = Math.random() > 0.5;
      // Position houses further out than trees to build a nice village background
      const xPos = isLeft ? (-15 - Math.random() * 15) : (15 + Math.random() * 15);
      const zPos = -Math.random() * 400;
      
      house.position.set(xPos, 0, zPos);
      
      // Random rotation and scale
      house.rotation.y = (isLeft ? 1.5 : -1.5) + (Math.random() - 0.5) * 0.2; // face towards road
      house.scale.setScalar(0.9 + Math.random() * 0.4);
      
      this.houses.push(house);
      this.houseGroup.add(house);
    }
  }

  transitionToLevel(level) {
    const themes = [
      { fog: 0x2d4c1e, ground: 0x1e4a21 }, // Level 1 (Forest Green)
      { fog: 0xd4b522, ground: 0x8a7a1c }, // Level 2 (Gold)
      { fog: 0x9e2a2b, ground: 0x5e191a }, // Level 3 (Sunset Red)
      { fog: 0x3c096c, ground: 0x240046 }, // Level 4 (Cyber Violet)
      { fog: 0x03071e, ground: 0x0f172a }, // Level 5 (Midnight Blue)
      { fog: 0xff5d8f, ground: 0xcc3363 }  // Level 6 (Cherry Blossom Pink)
    ];
    // Cycle the themes
    const themeIndex = (level - 1) % themes.length;
    const theme = themes[themeIndex];
    
    this.targetFogColor = new THREE.Color(theme.fog);
    this.targetGroundColor = new THREE.Color(theme.ground);
    this.isTransitioning = true;
  }

  update(deltaTime, currentSpeed) {
    if (this.isTransitioning) {
      if (this.scene.fog) {
        this.scene.fog.color.lerp(this.targetFogColor, 0.015);
      }
      if (this.scene.background) {
        this.scene.background.lerp(this.targetFogColor, 0.015);
      }
      this.ground.material.color.lerp(this.targetGroundColor, 0.015);
      
      // also lerp CSS body background gradually to avoid stark contrast if window is resized
      document.body.style.backgroundColor = '#' + this.scene.background.getHexString();
    }

    // Scroll the ground
    // Since it's a grid, we just reset its position to create infinite loop
    this.ground.position.z += currentSpeed;
    
    // Reset ground when it moves too far
    if (this.ground.position.z > 0) {
      this.ground.position.z = -10; // offset back by segment length
    }

    // Scroll trees
    for (const tree of this.trees) {
      tree.position.z += currentSpeed;
      if (tree.position.z > 20) {
        // Recycle back to the distance
        tree.position.z = -380 - Math.random() * 50;
      }
    }

    // Scroll houses
    for (const house of this.houses) {
      house.position.z += currentSpeed;
      if (house.position.z > 20) {
        // Recycle back to the distance
        house.position.z = -380 - Math.random() * 50;
        const isLeft = Math.random() > 0.5;
        house.position.x = isLeft ? (-15 - Math.random() * 15) : (15 + Math.random() * 15);
        house.rotation.y = (isLeft ? 1.5 : -1.5) + (Math.random() - 0.5) * 0.2;
      }
    }

    // Scroll and animate birds
    for (const bird of this.birds) {
      bird.position.z += currentSpeed + bird.userData.flySpeed; // Birds fly forward too
      
      // Bob up and down
      bird.position.y += Math.sin(Date.now() * 0.005 * bird.userData.bobSpeed + bird.userData.bobOffset) * 0.02;

      // Animate wings (flapping)
      const flap = Math.sin(Date.now() * 0.01) * 0.3;
      bird.children[0].rotation.z = Math.PI / 6 + flap;
      bird.children[1].rotation.z = -(Math.PI / 6 + flap);

      if (bird.position.z > 30) {
        // Recycle birds
        bird.position.z = -300 - Math.random() * 100;
        bird.position.x = (Math.random() - 0.5) * 40;
      }
    }
  }
}
