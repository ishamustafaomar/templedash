import * as THREE from "three";
import type { Character } from "@/lib/characters";

export type PowerupType = "shield" | "magnet" | "speed" | "invincibility";

export interface EngineCallbacks {
  onScore?: (s: { score: number; distance: number; coins: number }) => void;
  onCoin?: (totalCoins: number) => void;
  onPowerup?: (type: PowerupType) => void;
  onPowerupExpire?: (type: PowerupType) => void;
  onPowerupState?: (active: Record<PowerupType, boolean>, timers: Record<PowerupType, number>) => void;
  onTrip?: () => void;
  onStumbleEnd?: () => void;
  onGameOver?: (final: { score: number; distance: number; coins: number }) => void;
  onSound?: (name: string) => void;
  onTilt?: (lane: number, angle: number) => void;
}

const LANES = [-2.5, 0, 2.5];
const LANE_WIDTH = 2.5;
const TILE_LENGTH = 12;
const VISIBLE_TILES = 20;
const BASE_SPEED = 12;
const MAX_SPEED = 35;
const SPEED_INCREASE_RATE = 0.15;

interface ObstacleObj {
  mesh: THREE.Object3D;
  type: "barrier" | "low" | "overhead" | "fire" | "root" | "gap";
  tileZ: number;
  lane: number;
}
interface CoinObj { mesh: THREE.Mesh; tileZ: number; collected: boolean; }
interface PowerupObj { group: THREE.Group; type: PowerupType; tileZ: number; collected: boolean; }
interface Tile { group: THREE.Group; z: number; spawnZ: number; index: number; }

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private cb: EngineCallbacks;
  private character: Character;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private rafId = 0;
  private running = false;

  private player!: THREE.Group;
  private playerMat!: THREE.MeshStandardMaterial;
  private legL!: THREE.Group;
  private legR!: THREE.Group;
  private armL!: THREE.Group;
  private armR!: THREE.Group;
  private shieldAura?: THREE.Mesh;
  private invAura?: THREE.Mesh;

  private currentLane = 1;
  private targetLane = 1;
  private playerX = 0;
  private playerY = 0;
  private playerVY = 0;
  private isJumping = false;
  private isSliding = false;
  private slideTimer = 0;
  private slideDuration = 0.55;

  private isStumbling = false;
  private stumbleTimer = 0;
  private demons: THREE.Group[] = [];

  private speed = BASE_SPEED;
  private distance = 0;
  private score = 0;
  private coins = 0;

  private tiles: Tile[] = [];
  private obstacles: ObstacleObj[] = [];
  private coinObjs: CoinObj[] = [];
  private powerups: PowerupObj[] = [];

  // Reusable shared materials/geometries
  private wallTexture!: THREE.CanvasTexture;
  private floorTexture!: THREE.CanvasTexture;
  private wallMat!: THREE.MeshStandardMaterial;
  private floorMat!: THREE.MeshStandardMaterial;
  private pillarMat!: THREE.MeshStandardMaterial;

  // Atmosphere
  private torches: { light: THREE.PointLight; baseIntensity: number; flame: THREE.Mesh; }[] = [];
  private dust!: THREE.Points;
  private dustVelocities!: Float32Array;

  private activePowerups: Record<PowerupType, boolean> = {
    shield: false, magnet: false, speed: false, invincibility: false,
  };
  private powerupTimers: Record<PowerupType, number> = {
    shield: 0, magnet: 0, speed: 0, invincibility: 0,
  };
  private powerupBaseDur: Record<PowerupType, number> = {
    shield: 4, magnet: 6, speed: 3, invincibility: 4,
  };
  private coinMultiplier = 1;
  private headStartActive = false;

  private tiltEnabled = false;
  private tiltBaseline: number | null = null;
  private tiltGamma = 0;

  private turnStart = 0;
  private turnDir = 0;

  constructor(canvas: HTMLCanvasElement, cb: EngineCallbacks, character: Character) {
    this.canvas = canvas;
    this.cb = cb;
    this.character = character;
    this.slideDuration *= character.slideDurationMultiplier;
    this.initScene();
    this.buildSharedMaterials();
    this.buildSky();
    this.buildDust();
    this.buildPlayer();
    this.generateInitialTiles();
    this.bindKeys();
    window.addEventListener("resize", this.handleResize);
    this.handleResize();
  }

  // ------- Setup -------
  private initScene() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x140a06);
    this.scene.fog = new THREE.FogExp2(0x1a0d07, 0.018);

    this.camera = new THREE.PerspectiveCamera(68, 1, 0.1, 220);
    this.camera.position.set(0, 5.5, 8);
    this.camera.lookAt(0, 1, -10);

    this.scene.add(new THREE.AmbientLight(0xffc28a, 0.35));
    const dir = new THREE.DirectionalLight(0xffe2b5, 0.9);
    dir.position.set(6, 14, 4);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.left = -10; dir.shadow.camera.right = 10;
    dir.shadow.camera.top = 10; dir.shadow.camera.bottom = -10;
    this.scene.add(dir);
    // Warm rim from "torchlight ahead"
    const rim = new THREE.PointLight(0xff7733, 1.0, 28);
    rim.position.set(0, 6, -10);
    this.scene.add(rim);
  }

  private buildSharedMaterials() {
    this.wallTexture = makeWallTexture();
    this.wallTexture.wrapS = this.wallTexture.wrapT = THREE.RepeatWrapping;
    this.wallTexture.repeat.set(2, 1);
    this.floorTexture = makeFloorTexture();
    this.floorTexture.wrapS = this.floorTexture.wrapT = THREE.RepeatWrapping;
    this.floorTexture.repeat.set(2, 3);
    this.wallMat = new THREE.MeshStandardMaterial({ map: this.wallTexture, roughness: 0.95, color: 0x9c7a55 });
    this.floorMat = new THREE.MeshStandardMaterial({ map: this.floorTexture, roughness: 1, color: 0x7a5535 });
    this.pillarMat = new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.9 });
  }

  private buildSky() {
    // Inside-out gradient dome
    const geo = new THREE.SphereGeometry(120, 24, 16);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x0a0503) },
        bottomColor: { value: new THREE.Color(0x3a1808) },
      },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);} `,
      fragmentShader: `varying vec3 vP; uniform vec3 topColor; uniform vec3 bottomColor; void main(){ float h = normalize(vP).y * 0.5 + 0.5; gl_FragColor = vec4(mix(bottomColor, topColor, h), 1.0);} `,
    });
    this.scene.add(new THREE.Mesh(geo, mat));
  }

  private buildDust() {
    const COUNT = 220;
    const positions = new Float32Array(COUNT * 3);
    this.dustVelocities = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 1] = Math.random() * 5 + 0.5;
      positions[i * 3 + 2] = -Math.random() * 100;
      this.dustVelocities[i * 3] = (Math.random() - 0.5) * 0.15;
      this.dustVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.08;
      this.dustVelocities[i * 3 + 2] = 0;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffd6a0, size: 0.05, transparent: true, opacity: 0.45,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    });
    this.dust = new THREE.Points(geo, mat);
    this.scene.add(this.dust);
  }

  private buildPlayer() {
    const c = this.character;
    const g = new THREE.Group();
    this.playerMat = new THREE.MeshStandardMaterial({ color: c.bodyColor, roughness: 0.7 });
    const gearMat = new THREE.MeshStandardMaterial({ color: c.gearColor, roughness: 0.6 });
    const accMat = new THREE.MeshStandardMaterial({ color: c.accentColor, emissive: c.accentColor, emissiveIntensity: 0.2 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xc69f7a });
    const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const eyeBlack = new THREE.MeshStandardMaterial({ color: 0x111111 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.3), this.playerMat);
    torso.position.y = 1.55;
    torso.castShadow = true;
    g.add(torso);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.18), skinMat);
    neck.position.y = 1.98;
    g.add(neck);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.38), skinMat);
    head.position.y = 2.28;
    head.castShadow = true;
    g.add(head);

    const eL = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), eyeWhite);
    eL.position.set(-0.1, 2.32, 0.2);
    const eR = eL.clone(); eR.position.x = 0.1;
    const pL = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), eyeBlack);
    pL.position.set(-0.1, 2.32, 0.24);
    const pR = pL.clone(); pR.position.x = 0.1;
    g.add(eL, eR, pL, pR);

    const hips = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.28), this.playerMat);
    hips.position.y = 1.15;
    g.add(hips);

    // Legs
    const makeLeg = (x: number) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, 1.05, 0);
      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.55, 0.22), this.playerMat);
      upper.position.y = -0.28;
      const lower = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.2), gearMat);
      lower.position.y = -0.72;
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.15, 0.3), gearMat);
      boot.position.set(0, -1.02, 0.05);
      pivot.add(upper, lower, boot);
      pivot.children.forEach((m) => (m as THREE.Mesh).castShadow = true);
      return pivot;
    };
    this.legL = makeLeg(-0.155); this.legR = makeLeg(0.155);
    g.add(this.legL, this.legR);

    const makeArm = (x: number) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, 1.85, 0);
      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), this.playerMat);
      upper.position.y = -0.25;
      const fore = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.14), skinMat);
      fore.position.y = -0.66;
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.14), skinMat);
      hand.position.y = -0.92;
      pivot.add(upper, fore, hand);
      return pivot;
    };
    this.armL = makeArm(-0.365); this.armR = makeArm(0.365);
    g.add(this.armL, this.armR);

    // Character accessories
    if (c.id === "explorer") {
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 16), gearMat);
      brim.position.y = 2.5;
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.22, 12), gearMat);
      crown.position.y = 2.62;
      g.add(brim, crown);
    } else if (c.id === "warrior") {
      const helm = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.18, 0.42), gearMat);
      helm.position.y = 2.55;
      g.add(helm);
      const horn = new THREE.ConeGeometry(0.08, 0.25, 8);
      const hl = new THREE.Mesh(horn, accMat); hl.position.set(-0.18, 2.75, 0); hl.rotation.z = 0.4;
      const hr = new THREE.Mesh(horn, accMat); hr.position.set(0.18, 2.75, 0); hr.rotation.z = -0.4;
      g.add(hl, hr);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.05), gearMat);
      plate.position.set(0, 1.6, 0.18); g.add(plate);
    } else if (c.id === "hunter") {
      const hood = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.46), gearMat);
      hood.position.y = 2.3; g.add(hood);
      const goggle = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.02), gearMat);
      goggle.position.set(0, 2.32, 0.21); g.add(goggle);
      const lens = new THREE.CylinderGeometry(0.05, 0.05, 0.04, 12);
      const gl = new THREE.Mesh(lens, accMat); gl.rotation.x = Math.PI / 2; gl.position.set(-0.1, 2.32, 0.23);
      const gr = gl.clone(); gr.position.x = 0.1;
      g.add(gl, gr);
      const glow = new THREE.PointLight(c.accentColor, 0.6, 4); glow.position.set(0, 2.3, 0.5); g.add(glow);
    }

    g.position.set(this.playerX, this.playerY, 0);
    this.player = g;
    this.scene.add(g);

    // Aura placeholders
    const shieldGeo = new THREE.SphereGeometry(1.4, 16, 16);
    const shieldMat = new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.18, depthWrite: false });
    this.shieldAura = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldAura.position.y = 1.2; this.shieldAura.visible = false;
    g.add(this.shieldAura);

    const invMat = new THREE.MeshBasicMaterial({ color: 0xaa44ff, wireframe: true, transparent: true, opacity: 0.5 });
    this.invAura = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 12), invMat);
    this.invAura.position.y = 1.2; this.invAura.visible = false;
    g.add(this.invAura);
  }

  private generateInitialTiles() {
    for (let i = 0; i < VISIBLE_TILES; i++) this.addTile(i, -i * TILE_LENGTH);
  }

  private addTile(index: number, z: number) {
    const group = new THREE.Group();
    const floor = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.3, TILE_LENGTH), this.floorMat);
    floor.position.y = 0; floor.receiveShadow = true;
    const wL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, TILE_LENGTH), this.wallMat);
    wL.position.set(-4.75, 2, 0);
    const wR = wL.clone(); wR.position.x = 4.75;
    group.add(floor, wL, wR);

    // Stone trim along floor edges
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x4a321e, roughness: 0.9 });
    const trimGeo = new THREE.BoxGeometry(0.4, 0.4, TILE_LENGTH);
    const trL = new THREE.Mesh(trimGeo, trimMat); trL.position.set(-4.3, 0.2, 0);
    const trR = trL.clone(); trR.position.x = 4.3;
    group.add(trL, trR);

    // Cracked stone arches every 2 tiles
    if (index % 2 === 0) {
      const archMat = new THREE.MeshStandardMaterial({ color: 0x5a3e22, roughness: 0.85 });
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(10, 0.6, 0.6), archMat);
      lintel.position.set(0, 4.2, 0);
      group.add(lintel);
    }

    // Carved pillars + torches every 3 tiles
    if (index % 3 === 0) {
      const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 4.5, 0.7), this.pillarMat);
      p1.position.set(-4.2, 2.2, 0); p1.castShadow = true;
      const p2 = p1.clone(); p2.position.x = 4.2;
      group.add(p1, p2);

      // Torches with flickering flames
      for (const px of [-4.0, 4.0]) {
        const sconce = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.1, 0.4, 6),
          new THREE.MeshStandardMaterial({ color: 0x2a1a10 }),
        );
        sconce.position.set(px, 3.0, 0);
        const flame = new THREE.Mesh(
          new THREE.ConeGeometry(0.18, 0.5, 8),
          new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0.95 }),
        );
        flame.position.set(px, 3.4, 0);
        const light = new THREE.PointLight(0xff7733, 1.4, 12);
        light.position.set(px, 3.4, 0);
        group.add(sconce, flame, light);
        this.torches.push({ light, baseIntensity: 1.4, flame });
      }
    }

    // Occasional hanging vines (decorative)
    if (index % 4 === 1) {
      const vineMat = new THREE.MeshStandardMaterial({ color: 0x2a4a18, roughness: 1 });
      for (let i = 0; i < 3; i++) {
        const x = (Math.random() - 0.5) * 9;
        const len = 0.8 + Math.random() * 1.2;
        const v = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, len, 4), vineMat);
        v.position.set(x, 4 - len / 2, (Math.random() - 0.5) * TILE_LENGTH * 0.8);
        group.add(v);
      }
    }

    group.position.z = z;
    this.scene.add(group);
    const tile: Tile = { group, z, spawnZ: z, index };
    this.tiles.push(tile);

    if (index > 2) this.populateTile(tile);
  }

  private populateTile(tile: Tile) {
    const obstacleChance = Math.min(0.75, 0.25 + (tile.index / 150) * 0.5);
    if (Math.random() < obstacleChance) this.spawnObstacle(tile);
    // Coins
    if (Math.random() < 0.55) this.spawnCoinLine(tile);
    // Power-up
    if (Math.random() < 0.04) this.spawnPowerup(tile);
  }

  private spawnObstacle(tile: Tile) {
    const r = Math.random();
    const difficulty = Math.min(1, tile.index / 100);
    const z = tile.z + (Math.random() - 0.5) * (TILE_LENGTH * 0.6);
    const laneIdx = Math.floor(Math.random() * 3);
    const x = LANES[laneIdx];

    let type: ObstacleObj["type"]; let mesh: THREE.Object3D;
    if (r < 0.22) {
      type = "barrier";
      mesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.5, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x6a4a30 }));
      mesh.position.set(x, 1.4, z);
      if (difficulty > 0.4 && Math.random() < 0.45) {
        const otherLanes = [0,1,2].filter(i => i !== laneIdx);
        const ol = otherLanes[Math.floor(Math.random()*otherLanes.length)];
        const m2 = (mesh as THREE.Mesh).clone();
        m2.position.x = LANES[ol]; m2.position.z = z + 1.5;
        this.scene.add(m2);
        this.obstacles.push({ mesh: m2, type, tileZ: tile.spawnZ, lane: ol });
      }
    } else if (r < 0.4) {
      type = "low";
      mesh = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.8, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x4a3220 }));
      mesh.position.set(0, 0.55, z);
    } else if (r < 0.55) {
      type = "overhead";
      mesh = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.6, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x5a3a25 }));
      mesh.position.set(0, 2.3, z);
    } else if (r < 0.7) {
      type = "fire";
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.8, 10),
        new THREE.MeshStandardMaterial({ color: 0xff6620, emissive: 0xff4400, emissiveIntensity: 1.2 }));
      cone.position.set(x, 1.0, z);
      const light = new THREE.PointLight(0xff5520, 1.5, 6);
      light.position.set(x, 1.2, z);
      const g = new THREE.Group(); g.add(cone, light);
      mesh = g;
    } else if (r < 0.82) {
      type = "root";
      mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.6, 8),
        new THREE.MeshStandardMaterial({ color: 0x3a2a18 }));
      mesh.rotation.z = Math.PI / 2;
      mesh.position.set(x, 0.3, z);
    } else {
      type = "gap";
      const box = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.05, 1.2),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 }));
      box.position.set(0, 0.05, z);
      mesh = box;
    }

    if (mesh instanceof THREE.Mesh) { mesh.castShadow = true; }
    this.scene.add(mesh);
    this.obstacles.push({ mesh, type, tileZ: tile.spawnZ, lane: laneIdx });
  }

  private spawnCoinLine(tile: Tile) {
    const lane = Math.floor(Math.random() * 3);
    const x = LANES[lane];
    const count = 3 + Math.floor(Math.random() * 4);
    const startZ = tile.z + TILE_LENGTH * 0.4;
    const mat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.6, metalness: 0.7, roughness: 0.3 });
    const geo = new THREE.CylinderGeometry(0.28, 0.28, 0.08, 16);
    for (let i = 0; i < count; i++) {
      const c = new THREE.Mesh(geo, mat);
      c.rotation.x = Math.PI / 2;
      c.position.set(x, 1.1, startZ - i * 1.1);
      this.scene.add(c);
      this.coinObjs.push({ mesh: c, tileZ: tile.spawnZ, collected: false });
    }
  }

  private spawnPowerup(tile: Tile) {
    const roll = Math.random();
    let type: PowerupType;
    if (roll < 0.4) type = "magnet";
    else if (roll < 0.7) type = "shield";
    else if (roll < 0.9) type = "speed";
    else type = "invincibility";

    const colorMap: Record<PowerupType, number> = {
      magnet: 0xff44aa, shield: 0x4488ff, speed: 0xffaa00, invincibility: 0xaa44ff,
    };
    const color = colorMap[type];
    const group = new THREE.Group();
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.45),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7, roughness: 0.2 }));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.04, 8, 24),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 }));
    ring.rotation.x = Math.PI / 2;
    const light = new THREE.PointLight(color, 0.8, 5);
    group.add(gem, ring, light);
    const lane = Math.floor(Math.random() * 3);
    group.position.set(LANES[lane], 1.3, tile.z + (Math.random() - 0.5) * TILE_LENGTH * 0.5);
    this.scene.add(group);
    this.powerups.push({ group, type, tileZ: tile.spawnZ, collected: false });
  }

  // ------- Lifecycle -------
  start() {
    this.running = true;
    this.clock.start();
    if (this.headStartActive) {
      // boost initial distance/score head start
      this.activatePowerup("invincibility", 4);
    }
    this.loop();
  }

  dispose() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("keydown", this.handleKey);
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach(x => x.dispose());
      else mat?.dispose?.();
    });
    this.renderer.dispose();
  }

  setHeadStart(active: boolean) { this.headStartActive = active; }
  setCoinMultiplier(active: boolean) { this.coinMultiplier = active ? 2 : 1; }
  setPowerupDurations(durs: Partial<Record<PowerupType, number>>) {
    Object.assign(this.powerupBaseDur, durs);
  }

  private handleResize = () => {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  // ------- Input -------
  private bindKeys() {
    window.addEventListener("keydown", this.handleKey);
  }
  private handleKey = (e: KeyboardEvent) => {
    if (!this.running) return;
    if (e.code === "ArrowLeft" || e.code === "KeyA") this.moveLeft();
    else if (e.code === "ArrowRight" || e.code === "KeyD") this.moveRight();
    else if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") this.jump();
    else if (e.code === "ArrowDown" || e.code === "KeyS") this.slide();
    else if (e.code === "KeyR") this.recalibrateBaseline();
  };

  moveLeft() {
    if (this.tiltEnabled) return;
    if (this.targetLane > 0) { this.targetLane--; this.startTurn(-1); }
  }
  moveRight() {
    if (this.tiltEnabled) return;
    if (this.targetLane < 2) { this.targetLane++; this.startTurn(1); }
  }
  jump() {
    if (this.isJumping) return;
    this.isJumping = true;
    this.playerVY = 8.5;
    this.player.scale.y = 1.3;
    this.cb.onSound?.("jump");
    setTimeout(() => { this.player.scale.y = 1; }, 120);
  }
  slide() {
    if (this.isSliding || this.isJumping) return;
    this.isSliding = true;
    this.slideTimer = this.slideDuration;
    this.player.scale.set(1.3, 0.5, 1.2);
    this.cb.onSound?.("slide");
  }
  private startTurn(dir: number) {
    this.turnStart = performance.now();
    this.turnDir = dir;
  }

  setTiltEnabled(on: boolean) {
    this.tiltEnabled = on;
    if (!on) this.tiltBaseline = null;
  }
  feedTilt(gamma: number) {
    if (!this.tiltEnabled) return;
    if (this.tiltBaseline == null) this.tiltBaseline = gamma;
    this.tiltGamma = gamma - this.tiltBaseline;
  }
  recalibrateBaseline() { this.tiltBaseline = null; }

  // ------- Power-ups -------
  private activatePowerup(type: PowerupType, durationOverride?: number) {
    const dur = durationOverride ?? this.powerupBaseDur[type];
    this.activePowerups[type] = true;
    this.powerupTimers[type] = type === "shield" ? Infinity : dur;
    if (type === "shield" && this.shieldAura) this.shieldAura.visible = true;
    if (type === "invincibility" && this.invAura) this.invAura.visible = true;
    if (type === "speed") {
      this.playerMat.emissive = new THREE.Color(0xff8800);
      this.playerMat.emissiveIntensity = 0.6;
    }
    this.cb.onPowerup?.(type);
    this.cb.onSound?.(type);
    this.emitPowerupState();
  }
  private deactivatePowerup(type: PowerupType) {
    this.activePowerups[type] = false;
    this.powerupTimers[type] = 0;
    if (type === "shield" && this.shieldAura) this.shieldAura.visible = false;
    if (type === "invincibility" && this.invAura) this.invAura.visible = false;
    if (type === "speed") {
      this.playerMat.emissive = new THREE.Color(0x000000);
      this.playerMat.emissiveIntensity = 0;
    }
    this.cb.onPowerupExpire?.(type);
    this.emitPowerupState();
  }
  private emitPowerupState() {
    this.cb.onPowerupState?.({ ...this.activePowerups }, { ...this.powerupTimers });
  }

  // ------- Trip -------
  private triggerTrip() {
    if (this.isStumbling) return;
    this.isStumbling = true;
    this.stumbleTimer = 2.5;
    this.cb.onTrip?.();
    this.cb.onSound?.("trip");
    // Spawn 2 demon monkeys
    for (let i = 0; i < 2; i++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x110000, emissive: 0x330000, emissiveIntensity: 0.4 }));
      body.position.y = 1.2;
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const eL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat);
      eL.position.set(-0.12, 1.5, 0.2);
      const eR = eL.clone(); eR.position.x = 0.12;
      g.add(body, eL, eR);
      g.position.set(i === 0 ? -3 : 3, 0, -2);
      this.scene.add(g);
      this.demons.push(g);
    }
  }
  private endStumble() {
    this.isStumbling = false;
    this.demons.forEach(d => this.scene.remove(d));
    this.demons = [];
    this.cb.onStumbleEnd?.();
  }

  // ------- Game over -------
  private triggerGameOver() {
    this.running = false;
    this.cb.onSound?.("collision");
    this.cb.onGameOver?.({ score: this.score, distance: this.distance, coins: this.coins });
  }

  // ------- Loop -------
  private loop = () => {
    if (!this.running) return;
    const dt = Math.min(0.05, this.clock.getDelta());
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
    this.rafId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    // Speed
    const charMul = this.character.speedMultiplier;
    const speedBoost = this.activePowerups.speed ? 1.6 : 1;
    const stumbleMul = this.isStumbling ? 0.35 : 1;
    const base = Math.min(BASE_SPEED + this.distance * SPEED_INCREASE_RATE, MAX_SPEED);
    this.speed = base * speedBoost * charMul * stumbleMul;
    this.distance += this.speed * dt;
    this.score = Math.floor(this.distance * 2);

    // Tile scroll
    for (const t of this.tiles) {
      t.z += this.speed * dt;
      t.group.position.z = t.z;
    }
    for (const o of this.obstacles) o.mesh.position.z += this.speed * dt;
    for (const c of this.coinObjs) c.mesh.position.z += this.speed * dt;
    for (const p of this.powerups) p.group.position.z += this.speed * dt;

    // Recycle tiles
    while (this.tiles.length && this.tiles[0].z > TILE_LENGTH * 2) {
      const t = this.tiles.shift()!;
      // Remove torches that belong to this tile
      this.torches = this.torches.filter(tor => {
        let p: THREE.Object3D | null = tor.flame;
        while (p) { if (p === t.group) return false; p = p.parent; }
        return true;
      });
      this.scene.remove(t.group);
      this.obstacles = this.obstacles.filter(o => {
        if (o.tileZ === t.spawnZ) { this.scene.remove(o.mesh); return false; }
        return true;
      });
      this.coinObjs = this.coinObjs.filter(c => {
        if (c.tileZ === t.spawnZ) { this.scene.remove(c.mesh); return false; }
        return true;
      });
      this.powerups = this.powerups.filter(p => {
        if (p.tileZ === t.spawnZ) { this.scene.remove(p.group); return false; }
        return true;
      });
      const last = this.tiles[this.tiles.length - 1];
      this.addTile(last.index + 1, last.z - TILE_LENGTH);
    }

    // Torch flicker
    const tNow = performance.now() / 1000;
    for (const tor of this.torches) {
      const f = 0.75 + Math.sin(tNow * 18 + tor.flame.position.x) * 0.15 + Math.random() * 0.1;
      tor.light.intensity = tor.baseIntensity * f;
      tor.flame.scale.y = 0.85 + f * 0.25;
    }

    // Dust drift (relative to player)
    const dp = this.dust.geometry.attributes.position as THREE.BufferAttribute;
    const arr = dp.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i] += this.dustVelocities[i] * dt;
      arr[i + 1] += this.dustVelocities[i + 1] * dt;
      arr[i + 2] += this.speed * dt * 0.6;
      if (arr[i + 2] > 12) {
        arr[i] = (Math.random() - 0.5) * 9;
        arr[i + 1] = Math.random() * 5 + 0.5;
        arr[i + 2] = -90 - Math.random() * 20;
      }
    }
    dp.needsUpdate = true;

    // Tilt steering
    if (this.tiltEnabled && this.tiltBaseline != null) {
      const dead = 5, max = 20;
      const a = this.tiltGamma;
      let targetX = 0;
      if (Math.abs(a) > dead) {
        const sign = Math.sign(a);
        const mag = Math.min(max, Math.abs(a)) / max;
        targetX = sign * mag * LANE_WIDTH;
      }
      this.playerX += (targetX - this.playerX) * Math.min(1, dt * 12);
      const laneFromX = Math.round((this.playerX + LANE_WIDTH) / LANE_WIDTH);
      this.targetLane = Math.max(0, Math.min(2, laneFromX));
      this.cb.onTilt?.(this.targetLane, a);
      this.camera.rotation.z = -this.tiltGamma / 250;
    } else {
      const targetX = LANES[this.targetLane];
      this.playerX += (targetX - this.playerX) * Math.min(1, dt * 10);
    }
    this.currentLane = this.targetLane;

    // Jump physics
    if (this.isJumping) {
      this.playerVY -= 22 * dt;
      this.playerY += this.playerVY * dt;
      if (this.playerY <= 0) {
        this.playerY = 0; this.playerVY = 0; this.isJumping = false;
        this.player.scale.y = 0.7;
        setTimeout(() => { this.player.scale.y = 1; }, 160);
      }
    }
    // Slide
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
        this.player.scale.set(1, 1, 1);
      }
    }
    this.player.position.set(this.playerX, this.playerY + (this.isSliding ? -0.25 : 0), 0);

    // Run anim
    const swing = Math.sin(this.distance * 3.5) * 0.55;
    this.legL.rotation.x = swing;
    this.legR.rotation.x = -swing;
    this.armL.rotation.x = -swing * 0.8;
    this.armR.rotation.x = swing * 0.8;

    // Turn lean
    const turnP = (performance.now() - this.turnStart) / 350;
    if (turnP < 1 && this.turnDir !== 0) {
      this.player.rotation.z = Math.sin(turnP * Math.PI) * -0.18 * this.turnDir;
    } else { this.player.rotation.z = 0; }

    // Camera follow
    this.camera.position.x += (this.playerX * 0.5 - this.camera.position.x) * Math.min(1, dt * 5);
    this.camera.position.y = 5.5 + this.playerY * 0.3;

    // Auras
    if (this.shieldAura?.visible) {
      this.shieldAura.rotation.y += dt * 2;
      const s = 1 + Math.sin(performance.now() / 200) * 0.06;
      this.shieldAura.scale.setScalar(s);
    }
    if (this.invAura?.visible) {
      this.invAura.rotation.y += dt * 4;
      this.invAura.rotation.x += dt * 3;
    }

    // Powerup timers
    (Object.keys(this.powerupTimers) as PowerupType[]).forEach(k => {
      if (this.activePowerups[k] && k !== "shield") {
        this.powerupTimers[k] -= dt;
        if (this.powerupTimers[k] <= 0) this.deactivatePowerup(k);
      }
    });
    if (this.distance % 1 < 0.05) this.emitPowerupState();

    // Coin collection (magnet effect too)
    for (const c of this.coinObjs) {
      if (c.collected) continue;
      c.mesh.rotation.y += dt * 6;
      const dx = c.mesh.position.x - this.playerX;
      const dy = c.mesh.position.y - (this.playerY + 0.8);
      const dz = c.mesh.position.z;
      const dist = Math.hypot(dx, dy, dz);
      if (this.activePowerups.magnet && dist < 3.5) {
        c.mesh.position.x += (this.playerX - c.mesh.position.x) * dt * 8;
        c.mesh.position.y += ((this.playerY + 0.8) - c.mesh.position.y) * dt * 8;
        c.mesh.position.z += (0 - c.mesh.position.z) * dt * 8;
      }
      if (dist < 0.9) {
        c.collected = true;
        this.scene.remove(c.mesh);
        this.coins += this.coinMultiplier;
        this.cb.onCoin?.(this.coins);
        this.cb.onSound?.("coin");
      }
    }

    // Power-up collection
    for (const p of this.powerups) {
      if (p.collected) continue;
      p.group.rotation.y += dt * 2;
      p.group.rotation.x += dt * 1.2;
      p.group.position.y = 1.3 + Math.sin(performance.now() / 350 + p.tileZ) * 0.2;
      const dist = Math.hypot(p.group.position.x - this.playerX, p.group.position.z);
      if (dist < 1.2 && Math.abs(p.group.position.y - (this.playerY + 1)) < 1.5) {
        p.collected = true;
        this.scene.remove(p.group);
        this.activatePowerup(p.type);
      }
    }

    // Collision
    if (!this.isStumbling) this.checkCollisions();

    // Stumble
    if (this.isStumbling) {
      this.stumbleTimer -= dt;
      this.demons.forEach((d, i) => {
        d.position.x += (this.playerX + (i === 0 ? -1.2 : 1.2) - d.position.x) * dt * 3;
        d.position.y = Math.abs(Math.sin(performance.now() / 150 + i)) * 0.4;
      });
      if (this.stumbleTimer <= 0) this.endStumble();
    }

    // Report score
    this.cb.onScore?.({ score: this.score, distance: this.distance, coins: this.coins });
  }

  private checkCollisions() {
    const halfX = 0.45 / 2, halfZ = 0.35 / 2;
    const playerY = this.playerY + (this.isSliding ? 0.35 : 0.95);
    const playerH = this.isSliding ? 0.65 : 1.9;

    for (const o of this.obstacles) {
      const z = o.mesh.position.z;
      if (z < -2.5 || z > 2.5) continue;
      const dx = Math.abs(o.mesh.position.x - this.playerX);
      // Use mesh bounding box
      const box = new THREE.Box3().setFromObject(o.mesh);
      const minY = box.min.y, maxY = box.max.y;
      const minX = box.min.x + 0.1, maxX = box.max.x - 0.1;
      const minZ = box.min.z + 0.1, maxZ = box.max.z - 0.1;
      // X overlap
      const xOverlap = this.playerX + halfX > minX && this.playerX - halfX < maxX;
      const zOverlap = halfZ > minZ && -halfZ < maxZ;
      const yOverlap = playerY + playerH / 2 > minY && playerY - playerH / 2 < maxY;
      if (!(xOverlap && zOverlap && yOverlap)) {
        // also handle full-width via dx
        if (o.type !== "low" && o.type !== "overhead" && o.type !== "gap") continue;
        if (!(zOverlap && yOverlap)) continue;
      }

      // Outcome rules
      if (o.type === "overhead" && this.isSliding) continue;
      if ((o.type === "low" || o.type === "gap") && this.isJumping && this.playerY > 0.4) continue;
      if (o.type === "root" && this.isJumping && this.playerY > 1.0) continue;
      if (o.type === "root" && this.isStumbling) continue;
      if (this.activePowerups.invincibility) continue;
      if (this.activePowerups.shield) {
        this.deactivatePowerup("shield");
        this.cb.onSound?.("shieldBreak");
        // remove this obstacle so it doesn't double-hit
        this.scene.remove(o.mesh);
        o.mesh.position.set(999, 999, 999);
        return;
      }
      if (o.type === "root") {
        this.triggerTrip();
        return;
      }
      this.triggerGameOver();
      return;
    }
  }
}

// ===== Procedural textures =====
function makeWallTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 512;
  const ctx = c.getContext("2d")!;
  // Base stone gradient
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#3a2614");
  g.addColorStop(0.5, "#5a3e22");
  g.addColorStop(1, "#3a2614");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512);
  // Stone block grout lines
  ctx.strokeStyle = "#1a0e06"; ctx.lineWidth = 3;
  for (let y = 0; y < 512; y += 64) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
    const offset = (y / 64) % 2 === 0 ? 0 : 64;
    for (let x = offset; x < 512; x += 128) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 64); ctx.stroke();
    }
  }
  // Noise speckles for weathering
  for (let i = 0; i < 2000; i++) {
    ctx.fillStyle = `rgba(${20 + Math.random() * 40},${15 + Math.random() * 30},10,${Math.random() * 0.3})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  // A few hieroglyph-like symbols
  ctx.fillStyle = "#1a0e06";
  ctx.font = "32px serif";
  const glyphs = ["☥", "𓂀", "𓆣", "𓊽", "𓁹", "𓇯"];
  for (let i = 0; i < 8; i++) {
    ctx.fillText(glyphs[i % glyphs.length], 40 + (i % 4) * 120, 100 + Math.floor(i / 4) * 180);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeFloorTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 512;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#5a3a22"; ctx.fillRect(0, 0, 512, 512);
  // Cobblestones
  ctx.strokeStyle = "#2a1810"; ctx.lineWidth = 2;
  for (let y = 0; y < 512; y += 96) {
    for (let x = 0; x < 512; x += 96) {
      const px = x + (Math.random() - 0.5) * 8;
      const py = y + (Math.random() - 0.5) * 8;
      ctx.fillStyle = `rgb(${70 + Math.random() * 40},${50 + Math.random() * 30},${30 + Math.random() * 20})`;
      ctx.beginPath();
      ctx.roundRect(px, py, 86 + Math.random() * 8, 86 + Math.random() * 8, 8);
      ctx.fill(); ctx.stroke();
    }
  }
  // Wet/dirt blotches
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = `rgba(20,12,5,${Math.random() * 0.25})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 512, 10 + Math.random() * 30, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
