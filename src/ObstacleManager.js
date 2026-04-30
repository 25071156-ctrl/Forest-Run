class ObstacleManager {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = []; // Array of active obstacles
    this.lanes = [-3, 0, 3];
    
    // Spawn pooling metrics
    this.spawnZ = -150; // Spawn them far away
    this.despawnZ = 10; // Despawn behind the camera
    
    // Timer for spawning
    this.spawnTimer = 0;
    this.spawnInterval = 1000; // ms
    this.lastTime = Date.now();
  }

  createObstacle() {
    // Pick random lane
    const lane = this.lanes[Math.floor(Math.random() * this.lanes.length)];
    
    // Two types: tall (blocker) and short (jumpable)
    const isTall = Math.random() > 0.5;
    
    const height = isTall ? 2 : 1;
    const width = 1.8;
    const depth = 2;
    
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mat = new THREE.MeshStandardMaterial({
      color: isTall ? 0xff0055 : 0x00d4ff, // Red for tall, Cyan for short
      roughness: 0.2,
      metalness: 0.8
    });
    
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(lane, height / 2, this.spawnZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Bounding box for collisions
    const box = new THREE.Box3();
    
    this.scene.add(mesh);
    
    this.obstacles.push({
      mesh: mesh,
      box: box,
      isPassed: false
    });
  }

  update(deltaTime, speed) {
    const now = Date.now();
    const elapsed = now - this.lastTime;
    
    this.spawnTimer += elapsed;
    
    // Spawn logic with speed scaling
    const dynamicInterval = Math.max(200, this.spawnInterval - (speed * 1000));
    
    if (this.spawnTimer > dynamicInterval) {
      this.createObstacle();
      this.spawnTimer = 0;
    }
    
    this.lastTime = now;

    // Move obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.mesh.position.z += speed;
      
      // Update bounding box
      obs.box.setFromObject(obs.mesh);
      
      // Remove if past the camera
      if (obs.mesh.position.z > this.despawnZ) {
        this.scene.remove(obs.mesh);
        this.obstacles.splice(i, 1);
      }
    }
  }

  checkCollision(playerBox) {
    for (const obs of this.obstacles) {
      if (playerBox.intersectsBox(obs.box)) {
        return true;
      }
    }
    return false;
  }

  reset() {
    for (const obs of this.obstacles) {
      this.scene.remove(obs.mesh);
    }
    this.obstacles = [];
    this.spawnTimer = 0;
    this.lastTime = Date.now();
  }
}
