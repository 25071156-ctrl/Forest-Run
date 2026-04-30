class Environment {
  constructor(scene) {
    this.scene = scene;
    this.speed = 0.5; // Default speed, can be increased

    this.trees = [];
    this.treeGroup = new THREE.Group();
    this.scene.add(this.treeGroup);

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
    this.targetFogColor = new THREE.Color(0xd4b522); // Yellow/Gold
    this.targetGroundColor = new THREE.Color(0x8a7a1c); // Dark Gold

    this.createTrees();
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
    const trunkGeo = new THREE.BoxGeometry(0.8, 2, 0.8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2314 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // Leaves
    const leavesGeo = new THREE.BoxGeometry(3, 4, 3);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x0f5e1b, roughness: 0.8 });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 4;
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    tree.add(leaves);

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

  transitionToYellow() {
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
