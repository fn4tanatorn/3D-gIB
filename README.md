# Galexia 3D Web

A browser-based 3D galaxy scene built with Three.js and prepared for glTF/GLB model loading.

## Features

- Three.js WebGL renderer
- glTF/GLB loading with GLTFLoader
- Procedural Galexia fallback scene
- Orbit camera controls
- Responsive layout

## Files

- index.html
- style.css
- main.js
- assets/README.md

## Add a glTF/GLB model

Place your model at assets/galexia.glb.

The app will automatically try to load that file. If the file does not exist, it shows the procedural Galexia scene instead.

## Run locally

```bash
npx serve .
```
