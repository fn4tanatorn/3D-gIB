import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/controls/OrbitControls.js";

const canvas = document.querySelector("#webgl");
const statusEl = document.querySelector("#modelStatus");
const resetCameraButton = document.querySelector("#resetCamera");

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050510, 0.018);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 10);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 4;
controls.maxDistance = 28;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.35;

const ambientLight = new THREE.AmbientLight(0xaeb8ff, 1.15);
scene.add(ambientLight);

const coreLight = new THREE.PointLight(0x9d7cff, 120, 80);
coreLight.position.set(0, 1, 0);
scene.add(coreLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 2.2);
rimLight.position.set(5, 8, 7);
scene.add(rimLight);

const galaxyGroup = new THREE.Group();
scene.add(galaxyGroup);

function createStars(count = 2200, radius = 90) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;
    const r = Math.random() * radius;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = r * Math.cos(phi);

    color.setHSL(0.6 + Math.random() * 0.18, 0.65, 0.72 + Math.random() * 0.25);
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false
  });

  return new THREE.Points(geometry, material);
}

function createGalaxySpiral(count = 6500) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();
  const branches = 5;

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;
    const radius = Math.random() * 7.5;
    const branchAngle = ((i % branches) / branches) * Math.PI * 2;
    const spinAngle = radius * 1.2;
    const randomScale = Math.pow(Math.random(), 3) * 1.4;

    positions[i3] = Math.cos(branchAngle + spinAngle) * radius + (Math.random() - 0.5) * randomScale;
    positions[i3 + 1] = (Math.random() - 0.5) * 0.55 * randomScale;
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + (Math.random() - 0.5) * randomScale;

    const mix = radius / 7.5;
    color.setHSL(0.72 - mix * 0.22, 0.82, 0.65 + Math.random() * 0.18);
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  return new THREE.Points(geometry, material);
}

function createCore() {
  const geometry = new THREE.SphereGeometry(0.85, 64, 64);
  const material = new THREE.MeshStandardMaterial({
    color: 0xf4edff,
    emissive: 0x9b66ff,
    emissiveIntensity: 1.8,
    roughness: 0.18,
    metalness: 0.05
  });

  return new THREE.Mesh(geometry, material);
}

const stars = createStars();
const spiral = createGalaxySpiral();
const core = createCore();

galaxyGroup.add(stars, spiral, core);
galaxyGroup.rotation.x = 0.18;

function loadGalexiaModel() {
  const loader = new GLTFLoader();
  loader.load(
    "./assets/galexia.glb",
    (gltf) => {
      const model = gltf.scene;
      model.name = "Galexia glTF Model";
      model.scale.setScalar(1.4);
      model.position.set(0, 0, 0);
      scene.add(model);
      statusEl.textContent = "Loaded assets/galexia.glb";
    },
    (event) => {
      if (event.total) {
        const progress = Math.round((event.loaded / event.total) * 100);
        statusEl.textContent = `Loading model: ${progress}%`;
      }
    },
    () => {
      statusEl.textContent = "No assets/galexia.glb found. Showing procedural Galexia scene.";
    }
  );
}

loadGalexiaModel();

resetCameraButton.addEventListener("click", () => {
  camera.position.set(0, 3, 10);
  controls.target.set(0, 0, 0);
  controls.update();
});

function animate() {
  requestAnimationFrame(animate);

  galaxyGroup.rotation.y += 0.0012;
  spiral.rotation.y += 0.0009;
  stars.rotation.y -= 0.00025;
  core.scale.setScalar(1 + Math.sin(performance.now() * 0.002) * 0.035);

  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
