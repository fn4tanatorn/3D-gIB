import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const canvas = document.querySelector("#webgl");
const statusEl = document.querySelector("#modelStatus");
const resetCameraButton = document.querySelector("#resetCamera");

const isMobile = window.matchMedia("(max-width: 720px)").matches;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x02020a, 0.011);

const camera = new THREE.PerspectiveCamera(64, window.innerWidth / window.innerHeight, 0.1, 1600);
const defaultCameraPosition = new THREE.Vector3(isMobile ? 0 : 2.4, isMobile ? 6.8 : 5.6, isMobile ? 22 : 20);
camera.position.copy(defaultCameraPosition);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.35 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), isMobile ? 0.7 : 1.05, 0.42, 0.06);
composer.addPass(bloomPass);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.045;
controls.minDistance = 8;
controls.maxDistance = 46;
controls.enablePan = false;
controls.autoRotate = !prefersReducedMotion;
controls.autoRotateSpeed = 0.18;
controls.target.set(0, 0, 0);

scene.add(new THREE.AmbientLight(0x7e8cff, 0.78));
const keyLight = new THREE.PointLight(0xb79cff, 360, 160);
keyLight.position.set(-6, 5, 7);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0xd8f0ff, 4.2);
rimLight.position.set(8, 9, 10);
scene.add(rimLight);
const planetFillLight = new THREE.PointLight(0x5ed9ff, 140, 90);
planetFillLight.position.set(10, -3, -8);
scene.add(planetFillLight);

const galaxyGroup = new THREE.Group();
const depthGroup = new THREE.Group();
const planetGroup = new THREE.Group();
const detailGroup = new THREE.Group();
scene.add(galaxyGroup, depthGroup, planetGroup, detailGroup);

function createParticleTexture() {
  const size = 128;
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  const context = textureCanvas.getContext("2d");
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.2, "rgba(226,214,255,0.95)");
  gradient.addColorStop(0.55, "rgba(134,111,255,0.34)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createPlanetTexture(baseHue = 0.65, accentHue = 0.75) {
  const size = 768;
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  const context = textureCanvas.getContext("2d");
  context.fillStyle = `hsl(${baseHue * 360}, 70%, 36%)`;
  context.fillRect(0, 0, size, size);

  for (let i = 0; i < 56; i += 1) {
    const y = Math.random() * size;
    const height = 5 + Math.random() * 36;
    const alpha = 0.08 + Math.random() * 0.22;
    context.fillStyle = `hsla(${(accentHue + Math.random() * 0.06) * 360}, 95%, ${42 + Math.random() * 26}%, ${alpha})`;
    context.beginPath();
    context.ellipse(size / 2 + (Math.random() - 0.5) * size * 0.12, y, size * (0.24 + Math.random() * 0.55), height, Math.random() * 0.28, 0, Math.PI * 2);
    context.fill();
  }

  for (let i = 0; i < 130; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = 4 + Math.random() * 24;
    const rimAlpha = 0.11 + Math.random() * 0.16;
    const pitAlpha = 0.09 + Math.random() * 0.17;
    context.strokeStyle = `rgba(235,244,255,${rimAlpha})`;
    context.lineWidth = 1 + Math.random() * 2.4;
    context.beginPath();
    context.ellipse(x, y, radius * (1.25 + Math.random() * 0.7), radius * (0.42 + Math.random() * 0.4), Math.random() * Math.PI, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = `rgba(0,0,18,${pitAlpha})`;
    context.beginPath();
    context.ellipse(x, y, radius, radius * (0.38 + Math.random() * 0.42), Math.random() * Math.PI, 0, Math.PI * 2);
    context.fill();
  }

  for (let i = 0; i < 260; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const length = 8 + Math.random() * 46;
    context.strokeStyle = `rgba(255,255,255,${0.025 + Math.random() * 0.07})`;
    context.lineWidth = 0.5 + Math.random() * 1.4;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + Math.cos(Math.random() * Math.PI * 2) * length, y + Math.sin(Math.random() * Math.PI * 2) * length * 0.35);
    context.stroke();
  }

  for (let i = 0; i < 340; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = 0.75 + Math.random() * 3.8;
    context.fillStyle = `rgba(255,255,255,${0.018 + Math.random() * 0.075})`;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

const particleTexture = createParticleTexture();

function makePoints({ count, size, opacity, blending = THREE.AdditiveBlending, generator }) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;
    generator(i, positions, colors, color, i3);
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    map: particleTexture,
    size,
    vertexColors: true,
    transparent: true,
    opacity,
    blending,
    depthWrite: false
  });

  return new THREE.Points(geometry, material);
}

function createGalaxyArms(count = isMobile ? 12000 : 26000) {
  return makePoints({
    count,
    size: isMobile ? 0.085 : 0.105,
    opacity: 0.95,
    generator: (i, positions, colors, color, i3) => {
      const branches = 6;
      const radius = Math.pow(Math.random(), 0.68) * 18.5;
      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = radius * 0.57;
      const spread = Math.pow(Math.random(), 2.15) * (0.55 + radius * 0.16);
      const sign = Math.random() < 0.5 ? -1 : 1;
      const height = (Math.random() - 0.5) * (0.9 + radius * 0.09);

      positions[i3] = Math.cos(branchAngle + spinAngle) * radius + Math.cos(branchAngle + spinAngle + Math.PI / 2) * spread * sign;
      positions[i3 + 1] = height;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + Math.sin(branchAngle + spinAngle + Math.PI / 2) * spread * sign;

      const mix = radius / 18.5;
      color.setHSL(0.72 - mix * 0.34 + Math.random() * 0.045, 0.9, 0.58 + Math.random() * 0.34);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
  });
}

function createStarTunnel(count = isMobile ? 5000 : 9500) {
  return makePoints({
    count,
    size: isMobile ? 0.16 : 0.2,
    opacity: 0.78,
    blending: THREE.NormalBlending,
    generator: (_i, positions, colors, color, i3) => {
      const z = -520 + Math.random() * 1040;
      const angle = Math.random() * Math.PI * 2;
      const radius = 22 + Math.pow(Math.random(), 0.45) * 145;
      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = Math.sin(angle) * radius * 0.62;
      positions[i3 + 2] = z;
      color.setHSL(0.58 + Math.random() * 0.2, 0.42 + Math.random() * 0.42, 0.7 + Math.random() * 0.28);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
  });
}

function createNebulaLayer(count = isMobile ? 720 : 1500) {
  return makePoints({
    count,
    size: isMobile ? 1.35 : 1.85,
    opacity: 0.18,
    generator: (_i, positions, colors, color, i3) => {
      const radius = 2 + Math.random() * 24;
      const angle = Math.random() * Math.PI * 2;
      const depth = (Math.random() - 0.5) * 9;
      positions[i3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 8;
      positions[i3 + 1] = (Math.random() - 0.5) * 4.2;
      positions[i3 + 2] = Math.sin(angle) * radius + depth;
      color.setHSL(0.65 + Math.random() * 0.14, 0.76, 0.38 + Math.random() * 0.28);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
  });
}

function createCore() {
  const group = new THREE.Group();
  const coreGeometry = new THREE.IcosahedronGeometry(1.15, 5);
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8f3ff,
    emissive: 0x9f76ff,
    emissiveIntensity: 2.85,
    roughness: 0.13,
    metalness: 0.08
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  group.add(core);

  const haloMaterial = new THREE.MeshBasicMaterial({ color: 0x8d72ff, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false });
  const haloA = new THREE.Mesh(new THREE.SphereGeometry(2.05, 72, 72), haloMaterial);
  const haloB = new THREE.Mesh(new THREE.SphereGeometry(3.35, 72, 72), haloMaterial.clone());
  haloB.material.opacity = 0.08;
  group.add(haloA, haloB);

  const crownMaterial = new THREE.MeshBasicMaterial({ color: 0xd9c9ff, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const crownA = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.018, 10, 180), crownMaterial);
  const crownB = crownA.clone();
  const crownC = crownA.clone();
  crownA.rotation.x = Math.PI / 2;
  crownB.rotation.y = Math.PI / 2.35;
  crownC.rotation.z = Math.PI / 2.6;
  group.add(crownA, crownB, crownC);

  group.userData = { core, haloA, haloB, crownA, crownB, crownC };
  return group;
}

function addPlanetPanels(group, radius, color) {
  const panelMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false });
  const panelGeometry = new THREE.RingGeometry(radius * 1.03, radius * 1.045, 96, 1, 0, Math.PI * 0.72);
  for (let i = 0; i < 4; i += 1) {
    const panel = new THREE.Mesh(panelGeometry, panelMaterial.clone());
    panel.rotation.set(Math.PI / 2 + i * 0.12, i * Math.PI * 0.5, i * 0.7);
    panel.material.opacity = 0.18 + i * 0.035;
    group.add(panel);
  }
}

function placeSurfacePatch(mesh, patch, radius, theta, phi, lift = 1.006) {
  const normal = new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta)
  );
  patch.position.copy(normal).multiplyScalar(radius * lift);
  patch.lookAt(normal.clone().multiplyScalar(radius * 1.85));
  mesh.add(patch);
}

function addPlanetSurfaceDetails(group, radius, accent = 0x99eaff) {
  const craterMaterial = new THREE.MeshBasicMaterial({ color: 0x050818, transparent: true, opacity: 0.34, side: THREE.DoubleSide, depthWrite: false });
  const rimMaterial = new THREE.MeshBasicMaterial({ color: 0xd7f8ff, transparent: true, opacity: 0.22, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
  const ridgeMaterial = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.24, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
  const count = isMobile ? 10 : 24;

  for (let i = 0; i < count; i += 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = 0.45 + Math.random() * (Math.PI - 0.9);
    const craterRadius = radius * (0.035 + Math.random() * 0.055);
    const crater = new THREE.Mesh(new THREE.CircleGeometry(craterRadius, 24), craterMaterial.clone());
    crater.material.opacity = 0.2 + Math.random() * 0.22;
    placeSurfacePatch(group, crater, radius, theta, phi, 1.009);

    const rim = new THREE.Mesh(new THREE.RingGeometry(craterRadius * 1.04, craterRadius * 1.26, 32), rimMaterial.clone());
    rim.material.opacity = 0.13 + Math.random() * 0.18;
    placeSurfacePatch(group, rim, radius, theta, phi, 1.012);
  }

  for (let i = 0; i < (isMobile ? 8 : 18); i += 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = 0.55 + Math.random() * (Math.PI - 1.1);
    const ridge = new THREE.Mesh(
      new THREE.PlaneGeometry(radius * (0.24 + Math.random() * 0.32), radius * 0.007),
      ridgeMaterial.clone()
    );
    ridge.material.opacity = 0.12 + Math.random() * 0.16;
    ridge.rotation.z = Math.random() * Math.PI;
    placeSurfacePatch(group, ridge, radius, theta, phi, 1.014);
  }
}

function addAsteroidSurfaceDetails(asteroid, scale) {
  const craterMaterial = new THREE.MeshBasicMaterial({ color: 0x07070f, transparent: true, opacity: 0.44, side: THREE.DoubleSide, depthWrite: false });
  const rimMaterial = new THREE.MeshBasicMaterial({ color: 0xc6c0db, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false });
  const ridgeMaterial = new THREE.MeshStandardMaterial({ color: 0xc8c2da, emissive: 0x1c1730, roughness: 0.92, metalness: 0.05 });
  const craterCount = isMobile ? 1 + Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 4);

  for (let i = 0; i < craterCount; i += 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const craterRadius = Math.max(scale * (0.12 + Math.random() * 0.16), 0.012);
    const crater = new THREE.Mesh(new THREE.CircleGeometry(craterRadius, 18), craterMaterial.clone());
    const rim = new THREE.Mesh(new THREE.RingGeometry(craterRadius * 1.08, craterRadius * 1.32, 18), rimMaterial.clone());
    placeSurfacePatch(asteroid, crater, 1, theta, phi, 1.018);
    placeSurfacePatch(asteroid, rim, 1, theta, phi, 1.022);
  }

  for (let i = 0; i < (isMobile ? 1 : 3); i += 1) {
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(scale * 0.08, scale * 0.06, scale * (0.55 + Math.random() * 0.55)), ridgeMaterial.clone());
    ridge.position.set((Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.9);
    ridge.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    asteroid.add(ridge);
  }
}

function createPlanet({ radius, position, color, emissive = 0x111122, ring = false, textureHues = [0.65, 0.75], atmosphere = 0x7ad7ff }) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color,
    map: createPlanetTexture(textureHues[0], textureHues[1]),
    emissive,
    emissiveIntensity: 0.2,
    roughness: 0.56,
    metalness: 0.08
  });
  const planet = new THREE.Mesh(new THREE.SphereGeometry(radius, 128, 128), material);
  group.add(planet);
  addPlanetSurfaceDetails(group, radius, atmosphere);

  const atmosphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.055, 96, 96),
    new THREE.MeshBasicMaterial({ color: atmosphere, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false })
  );
  group.add(atmosphereMesh);
  addPlanetPanels(group, radius, atmosphere);

  if (ring) {
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xa99cff, transparent: true, opacity: 0.34, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    const ringMesh = new THREE.Mesh(new THREE.RingGeometry(radius * 1.55, radius * 2.25, 160), ringMaterial);
    ringMesh.rotation.x = Math.PI / 2.7;
    ringMesh.rotation.y = 0.35;
    group.add(ringMesh);

    const outerRing = new THREE.Mesh(new THREE.RingGeometry(radius * 2.38, radius * 2.43, 160), ringMaterial.clone());
    outerRing.material.opacity = 0.22;
    outerRing.rotation.copy(ringMesh.rotation);
    group.add(outerRing);
  }

  group.position.copy(position);
  group.userData = { planet, atmosphere: atmosphereMesh };
  return group;
}

function createAsteroids(count = isMobile ? 56 : 130) {
  const group = new THREE.Group();
  const materials = [
    new THREE.MeshStandardMaterial({ color: 0x9b91be, emissive: 0x130e24, roughness: 0.9, metalness: 0.12, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x6f6d88, emissive: 0x0c1025, roughness: 0.94, metalness: 0.18, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0xb3a6c9, emissive: 0x171126, roughness: 0.86, metalness: 0.08, flatShading: true })
  ];

  for (let i = 0; i < count; i += 1) {
    const detail = Math.random() > 0.55 ? 2 : 1;
    const asteroid = new THREE.Mesh(new THREE.IcosahedronGeometry(1, detail), materials[i % materials.length].clone());
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.45;
    const beltRadius = 10.5 + Math.random() * 10.5;
    asteroid.position.set(Math.cos(angle) * beltRadius, (Math.random() - 0.5) * 3.9, Math.sin(angle) * beltRadius);
    const scale = 0.06 + Math.random() * 0.34;
    asteroid.scale.set(scale, scale * (0.62 + Math.random() * 0.82), scale * (0.58 + Math.random() * 0.92));
    asteroid.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    addAsteroidSurfaceDetails(asteroid, scale);

    if (!isMobile && Math.random() > 0.62) {
      const crystal = new THREE.Mesh(
        new THREE.ConeGeometry(scale * 0.45, scale * 2.2, 5),
        new THREE.MeshBasicMaterial({ color: 0x8feaff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending })
      );
      crystal.position.set(scale * 0.8, scale * 0.5, 0);
      asteroid.add(crystal);
    }

    group.add(asteroid);
  }

  return group;
}

function createSatelliteArray() {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xc7d9ff, emissive: 0x18315d, emissiveIntensity: 0.35, roughness: 0.28, metalness: 0.72 });
  const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x4f8dff, emissive: 0x102a66, emissiveIntensity: 0.42, roughness: 0.24, metalness: 0.55 });

  for (let i = 0; i < (isMobile ? 3 : 5); i += 1) {
    const satellite = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.38), bodyMaterial);
    const dish = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.26, 24), bodyMaterial.clone());
    dish.position.z = 0.32;
    dish.rotation.x = Math.PI / 2;
    const panelL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.28), panelMaterial);
    const panelR = panelL.clone();
    panelL.position.x = -0.55;
    panelR.position.x = 0.55;
    satellite.add(body, dish, panelL, panelR);

    const angle = (i / (isMobile ? 3 : 5)) * Math.PI * 2;
    satellite.position.set(Math.cos(angle) * 4.2, Math.sin(angle * 1.7) * 0.65, Math.sin(angle) * 4.2);
    satellite.rotation.set(0.5, angle + Math.PI / 2, 0.2);
    group.add(satellite);
  }

  group.position.set(-9.5, -3.4, 7.5);
  group.userData.spinSpeed = 0.0042;
  return group;
}

function createCrystalStation() {
  const group = new THREE.Group();
  const spineMaterial = new THREE.MeshStandardMaterial({ color: 0xefeaff, emissive: 0x5f44ff, emissiveIntensity: 0.7, roughness: 0.2, metalness: 0.36 });
  const glassMaterial = new THREE.MeshBasicMaterial({ color: 0x91f4ff, transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });

  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.58, 1), spineMaterial);
  const upper = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.35, 6), glassMaterial);
  const lower = upper.clone();
  upper.position.y = 0.82;
  lower.position.y = -0.82;
  lower.rotation.z = Math.PI;
  group.add(core, upper, lower);

  for (let i = 0; i < 6; i += 1) {
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.7, 8), spineMaterial.clone());
    const angle = (i / 6) * Math.PI * 2;
    beam.position.set(Math.cos(angle) * 0.85, 0, Math.sin(angle) * 0.85);
    beam.rotation.z = Math.PI / 2;
    beam.rotation.y = angle;
    group.add(beam);
  }

  const dockingRing = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.018, 10, 120), glassMaterial.clone());
  dockingRing.rotation.x = Math.PI / 2;
  group.add(dockingRing);

  group.position.set(5.8, 1.1, 6.2);
  group.rotation.set(0.3, -0.7, 0.2);
  return group;
}

function createComets(count = isMobile ? 3 : 6) {
  const group = new THREE.Group();
  for (let i = 0; i < count; i += 1) {
    const comet = new THREE.Group();
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.08 + Math.random() * 0.06, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xeafaff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending })
    );
    const tail = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 1.3 + Math.random() * 1.2, 18, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x7de8ff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
    );
    tail.position.z = 0.7;
    tail.rotation.x = Math.PI / 2;
    comet.add(head, tail);
    comet.position.set(-14 + Math.random() * 28, -4 + Math.random() * 8, -12 + Math.random() * 24);
    comet.rotation.set(Math.random() * 0.4, Math.random() * Math.PI * 2, -0.45);
    comet.userData.speed = 0.012 + Math.random() * 0.012;
    group.add(comet);
  }
  return group;
}

function createConstellationLines() {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({ color: 0x9edcff, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending });
  const clusters = [
    [[-6, 4.2, -7], [-4.4, 5.5, -8.6], [-2.8, 4.7, -9.4], [-1.6, 6.1, -10.2]],
    [[7.5, -1.4, -8], [9.2, -0.2, -10.4], [11.1, -1.1, -9.8], [12.7, 0.5, -12.2]],
    [[-12, -2.8, 3.2], [-10.2, -1.5, 1.2], [-8.8, -2.4, -0.6], [-7.1, -0.9, -1.4]]
  ];

  clusters.forEach((cluster) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(cluster.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    group.add(new THREE.Line(geometry, material));
    cluster.forEach(([x, y, z]) => {
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.84, blending: THREE.AdditiveBlending })
      );
      marker.position.set(x, y, z);
      group.add(marker);
    });
  });

  return group;
}

const starTunnel = createStarTunnel();
const nebula = createNebulaLayer();
const arms = createGalaxyArms();
const core = createCore();
const asteroids = createAsteroids();
const nearPlanet = createPlanet({
  radius: isMobile ? 1.45 : 1.9,
  position: new THREE.Vector3(-9.5, -3.4, 7.5),
  color: 0x6f5dff,
  emissive: 0x201047,
  ring: true,
  textureHues: [0.69, 0.78],
  atmosphere: 0x91d7ff
});
const farPlanet = createPlanet({
  radius: 0.82,
  position: new THREE.Vector3(10.5, 4.6, -10.5),
  color: 0x75c9ff,
  emissive: 0x08213a,
  ring: false,
  textureHues: [0.52, 0.58],
  atmosphere: 0xa4fff0
});
const satelliteArray = createSatelliteArray();
const crystalStation = createCrystalStation();
const comets = createComets();
const constellations = createConstellationLines();

galaxyGroup.add(nebula, arms, core, asteroids);
galaxyGroup.rotation.x = 0.32;
depthGroup.add(starTunnel);
planetGroup.add(nearPlanet, farPlanet, satelliteArray);
detailGroup.add(crystalStation, comets, constellations);

const orbitRing = new THREE.Mesh(
  new THREE.TorusGeometry(7.2, 0.018, 12, 260),
  new THREE.MeshBasicMaterial({ color: 0xa89bff, transparent: true, opacity: 0.36, blending: THREE.AdditiveBlending })
);
orbitRing.rotation.x = Math.PI / 2 + 0.32;
galaxyGroup.add(orbitRing);

const secondRing = orbitRing.clone();
secondRing.scale.setScalar(1.55);
secondRing.material = orbitRing.material.clone();
secondRing.material.opacity = 0.18;
galaxyGroup.add(secondRing);

const thirdRing = orbitRing.clone();
thirdRing.scale.setScalar(2.05);
thirdRing.rotation.y = 0.52;
thirdRing.material = orbitRing.material.clone();
thirdRing.material.opacity = 0.1;
galaxyGroup.add(thirdRing);

if (statusEl) statusEl.textContent = "Detailed Galexia: high-detail planetary surfaces, craters, ridges, satellites, station, comets";

function resetCamera() {
  camera.position.copy(defaultCameraPosition);
  controls.target.set(0, 0, 0);
  controls.update();
}

if (resetCameraButton) resetCameraButton.addEventListener("click", resetCamera);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  const pulse = 1 + Math.sin(elapsed * 2.2) * 0.035;

  if (!prefersReducedMotion) {
    galaxyGroup.rotation.y += 0.00135;
    arms.rotation.y += 0.00082;
    nebula.rotation.y -= 0.00042;
    starTunnel.rotation.z += 0.00022;
    asteroids.rotation.y -= 0.0018;
    orbitRing.rotation.z += 0.0024;
    secondRing.rotation.z -= 0.0013;
    thirdRing.rotation.z += 0.0009;
    nearPlanet.userData.planet.rotation.y += 0.0038;
    farPlanet.userData.planet.rotation.y -= 0.0022;
    nearPlanet.userData.atmosphere.rotation.y -= 0.0015;
    farPlanet.userData.atmosphere.rotation.y += 0.0019;
    satelliteArray.rotation.y += satelliteArray.userData.spinSpeed;
    crystalStation.rotation.y += 0.0028;
    crystalStation.rotation.x += 0.0007;
    constellations.rotation.y -= 0.0005;

    comets.children.forEach((comet, index) => {
      comet.position.x += comet.userData.speed;
      comet.position.y += Math.sin(elapsed * 0.8 + index) * 0.002;
      if (comet.position.x > 18) comet.position.x = -18;
    });

    camera.position.x = defaultCameraPosition.x + Math.sin(elapsed * 0.18) * (isMobile ? 0.65 : 1.2);
    camera.position.y = defaultCameraPosition.y + Math.cos(elapsed * 0.16) * 0.5;
    controls.target.x = Math.sin(elapsed * 0.12) * 0.8;
  }

  core.userData.core.scale.setScalar(pulse);
  core.userData.haloA.scale.setScalar(1.04 + Math.sin(elapsed * 1.45) * 0.08);
  core.userData.haloB.scale.setScalar(1.06 + Math.cos(elapsed * 1.05) * 0.1);
  core.userData.crownA.rotation.z += prefersReducedMotion ? 0 : 0.004;
  core.userData.crownB.rotation.x -= prefersReducedMotion ? 0 : 0.003;
  core.userData.crownC.rotation.y += prefersReducedMotion ? 0 : 0.002;
  bloomPass.strength = (isMobile ? 0.72 : 1.05) + Math.sin(elapsed * 1.1) * 0.08;

  controls.update();
  composer.render();
}

animate();

window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.35 : 2));
  composer.setSize(width, height);
  bloomPass.setSize(width, height);
});
