class Player {
  constructor(scene) {
    this.scene = scene;
    
    this.lanes = [-3, 0, 3]; // Left, Center, Right lanes
    this.currentLane = 1; // Start in center (index 1)
    
    this.targetX = this.lanes[this.currentLane];
    
    // Jump mechanics
    this.isJumping = false;
    this.yVelocity = 0;
    this.gravity = -0.015;
    this.jumpForce = 0.4;
    this.baseY = 0.5;

    // Create a voxel Fox
    this.mesh = this.createFox();
    this.mesh.position.set(this.targetX, this.baseY, 0); // Player position close to camera
    
    // Add to scene
    this.scene.add(this.mesh);

    // Create chasing Wolf
    this.wolfMesh = this.createWolf();
    this.wolfOffsetZ = 5; // Trails 5 units behind the fox (fox is at 0)
    // The camera is at z = 8, so wolf is between fox and camera
    this.wolfMesh.position.set(this.targetX, this.baseY, this.wolfOffsetZ);
    this.scene.add(this.wolfMesh);

    // Bounding box for collisions
    this.box = new THREE.Box3();
  }

  createFox() {
    const foxGroup = new THREE.Group();
    
    // Colors
    const orangeMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
    const whiteMat  = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const blackMat  = new THREE.MeshLambertMaterial({ color: 0x222222 });

    // Body
    const bodyGeo = new THREE.BoxGeometry(1, 1, 1.5);
    const body = new THREE.Mesh(bodyGeo, orangeMat);
    body.position.y = 0.5;
    foxGroup.add(body);

    // Head
    const headGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const head = new THREE.Mesh(headGeo, orangeMat);
    head.position.set(0, 1.2, -0.6);
    foxGroup.add(head);

    // Snout
    const snoutGeo = new THREE.BoxGeometry(0.4, 0.3, 0.4);
    const snout = new THREE.Mesh(snoutGeo, whiteMat);
    snout.position.set(0, 1, -1);
    foxGroup.add(snout);

    // Nose
    const noseGeo = new THREE.BoxGeometry(0.15, 0.1, 0.1);
    const nose = new THREE.Mesh(noseGeo, blackMat);
    nose.position.set(0, 1.1, -1.2);
    foxGroup.add(nose);

    // Ears
    const earGeo = new THREE.BoxGeometry(0.2, 0.3, 0.2);
    const earL = new THREE.Mesh(earGeo, orangeMat);
    earL.position.set(-0.3, 1.6, -0.5);
    const earR = new THREE.Mesh(earGeo, orangeMat);
    earR.position.set(0.3, 1.6, -0.5);
    foxGroup.add(earL, earR);

    // Tail
    const tailGeo = new THREE.BoxGeometry(0.4, 0.4, 1);
    const tail = new THREE.Mesh(tailGeo, orangeMat);
    tail.position.set(0, 0.6, 1);
    // Tip of tail
    const tipGeo = new THREE.BoxGeometry(0.42, 0.42, 0.3);
    const tip = new THREE.Mesh(tipGeo, whiteMat);
    tip.position.set(0, 0.6, 1.4);
    foxGroup.add(tail, tip);
    
    // Scale it down a bit to fit the lane
    foxGroup.scale.set(0.8, 0.8, 0.8);

    // Cast shadows
    foxGroup.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    return foxGroup;
  }

  createWolf() {
    const wolfGroup = new THREE.Group();
    
    // Colors for Wolf
    const greyMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const darkGreyMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const whiteMat  = new THREE.MeshLambertMaterial({ color: 0xdddddd });
    const redMat    = new THREE.MeshLambertMaterial({ color: 0xff0000 }); // Angry eyes

    // Body
    const bodyGeo = new THREE.BoxGeometry(1.2, 1.2, 1.8);
    const body = new THREE.Mesh(bodyGeo, greyMat);
    body.position.y = 0.6;
    wolfGroup.add(body);

    // Head
    const headGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    const head = new THREE.Mesh(headGeo, greyMat);
    head.position.set(0, 1.4, -0.8);
    wolfGroup.add(head);

    // Snout
    const snoutGeo = new THREE.BoxGeometry(0.5, 0.4, 0.5);
    const snout = new THREE.Mesh(snoutGeo, whiteMat);
    snout.position.set(0, 1.1, -1.3);
    wolfGroup.add(snout);

    // Nose
    const noseGeo = new THREE.BoxGeometry(0.2, 0.15, 0.15);
    const nose = new THREE.Mesh(noseGeo, darkGreyMat);
    nose.position.set(0, 1.2, -1.55);
    wolfGroup.add(nose);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.15, 0.15, 0.1);
    const eyeL = new THREE.Mesh(eyeGeo, redMat);
    eyeL.position.set(-0.25, 1.6, -1.25);
    const eyeR = new THREE.Mesh(eyeGeo, redMat);
    eyeR.position.set(0.25, 1.6, -1.25);
    wolfGroup.add(eyeL, eyeR);

    // Ears
    const earGeo = new THREE.BoxGeometry(0.25, 0.4, 0.25);
    const earL2 = new THREE.Mesh(earGeo, darkGreyMat);
    earL2.position.set(-0.35, 1.9, -0.6);
    const earR2 = new THREE.Mesh(earGeo, darkGreyMat);
    earR2.position.set(0.35, 1.9, -0.6);
    wolfGroup.add(earL2, earR2);
    
    // Scale it to be bigger than the fox
    wolfGroup.scale.set(0.9, 0.9, 0.9);

    // Cast shadows
    wolfGroup.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    return wolfGroup;
  }

  moveLeft() {
    if (this.currentLane > 0) {
      this.currentLane--;
      this.targetX = this.lanes[this.currentLane];
      // Quick tilt animation effect could go here
    }
  }

  moveRight() {
    if (this.currentLane < 2) {
      this.currentLane++;
      this.targetX = this.lanes[this.currentLane];
    }
  }

  jump() {
    if (!this.isJumping) {
      this.isJumping = true;
      this.yVelocity = this.jumpForce;
    }
  }

  update(deltaTime) {
    // Smooth lane switching (Lerp)
    this.mesh.position.x += (this.targetX - this.mesh.position.x) * 0.15;

    // Add running wobble if grounded
    if (!this.isJumping) {
       this.mesh.rotation.z = Math.sin(Date.now() * 0.01) * 0.05;
       this.mesh.position.y = this.baseY + Math.abs(Math.sin(Date.now() * 0.015)) * 0.1;
    }

    // Jump physics
    if (this.isJumping) {
      this.mesh.position.y += this.yVelocity;
      this.yVelocity += this.gravity;
      
      // Stop jumping if landed
      if (this.mesh.position.y <= this.baseY) {
        this.mesh.position.y = this.baseY;
        this.isJumping = false;
        this.yVelocity = 0;
      }
    }

    // Update bounding box for collisions
    this.box.setFromObject(this.mesh);
    // Shrink the box a bit so collisions feel fair
    this.box.expandByScalar(-0.2); 

    // Update Wolf to follow Fox
    // Delay movement on X slightly for a "chasing" feel
    this.wolfMesh.position.x += (this.mesh.position.x - this.wolfMesh.position.x) * 0.08;
    
    // Wolf also jumps, but slightly later/lower
    if (this.isJumping) {
      this.wolfMesh.position.y += (this.mesh.position.y - 0.2 - this.wolfMesh.position.y) * 0.2;
    } else {
      this.wolfMesh.position.y += (this.baseY - this.wolfMesh.position.y) * 0.2;
    }

    // Wolf run wobble
    this.wolfMesh.rotation.z = Math.sin(Date.now() * 0.008) * 0.06;
    this.wolfMesh.position.y += Math.abs(Math.sin(Date.now() * 0.012)) * 0.08;
  }

  reset() {
    this.currentLane = 1;
    this.targetX = this.lanes[this.currentLane];
    this.mesh.position.set(this.targetX, this.baseY, 0);
    this.wolfMesh.position.set(this.targetX, this.baseY, this.wolfOffsetZ);
    this.isJumping = false;
    this.yVelocity = 0;
  }
}
