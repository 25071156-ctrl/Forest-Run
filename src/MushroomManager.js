class MushroomManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.mushrooms = [];
    this.nextSpawnDist = 5; // spawn a mushroom every 5m
  }

  createMushroom(level) {
    const geometry = new THREE.SphereGeometry(0.4, 8, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff44ff,
      emissive: 0x550055,
      transparent: true,
      opacity: 0.9
    });
    const mesh = new THREE.Mesh(geometry, material);

    // Pick a random lane
    const lanes = [-3, 0, 3];
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    mesh.position.set(lane, 12, -20); // start high above
    mesh.castShadow = true;
    this.scene.add(mesh);
    this.mushrooms.push({ mesh, collected: false });
  }

  update(deltaTime, level) {
    // Spawn based on distance
    if (window.distance >= this.nextSpawnDist) {
      this.createMushroom(level);
      this.nextSpawnDist += 5;
    }

    const fallSpeed = 0.008 + level * 0.001;

    for (let i = this.mushrooms.length - 1; i >= 0; i--) {
      const obj = this.mushrooms[i];
      if (obj.collected) continue;

      // Move mushroom toward player (forward + falling)
      obj.mesh.position.z += (0.3 + level * 0.05);
      obj.mesh.position.y -= fallSpeed * deltaTime;

      // Collect when close to player
      if (this.player.box) {
        const tempBox = new THREE.Box3().setFromObject(obj.mesh);
        if (this.player.box.intersectsBox(tempBox)) {
          obj.collected = true;
          this.scene.remove(obj.mesh);
          const el = document.getElementById('mushroom-val');
          if (el) el.textContent = (parseInt(el.textContent) || 0) + 1;
          this.mushrooms.splice(i, 1);
          continue;
        }
      }

      // Remove if passed the player or fallen below ground
      if (obj.mesh.position.z > 10 || obj.mesh.position.y < -3) {
        this.scene.remove(obj.mesh);
        this.mushrooms.splice(i, 1);
      }
    }
  }

  reset() {
    for (const obj of this.mushrooms) {
      this.scene.remove(obj.mesh);
    }
    this.mushrooms = [];
    this.nextSpawnDist = 5;
    const el = document.getElementById('mushroom-val');
    if (el) el.textContent = '0';
  }
}

window.MushroomManager = MushroomManager;
