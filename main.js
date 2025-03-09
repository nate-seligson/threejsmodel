import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
export const w = 48;
export const h = 32;
export const l = 48;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000
);

const axesHelper = new THREE.AxesHelper(5);
axesHelper.position.set(-w / 2, -h / 2, -l / 2);
scene.add(axesHelper);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const cubes = [];

for (let i = 0; i < w; i++) {
  let temp_h = [];
  for (let j = 0; j < h; j++) {
    let temp_l = [];
    for (let k = 0; k < l; k++) {
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        visible: true,
        transparent: true
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.x = i - (w - 1) / 2;
      cube.position.y = j - (h - 1) / 2;
      cube.position.z = -(k - (l - 1) / 2);
      scene.add(cube);
      temp_l.push(cube);
    }
    temp_h.push(temp_l);
  }
  cubes.push(temp_h);
}

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth * 0.7, window.innerHeight);
document.getElementById("content").appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

camera.position.set(0, 0, w);
controls.update();

export function handleHover(coords) {
  const adjustedY = h - 1 - coords.y;
  cubes[coords.x][adjustedY][coords.z].material.color.setHex(0xFF0000);
}

export function hoverOut(coords, color) {
  const adjustedY = h - 1 - coords.y;
  cubes[coords.x][adjustedY][coords.z].material.color.setHex(color);
}

for (let i = 0; i < cubes.length; i++) {
  for (let j = 0; j < cubes[i].length; j++) {
    for (let k = 0; k < cubes[i][j].length; k++) {
      cubes[i][j][k].material.visible = false;
    }
  }
}

export function setLayerVisibility(desiredLayer, axis) {
  cubes.flat(2).forEach(cube => {
    if (!cube.userData?.painted) {
      cube.material.visible = false;
    }
  });

  const ranges = {
    0: { i: desiredLayer, jRange: h, kRange: l },  // YZ
    1: { j: h - 1 - desiredLayer, iRange: w, kRange: l },  // XZ (adjusted)
    2: { k: desiredLayer, iRange: w, jRange: h }   // XY
  }[axis];

  for (let i = 0; i < (ranges.iRange || 1); i++) {
    for (let j = 0; j < (ranges.jRange || 1); j++) {
      for (let k = 0; k < (ranges.kRange || 1); k++) {
        const cube = cubes[
          axis === 0 ? ranges.i : i
        ][
          axis === 1 ? ranges.j : j
        ][
          axis === 2 ? ranges.k : k
        ];
        if (!cube.userData?.painted) {
          cube.material.visible = true;
          cube.material.opacity = 0.1;
          cube.material.transparent = true;
        }
      }
    }
  }

  switch (axis) {
    case 0:
      for (let y = 0; y < h; y++) {
        for (let z = 0; z < l; z++) {
          cubes[desiredLayer][y][z].material.visible = true;
          cubes[desiredLayer][y][z].material.opacity = 0.05;
        }
      }
      break;
    case 1:
      for (let x = 0; x < w; x++) {
        for (let z = 0; z < l; z++) {
          cubes[x][h - 1 - desiredLayer][z].material.visible = true; // Adjusted
          cubes[x][h - 1 - desiredLayer][z].material.opacity = 0.05;
        }
      }
      break;
    case 2:
      for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
          cubes[x][y][desiredLayer].material.visible = true;
          cubes[x][y][desiredLayer].material.opacity = 0.05;
        }
      }
      break;
  }
}

export function paintCube(x, y, z, color = "0xFFFFFF") {
  const adjustedY = h - 1 - y; // Adjust y-coordinate
  const cube = cubes[x][adjustedY][z];
  if (!cube) return;
  cube.material.color.setHex(color);
  cube.material.visible = true;
  cube.material.transparent = false;
  cube.material.opacity = 1;
  cube.userData = cube.userData || {};
  cube.userData.painted = true;
}

export function killCube(x, y, z) {
  const adjustedY = h - 1 - y; // Adjust y-coordinate
  const cube = cubes[x][adjustedY][z];
  cube.material.visible = false;
  cube.material.opacity = 0.1;
  cube.material.transparent = true;
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();