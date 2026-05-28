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

  createObstacle(level = 1, laneIndex = -1) {
    // Decide if this is a border obstacle (low, wide) that forces a jump
    const borderChance = Math.min(level * 0.03, 0.3);
    const isBorder = Math.random() < borderChance;

    // Pick lane; for border we use center lane (0) and ignore laneIndex
    const lane = isBorder ? 0 : (laneIndex !== -1 ? this.lanes[laneIndex] : this.lanes[Math.floor(Math.random() * this.lanes.length)]);

    // Two types: tall (blocker) and short (jumpable) – overridden if border
    // Increase tall obstacle chance with level
    const tallChance = Math.min(0.5 + level * 0.05, 0.9);
    const isTall = isBorder ? false : Math.random() < tallChance;

    const height = isBorder ? 0.5 : (isTall ? 2 : 1);
    const width = isBorder ? 12 : 1.8;
    const depth = isBorder ? 2 : 2;
    
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

  update(deltaTime, speed, level = 1) {
    const now = Date.now();
    const elapsed = now - this.lastTime;
    
    this.spawnTimer += elapsed;
    
    // Spawn logic with speed scaling
    const dynamicInterval = Math.max(100, this.spawnInterval - (speed * 1000) - (level * 20));
    
    if (this.spawnTimer > dynamicInterval) {
      this.createObstacle(level);
      // At higher levels spawn a second obstacle in a different lane for extra challenge
      if (level >= 3 && Math.random() < 0.35) {
        this.createObstacle(level);
      }
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
