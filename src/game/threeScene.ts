import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ItemType } from '../types/game';
import { GAME_ITEMS, POSITIVE_ITEM_KEYS, NEGATIVE_ITEM_KEYS, TARGET_SCORE } from './constants';
import { createPiggyCharacter, create3DItemMesh, createBirthdayCake } from './proceduralModels';
import { soundManager } from '../audio/soundEffects';

export interface FallingItemInstance {
  id: number;
  type: ItemType;
  mesh: THREE.Group;
  x: number;
  y: number;
  prevY: number;
  speed: number;
  swayOffset: number;
}

export interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export class GameSceneManager {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private animFrameId: number | null = null;

  // Scene elements
  private piggy: ReturnType<typeof createPiggyCharacter>;
  private basketCatchIndicator: THREE.Mesh;
  private cake: ReturnType<typeof createBirthdayCake> | null = null;
  private items: FallingItemInstance[] = [];
  private particles: Particle[] = [];
  private itemNextId = 1;

  // Input & Physics
  public playerX = 0;
  private targetX = 0;
  private moveSpeed = 16.0;
  public playfieldWidth = 10.0; // boundary: -5.0 to +5.0
  private isMovingLeft = false;
  private isMovingRight = false;

  // State
  public isRunning = false;
  public score = 0;
  private spawnTimer = 0;
  private spawnInterval = 2.0; // Comfortable 2.0s interval between items
  private cakeSpawned = false;

  // Callbacks
  private onScoreUpdate: (newScore: number, itemType: ItemType, points: number, xRatio: number) => void;
  private onVictory: () => void;

  constructor(
    container: HTMLElement,
    onScoreUpdate: (newScore: number, itemType: ItemType, points: number, xRatio: number) => void,
    onVictory: () => void
  ) {
    this.container = container;
    this.onScoreUpdate = onScoreUpdate;
    this.onVictory = onVictory;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x180b26); // deep luxurious night party purple
    this.scene.fog = new THREE.FogExp2(0x180b26, 0.035);

    // 2. Camera - adaptive layout for mobile and desktop
    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      100
    );

    // 3. Renderer with Three.js r160+ directives
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. Studio Environment via RoomEnvironment + PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Studio Lighting
    this.setupLighting();

    // 6. Ground Runway & Party Boulevard
    this.setupBoulevard();

    // 7. Hero Piggy
    this.piggy = createPiggyCharacter();
    this.scene.add(this.piggy.group);

    // 8. Glowing Catch Zone Indicator on the ground right under the basket
    const indicatorGeo = new THREE.RingGeometry(0.55, 0.75, 32);
    indicatorGeo.rotateX(-Math.PI / 2);
    const indicatorMat = new THREE.MeshBasicMaterial({
      color: 0xf472b6,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    this.basketCatchIndicator = new THREE.Mesh(indicatorGeo, indicatorMat);
    this.basketCatchIndicator.position.set(0, 0.03, 1.15);
    this.scene.add(this.basketCatchIndicator);

    // Apply mobile/desktop camera layout
    this.updateCameraLayout();

    this.clock = new THREE.Clock();

    // Resize listener
    window.addEventListener('resize', this.handleResize);

    // Initial compile to pre-warm shaders
    this.renderer.compile(this.scene, this.camera);

    // Start render loop
    this.loop();
  }

  private setupLighting() {
    // Warm Key Light
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.8);
    keyLight.position.set(6, 12, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    // Cool Hemisphere Fill (pink sky, indigo floor)
    const hemiLight = new THREE.HemisphereLight(0xf472b6, 0x1e1b4b, 1.2);
    this.scene.add(hemiLight);

    // Accent Rim Light from behind
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    rimLight.position.set(-6, 8, -6);
    this.scene.add(rimLight);
  }

  private setupBoulevard() {
    // Glossy Runway Floor
    const floorGeo = new THREE.PlaneGeometry(16, 28, 1, 1);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x24113f,
      roughness: 0.15,
      metalness: 0.45,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Runway Grid / Party stripes
    const lineMat = new THREE.MeshBasicMaterial({
      color: 0xec4899,
      transparent: true,
      opacity: 0.4,
    });
    for (let x = -6; x <= 6; x += 3) {
      const lineGeo = new THREE.PlaneGeometry(0.08, 28);
      lineGeo.rotateX(-Math.PI / 2);
      const lineMesh = new THREE.Mesh(lineGeo, lineMat);
      lineMesh.position.set(x, 0.01, 0);
      this.scene.add(lineMesh);
    }

    // Party Light Pillars on the flanks
    const pillarGeo = new THREE.CylinderGeometry(0.18, 0.22, 5, 16);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x312e81,
      roughness: 0.2,
      metalness: 0.7,
    });
    const lightSphereGeo = new THREE.SphereGeometry(0.28, 16, 16);
    const neonColors = [0xf43f5e, 0x06b6d4, 0xfacc15, 0xa855f7];

    [-6.8, 6.8].forEach((xPos) => {
      for (let z = -8; z <= 8; z += 4) {
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(xPos, 2.5, z);
        pillar.castShadow = true;

        const sphereMat = new THREE.MeshBasicMaterial({
          color: neonColors[Math.abs(z) % neonColors.length],
        });
        const lightSphere = new THREE.Mesh(lightSphereGeo, sphereMat);
        lightSphere.position.set(0, 2.6, 0);
        pillar.add(lightSphere);

        this.scene.add(pillar);
      }
    });
  }

  public setKeyInput(left: boolean, right: boolean) {
    this.isMovingLeft = left;
    this.isMovingRight = right;
  }

  public setPointerTarget(normalizedX: number) {
    // normalizedX is -1 to 1 (left to right)
    const halfWidth = this.playfieldWidth / 2 - 0.7;
    this.targetX = THREE.MathUtils.clamp(normalizedX * halfWidth, -halfWidth, halfWidth);
  }

  public start() {
    this.isRunning = true;
    this.score = 0;
    this.cakeSpawned = false;
    this.spawnTimer = 0.5; // first item appears very quickly in 0.5s!
    this.clearItems();
    if (this.cake) {
      this.scene.remove(this.cake.group);
      this.cake = null;
    }
    this.playerX = 0;
    this.targetX = 0;
    this.piggy.group.position.set(0, 0, 0);
    this.updateCameraLayout();
  }

  public pause() {
    this.isRunning = false;
  }

  public resume() {
    this.isRunning = true;
  }

  public reset() {
    this.start();
  }

  public addPoints(pts: number) {
    this.score = Math.min(TARGET_SCORE, this.score + pts);
    this.onScoreUpdate(this.score, 'trai_6_mui', pts, 0.5);
    if (this.score >= TARGET_SCORE && !this.cakeSpawned) {
      this.triggerVictory();
    }
  }

  private clearItems() {
    this.items.forEach((item) => {
      this.scene.remove(item.mesh);
    });
    this.items = [];
    this.particles.forEach((p) => {
      this.scene.remove(p.mesh);
    });
    this.particles = [];
  }

  private spawnItem() {
    // Balanced spawn logic:
    // 65% positive, 35% negative
    const isPos = Math.random() < 0.65;
    const pool = isPos ? POSITIVE_ITEM_KEYS : NEGATIVE_ITEM_KEYS;
    const type = pool[Math.floor(Math.random() * pool.length)];

    const mesh = create3DItemMesh(type);

    // Position along X with margin
    const halfW = this.playfieldWidth / 2 - 0.9;
    const spawnX = (Math.random() * 2 - 1) * halfW;
    const spawnY = 8.5; // Start at nice visible height

    // Align Z directly with basket catch plane at Z = 1.15!
    mesh.position.set(spawnX, spawnY, 1.15);

    this.scene.add(mesh);

    // SLOW, GENTLE FALL SPEED as explicitly requested ("kịp nhìn, rơi chậm")
    // Base speed: 1.25 to 1.5 units per second (takes ~5.5 seconds to reach basket!)
    const baseSpeed = 1.25 + Math.random() * 0.25;

    this.items.push({
      id: this.itemNextId++,
      type,
      mesh,
      x: spawnX,
      y: spawnY,
      prevY: spawnY,
      speed: baseSpeed,
      swayOffset: Math.random() * Math.PI * 2,
    });
  }

  private spawnCatchParticles(x: number, y: number, isPositive: boolean) {
    const count = isPositive ? 16 : 10;
    const geo = isPositive
      ? new THREE.SphereGeometry(0.12, 8, 8)
      : new THREE.BoxGeometry(0.14, 0.14, 0.14);

    const colors = isPositive
      ? [0xfacc15, 0xec4899, 0x38bdf8, 0xffffff]
      : [0xef4444, 0x334155, 0x78716c];

    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, 1.15);
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 3.5;
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: (Math.random() * 0.7 + 0.5) * speed,
        vz: (Math.random() - 0.5) * speed,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.3,
      });
    }
  }

  private handleCatch(item: FallingItemInstance) {
    const config = GAME_ITEMS[item.type];
    const oldScore = this.score;
    // Score clamped at 0 min, target 1000
    this.score = Math.max(0, this.score + config.points);

    // Audio
    if (config.isPositive) {
      soundManager.playCatchPositive(config.points);
    } else {
      soundManager.playCatchNegative();
    }

    // Milestone check (250, 500, 750)
    if (
      (oldScore < 250 && this.score >= 250) ||
      (oldScore < 500 && this.score >= 500) ||
      (oldScore < 750 && this.score >= 750)
    ) {
      soundManager.playMilestone();
    }

    // Particles & Visual juice
    this.spawnCatchParticles(item.x, item.y, config.isPositive);

    // React HUD callback with screen ratio for floating text
    const halfW = this.playfieldWidth / 2;
    const xRatio = (this.playerX + halfW) / (halfW * 2);
    this.onScoreUpdate(this.score, item.type, config.points, xRatio);

    // Piggy reaction: hop & bounce
    if (config.isPositive) {
      this.piggy.group.position.y = 0.28; // cheerful hop
    } else {
      this.piggy.group.position.y = -0.12; // squat/wince
      this.piggy.head.rotation.z = (Math.random() - 0.5) * 0.4;
    }

    // Victory Trigger!
    if (this.score >= TARGET_SCORE && !this.cakeSpawned) {
      this.triggerVictory();
    }
  }

  private triggerVictory() {
    this.cakeSpawned = true;
    soundManager.playBirthdayFanfare();

    // Spawn 3D Birthday Cake
    this.cake = createBirthdayCake();
    this.cake.group.position.set(0, 0, 1.8);
    this.cake.group.scale.set(0.01, 0.01, 0.01);
    this.scene.add(this.cake.group);

    // Clear falling items
    this.items.forEach((item) => {
      this.scene.remove(item.mesh);
    });
    this.items = [];

    // Notify React
    this.onVictory();
  }

  private update(delta: number) {
    const time = this.clock.getElapsedTime();

    // 1. Player movement with smooth, responsive physics
    const halfWidth = this.playfieldWidth / 2 - 0.7;
    if (this.isMovingLeft) {
      this.targetX -= this.moveSpeed * delta;
    }
    if (this.isMovingRight) {
      this.targetX += this.moveSpeed * delta;
    }
    this.targetX = THREE.MathUtils.clamp(this.targetX, -halfWidth, halfWidth);

    // Exponential damping to targetX (higher damping = ultra responsive to touch/keyboard)
    const prevX = this.playerX;
    this.playerX = THREE.MathUtils.damp(this.playerX, this.targetX, 22, delta);
    this.piggy.group.position.x = this.playerX;

    // Follow with ground catch indicator
    this.basketCatchIndicator.position.x = this.playerX;
    (this.basketCatchIndicator.material as THREE.MeshBasicMaterial).opacity =
      0.35 + Math.sin(time * 6) * 0.15;

    // Smooth return to ground Y from hop
    this.piggy.group.position.y = THREE.MathUtils.damp(this.piggy.group.position.y, 0, 10, delta);

    // Piggy animations:
    // Tilt body based on horizontal velocity
    const vx = (this.playerX - prevX) / Math.max(delta, 0.001);
    this.piggy.group.rotation.z = THREE.MathUtils.damp(
      this.piggy.group.rotation.z,
      -vx * 0.02,
      12,
      delta
    );

    // Head bobbing & ear flapping
    this.piggy.head.rotation.y = THREE.MathUtils.damp(
      this.piggy.head.rotation.y,
      vx * 0.015,
      10,
      delta
    );
    this.piggy.head.position.y = 1.25 + Math.sin(time * 8) * 0.03;
    this.piggy.tail.rotation.z = Math.sin(time * 12) * 0.35;
    this.piggy.ears[0].rotation.z = -0.2 + Math.sin(time * 6) * 0.12;
    this.piggy.ears[1].rotation.z = 0.2 - Math.sin(time * 6) * 0.12;

    // 2. Victory Cake Animation
    if (this.cake) {
      // Smoothly scale up
      this.cake.group.scale.x = THREE.MathUtils.damp(this.cake.group.scale.x, 1.0, 5, delta);
      this.cake.group.scale.y = THREE.MathUtils.damp(this.cake.group.scale.y, 1.0, 5, delta);
      this.cake.group.scale.z = THREE.MathUtils.damp(this.cake.group.scale.z, 1.0, 5, delta);

      // Rotate gently
      this.cake.group.rotation.y += 0.5 * delta;

      // Candle flame flicker
      this.cake.flames.forEach((flame, idx) => {
        flame.intensity = 1.3 + Math.sin(time * 12 + idx * 2) * 0.5;
      });

      // Camera celebratory pan
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, 0, 3, delta);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, 3.6, 3, delta);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, 7.5, 3, delta);
      this.camera.lookAt(0, 1.4, 1.2);
    }

    // 3. Falling Items management
    if (this.isRunning && !this.cakeSpawned) {
      this.spawnTimer += delta;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        this.spawnItem();
      }
    }

    const basketCatchY = 1.15; // Basket top rim center Y
    const catchRadius = 1.25; // Generous catch collision radius

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.prevY = item.y;
      item.y -= item.speed * delta;
      item.mesh.position.y = item.y;

      // Gentle float sway on X without rotation so the 2D card is always 100% readable
      item.mesh.position.x = item.x + Math.sin(time * 2.2 + item.swayOffset) * 0.12;

      // Check collision with Piggy's basket
      const currentX = item.mesh.position.x;
      const distX = Math.abs(currentX - this.playerX);
      // Continuous swept check: item crossed basket rim or is inside catch zone
      const crossedBasket = item.prevY >= basketCatchY - 0.25 && item.y <= basketCatchY + 0.45;
      const isInsideY = Math.abs(item.y - basketCatchY) < 0.45;

      if (distX < catchRadius && (crossedBasket || isInsideY)) {
        // CAUGHT!
        this.handleCatch(item);
        this.scene.remove(item.mesh);
        this.items.splice(i, 1);
        continue;
      }

      // If fallen past floor
      if (item.y < -0.8) {
        this.scene.remove(item.mesh);
        this.items.splice(i, 1);
      }
    }

    // 4. Update Catch Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;
      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;
      p.vy -= 9.8 * delta; // gravity
      const scale = 1 - p.life / p.maxLife;
      p.mesh.scale.set(scale, scale, scale);
    }
  }

  private loop = () => {
    this.animFrameId = requestAnimationFrame(this.loop);
    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05); // clamped frame delta time

    this.update(dt);
    this.renderer.render(this.scene, this.camera);
  };

  public updateCameraLayout() {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const aspect = w / Math.max(h, 1);
    this.camera.aspect = aspect;

    const isMobile = aspect < 0.95 || w < 640;

    if (isMobile) {
      // Mobile portrait mode:
      // Raise lookAt target to Y = 2.45, so the pig (at Y = 0) sits comfortably low on screen!
      this.camera.fov = 50;
      this.camera.position.set(0, 4.8, 10.8);
      this.camera.lookAt(0, 2.45, 1.15);
      this.playfieldWidth = 6.2; // bounded inside narrow mobile screen
    } else {
      // Desktop / Landscape mode:
      this.camera.fov = 45;
      this.camera.position.set(0, 4.6, 9.8);
      this.camera.lookAt(0, 1.9, 1.15);
      this.playfieldWidth = 9.5;
    }

    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private handleResize = () => {
    this.updateCameraLayout();
  };

  public destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
    this.clearItems();
    if (this.basketCatchIndicator) {
      this.scene.remove(this.basketCatchIndicator);
    }
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
