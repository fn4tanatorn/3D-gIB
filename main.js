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

const galaxyGroup = new THREE.Group();
const depthGroup = new THREE.Group();
const planetGroup = new THREE.Group();
scene.add(galaxyGroup, depthGroup, planetGroup);

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
  group.userData = { core, haloA, haloB };
  return group;
}

function createPlanet({ radius, position, color, emissive = 0x111122, ring = false }) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 0.18, roughness: 0.5, metalness: 0.08 });
  const planet = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 64), material);
  group.add(planet);

  if (ring) {
    const ringMesh = new THREE.Mesh(
      new THREE.RingGeometry(radius * 1.55, radius * 2.25, 128),
      new THREE.MeshBasicMaterial({ color: 0xa99cff, transparent: true, opacity: 0.34, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
    );
    ringMesh.rotation.x = Math.PI / 2.7;
    ringMesh.rotation.y = 0.35;
    group.add(ringMesh);
  }

  group.position.copy(position);
  group.userData.planet = planet;
  return group;
}

function createAsteroids(count = isMobile ? 32 : 64) {
  const group = new THREE.Group();
  const geometry = new THREE.IcosahedronGeometry(1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x9b91be, emissive: 0x130e24, roughness: 0.82, metalness: 0.12 });

  for (let i = 0; i < count; i += 1) {
    const asteroid = new THREE.Mesh(geometry, material);
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.45;
    const radius = 11.5 + Math.random() * 8.5;
    asteroid.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 3.6, Math.sin(angle) * radius);
    const scale = 0.08 + Math.random() * 0.32;
    asteroid.scale.set(scale, scale * (0.75 + Math.random() * 0.6), scale * (0.7 + Math.random() * 0.7));
    asteroid.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    group.add(asteroid);
  }

  return group;
}

const starTunnel = createStarTunnel();
const nebula = createNebulaLayer();
const arms = createGalaxyArms();
const core = createCore();
const asteroids = createAsteroids();
const nearPlanet = createPlanet({ radius: isMobile ? 1.45 : 1.9, position: new THREE.Vector3(-9.5, -3.4, 7.5), color: 0x6f5dff, emissive: 0x201047, ring: true });
const farPlanet = createPlanet({ radius: 0.82, position: new THREE.Vector3(10.5, 4.6, -10.5), color: 0x75c9ff, emissive: 0x08213a, ring: false });

galaxyGroup.add(nebula, arms, core, asteroids);
galaxyGroup.rotation.x = 0.32;
depthGroup.add(starTunnel);
planetGroup.add(nearPlanet, farPlanet);

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

if (statusEl) statusEl.textContent = "Fullscreen volumetric 3D galaxy";

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
    nearPlanet.rotation.y += 0.0038;
    farPlanet.rotation.y -= 0.0022;

    camera.position.x = defaultCameraPosition.x + Math.sin(elapsed * 0.18) * (isMobile ? 0.65 : 1.2);
    camera.position.y = defaultCameraPosition.y + Math.cos(elapsed * 0.16) * 0.5;
    controls.target.x = Math.sin(elapsed * 0.12) * 0.8;
  }

  core.userData.core.scale.setScalar(pulse);
  core.userData.haloA.scale.setScalar(1.04 + Math.sin(elapsed * 1.45) * 0.08);
  core.userData.haloB.scale.setScalar(1.06 + Math.cos(elapsed * 1.05) * 0.1);
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
