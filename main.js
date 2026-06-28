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
scene.fog = new THREE.FogExp2(0x03020d, 0.013);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 1200);
const defaultCameraPosition = new THREE.Vector3(0, isMobile ? 7.5 : 5.3, isMobile ? 18 : 15);
camera.position.copy(defaultCameraPosition);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.45 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  isMobile ? 0.62 : 0.9,
  0.36,
  0.08
);
composer.addPass(bloomPass);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.045;
controls.minDistance = 7;
controls.maxDistance = 34;
controls.enablePan = false;
controls.autoRotate = !prefersReducedMotion;
controls.autoRotateSpeed = 0.26;
controls.target.set(0, 0, 0);

scene.add(new THREE.AmbientLight(0x8f9cff, 0.72));

const keyLight = new THREE.PointLight(0xb69cff, 260, 130);
keyLight.position.set(-5, 4, 6);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xd8f0ff, 3.5);
rimLight.position.set(6, 8, 8);
scene.add(rimLight);

const galaxyGroup = new THREE.Group();
scene.add(galaxyGroup);

function createParticleTexture() {
  const size = 128;
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  const context = textureCanvas.getContext("2d");
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.25, "rgba(206,190,255,0.9)");
  gradient.addColorStop(0.58, "rgba(128,112,255,0.28)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const particleTexture = createParticleTexture();

function createGalaxyArms(count = isMobile ? 8500 : 16000) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const color = new THREE.Color();
  const branches = 5;

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;
    const radius = Math.pow(Math.random(), 0.72) * 14.5;
    const branchAngle = ((i % branches) / branches) * Math.PI * 2;
    const spinAngle = radius * 0.54;
    const spread = Math.pow(Math.random(), 2.55) * (0.42 + radius * 0.12);
    const sign = Math.random() < 0.5 ? -1 : 1;

    positions[i3] = Math.cos(branchAngle + spinAngle) * radius + Math.cos(branchAngle + spinAngle + Math.PI / 2) * spread * sign;
    positions[i3 + 1] = (Math.random() - 0.5) * (0.5 + radius * 0.055);
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + Math.sin(branchAngle + spinAngle + Math.PI / 2) * spread * sign;

    const mix = radius / 14.5;
    color.setHSL(0.72 - mix * 0.3 + Math.random() * 0.035, 0.86, 0.62 + Math.random() * 0.28);
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
    sizes[i] = 0.08 + Math.random() * (isMobile ? 0.16 : 0.2);
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    map: particleTexture,
    size: isMobile ? 0.075 : 0.095,
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  return new THREE.Points(geometry, material);
}

function createStarField(count = isMobile ? 3200 : 6200, radius = 135) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;
    const r = 28 + Math.random() * radius;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.68;
    positions[i3 + 2] = r * Math.cos(phi);

    color.setHSL(0.58 + Math.random() * 0.18, 0.38 + Math.random() * 0.4, 0.68 + Math.random() * 0.28);
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    map: particleTexture,
    size: isMobile ? 0.13 : 0.16,
    vertexColors: true,
    transparent: true,
    opacity: 0.84,
    depthWrite: false
  });

  return new THREE.Points(geometry, material);
}

function createNebulaLayer(count = isMobile ? 420 : 760) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;
    const radius = 2 + Math.random() * 18;
    const angle = Math.random() * Math.PI * 2;
    positions[i3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 7;
    positions[i3 + 1] = (Math.random() - 0.5) * 2.4;
    positions[i3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 7;

    color.setHSL(0.68 + Math.random() * 0.12, 0.72, 0.42 + Math.random() * 0.24);
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    map: particleTexture,
    size: isMobile ? 1.15 : 1.55,
    vertexColors: true,
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  return new THREE.Points(geometry, material);
}

function createCore() {
  const group = new THREE.Group();

  const coreGeometry = new THREE.SphereGeometry(0.92, 72, 72);
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8f3ff,
    emissive: 0x9f76ff,
    emissiveIntensity: 2.5,
    roughness: 0.16,
    metalness: 0.06
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  group.add(core);

  const haloGeometry = new THREE.SphereGeometry(1.65, 72, 72);
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: 0x8d72ff,
    transparent: true,
    opacity: 0.24,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const halo = new THREE.Mesh(haloGeometry, haloMaterial);
  group.add(halo);

  group.userData.core = core;
  group.userData.halo = halo;
  return group;
}

const starField = createStarField();
const nebula = createNebulaLayer();
const arms = createGalaxyArms();
const core = createCore();

galaxyGroup.add(nebula, arms, core);
galaxyGroup.rotation.x = 0.28;
scene.add(starField);

const orbitRingGeometry = new THREE.RingGeometry(5.2, 5.23, 192);
const orbitRingMaterial = new THREE.MeshBasicMaterial({ color: 0x9f91ff, transparent: true, opacity: 0.18, side: THREE.DoubleSide });
const orbitRing = new THREE.Mesh(orbitRingGeometry, orbitRingMaterial);
orbitRing.rotation.x = Math.PI / 2 + 0.28;
galaxyGroup.add(orbitRing);

statusEl.textContent = "Live procedural galaxy · drag to orbit · pinch to zoom";

function resetCamera() {
  camera.position.copy(defaultCameraPosition);
  controls.target.set(0, 0, 0);
  controls.update();
}

resetCameraButton.addEventListener("click", resetCamera);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();
  const pulse = 1 + Math.sin(elapsed * 2.2) * 0.035;

  if (!prefersReducedMotion) {
    galaxyGroup.rotation.y += 0.00125;
    arms.rotation.y += 0.00075;
    nebula.rotation.y -= 0.00035;
    starField.rotation.y -= 0.00008;
    starField.rotation.x = Math.sin(elapsed * 0.08) * 0.025;
    orbitRing.rotation.z += 0.0018;
  }

  core.userData.core.scale.setScalar(pulse);
  core.userData.halo.scale.setScalar(1.04 + Math.sin(elapsed * 1.45) * 0.08);
  bloomPass.strength = (isMobile ? 0.62 : 0.9) + Math.sin(elapsed * 1.1) * 0.08;

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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.45 : 2));
  composer.setSize(width, height);
  bloomPass.setSize(width, height);
});
