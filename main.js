import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
export const w = 64;
export const h = 32;
export const l = 64;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000
);

const axesHelper = new THREE.AxesHelper( 5 );
axesHelper.position.set( -w/2, -h/2, -l/2 );
scene.add( axesHelper );

const geometry = new THREE.BoxGeometry(1, 1, 1);
const cubes = [];

// Build a 3D array for cubes: cubes[i][j][k]
// with i: width, j: height, k: depth.
for (let i = 0; i < w; i++) {
  let temp_h = [];
  for (let j = 0; j < h; j++) {
    let temp_l = [];
    for (let k = 0; k < l; k++) {
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        visible: true,
        transparent:true
      });
      const cube = new THREE.Mesh(geometry, material);
      // Offset by (w-1)/2, (h-1)/2, (l-1)/2 to center the grid.
      cube.position.x = i - (w - 1) / 2;
      cube.position.y = j - (h - 1) / 2;
      // Use negative to keep the same z-direction as your original code.
      cube.position.z = - (k - (l - 1) / 2);
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

// Initialize OrbitControls to allow mouse navigation
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Set an initial position for the camera
camera.position.set(0, 0, w);
controls.update();

export function handleHover(coords) {
    cubes[coords.x][coords.y][coords.z].material.color.setHex(0xFF0000);
}
export function hoverOut(coords) {
  cubes[coords.x][coords.y][coords.z].material.color.setHex(0xFFFFFF);
}
// --- Set visibility for just the bottom plane ---
// If you want the bottom plane, use layer index 0:
for (let i = 0; i < cubes.length; i++) {
    for (let j = 0; j < cubes[i].length; j++) {
      for (let k = 0; k < cubes[i][j].length; k++) {
        cubes[i][j][k].material.visible = false; // Hide all cubes
      }
    }
  }

// In setLayerVisibility function, correct loop bounds
// FIX 6: Correct layer visualization
export function setLayerVisibility(desiredLayer, axis) {
  // First hide all cubes except painted ones
  cubes.flat(2).forEach(cube => {
    if (!cube.userData?.painted) {
      cube.material.visible = false;
    }
  });

  // Then show current layer grid
  const ranges = {
    0: { i: desiredLayer, jRange: h, kRange: l },  // YZ
    1: { j: desiredLayer, iRange: w, kRange: l },  // XZ
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
}

// In paintCube function, ensure color is a number
export function paintCube(x, y, z, color = "0xFFFFFF") {
  const cube = cubes[x][y][z];
  if (!cube) return;
  cube.material.color.setHex(Number(color)); // Convert string to number
  cube.material.visible = true;
  cube.material.transparent = false;
  cube.material.opacity = 1;
  cube.userData = cube.userData || {};
  cube.userData.painted = true; // Track painted state
}
export function killCube(x,y,z){
  const cube = cubes[x][y][z];
  cube.material.visible = false;
  cube.material.opacity = 0.1;
  cube.material.transparent = true;
}

  // Reveal only the selected layer
  switch(axis){
      case 0: // YZ plane (fixed X = desiredLayer)
          for (let y = 0; y < h-1; y++) {
            console.log(y);
              for (let z = 0; z < l-1; z++) {
                  cubes[desiredLayer][y][z].material.visible = true;
                  cubes[desiredLayer][y][z].material.opacity = 0.05;
              }
          }
          break;
      case 1: // XZ plane (fixed Y = desiredLayer)
          for (let x = 0; x < w-1; x++) {
              for (let z = 0; z < l-1; z++) {
                  cubes[x][desiredLayer][z].material.visible = true;
                  cubes[x][desiredLayer][z].material.opacity = 0.05;
              }
          }
          break;
      case 2: // XY plane (fixed Z = desiredLayer)
          for (let x = 0; x < w-1; x++) {
              for (let y = 0; y < h-1; y++) {
                  cubes[x][y][desiredLayer].material.visible = true;
                  cubes[x][y][desiredLayer].material.opacity = 0.05;
              }
          }
          break;
  }


function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
