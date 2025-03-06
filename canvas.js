import { paintCube, setLayerVisibility, w, l, h, handleHover, hoverOut, killCube } from "./main";

const canvas = document.getElementById('canvas');
const colorPicker = document.getElementById('colorPicker'); // Reference to color picker
let isDrawing = false;
let selectedColor = "#FFFFFF"; // Default white
let cubeColor = "0xffffff";
const axes = ["x","y","z"];
let axis = 1; // Default axis (1: XZ plane)

function convertToBit(input){
    return input.replace("#","0x")
}
// Update color on change
colorPicker.addEventListener("input", (e) => {
    selectedColor = e.target.value;
    cubeColor = convertToBit(e.target.value);
});

// Build the 3D grid (w x h x l) initialized with null (empty)
// grid[x][y][z]
let grid = [];
for (let x = 0; x < w; x++) {
    let colY = [];
    for (let y = 0; y < h; y++) {
        let rowZ = [];
        for (let z = 0; z < l; z++) {
            rowZ.push(null); // Store color
        }
        colY.push(rowZ);
    }
    grid.push(colY);
}

export let layer = 0;
const pixelElements = [];

// Helper: return canvas dimensions based on axis
function getCanvasDimensions() {
    switch(axis) {
      case 0:  // YZ plane (X fixed)
        return { numRows: h, numCols: l };
      case 1:  // XZ plane (Y fixed)
        return { numRows: w, numCols: l };
      case 2:  // XY plane (Z fixed)
        return { numRows: h, numCols: w };
      default:
        return { numRows: 0, numCols: 0 };
    }
  }

// Create (or recreate) the grid of pixels for the current layer view
export function generateCanvas() {
    const { numRows, numCols } = getCanvasDimensions();
    
    // Clear existing
    canvas.innerHTML = "";
    pixelElements.length = 0;
  
    // Set proper grid dimensions
    canvas.style.gridTemplateColumns = `repeat(${numCols}, 5px)`;
    canvas.style.gridTemplateRows = `repeat(${numRows}, 5px)`;
  
    for (let i = 0; i < numRows * numCols; i++) {
      const pixel = document.createElement('div');
      pixel.classList.add('pixel');
      
      // PROPER 2D MAPPING
      const row = Math.floor(i / numCols);  // Correct row calculation
      const col = i % numCols;              // Correct column calculation
  
      pixel.addEventListener('mousedown', () => handlePixelClick(row, col));
      pixel.addEventListener('mouseover', () => handlePixelHover(row, col));
      pixel.addEventListener('mouseout', () => handleHoverOut(row,col));
      
      canvas.appendChild(pixel);
      pixelElements.push(pixel);
    }
    updateCanvasPixels();
  }

function get3DCoordinates(row, col) {
    switch(axis) {
      case 0:  // YZ plane (X fixed)
        return { x: layer, y: row, z: col };
      case 1:  // XZ plane (Y fixed)
        return { x: row, y: layer, z: col };
      case 2:  // XY plane (Z fixed)
        return { x: col, y: row, z: layer };
    }
  }
  function handlePixelClick(row, col) {
    const coords = get3DCoordinates(row, col);
    if(grid[coords.x][coords.y][coords.z] != null){
        grid[coords.x][coords.y][coords.z] = null;
        killCube(coords.x, coords.y, coords.z);
        updateCanvasPixels();
        return;
    }


    grid[coords.x][coords.y][coords.z] = selectedColor;
    isDrawing = true;
    paintCube(coords.x, coords.y, coords.z, cubeColor);
    updateCanvasPixels();
  }
  function handlePixelHover(row, col) {
    const coords = get3DCoordinates(row, col);
    handleHover(coords);
    if(isDrawing){
        if(grid[coords.x][coords.y][coords.z] != null){
            grid[coords.x][coords.y][coords.z] = null;
            killCube(coords.x, coords.y, coords.z);
            updateCanvasPixels();
            return;
        }

        grid[coords.x][coords.y][coords.z] = selectedColor;
        paintCube(coords.x, coords.y, coords.z, cubeColor);
        updateCanvasPixels();
    }
  }
  function handleHoverOut(row, col){
    const coords = get3DCoordinates(row, col);
    const color = convertToBit(grid[coords.x][coords.y][coords.z]);
    hoverOut(coords, color)
  }

// Update canvas pixels based on the current grid slice
function updateCanvasPixels() {
    const { numRows, numCols } = getCanvasDimensions();
    
    for (let i = 0; i < pixelElements.length; i++) {
      const row = Math.floor(i / numCols);
      const col = i % numCols;
      const coords = get3DCoordinates(row, col);
      
      const color = grid[coords.x][coords.y][coords.z];
      pixelElements[i].style.background = color || 'black';
    }
  }

function changeAxis(){
    axis = (axis + 1) % 3;
    // Reset layer to 0 on axis change (or adjust as needed)
    layer = 0;
    document.getElementById("axis").innerHTML = `Axis: ${axes[axis]}`;
    // Update layer display
    document.getElementById("layer").innerHTML = `Layer: ${layer}`;
    // Update visibility in 3D (if needed)
    setLayerVisibility(layer, axis);
    // Regenerate the canvas with the proper dimensions and events for the new axis
    generateCanvas();
    updateCanvasPixels();
}

// Call generateCanvas initially based on the default axis
generateCanvas();

// Change the layer and update the canvas pixels
function changeLayer(amt) {
    const maxLayers = {
        0: w - 1,  // X axis
        1: h - 1,  // Y axis
        2: l - 1   // Z axis
      };
      
    layer = Math.max(0, Math.min(layer + amt, maxLayers[axis]));
    if (axis === 0) {
        layer = Math.max(0, Math.min(layer, w - 1));
    } else if (axis === 1) {
        layer = Math.max(0, Math.min(layer, h - 1));
    } else if (axis === 2) {
        layer = Math.max(0, Math.min(layer, l - 1));
    }
    document.getElementById("layer").innerHTML = `Layer: ${layer}`;
    setLayerVisibility(layer, axis);
    updateCanvasPixels();
}



let copiedLayerData = null;

export function copyLayerToBuffer() {
  const { numRows, numCols } = getCanvasDimensions();
  copiedLayerData = [];
  
  for (let i = 0; i < numRows; i++) {
    copiedLayerData[i] = [];
    for (let j = 0; j < numCols; j++) {
      const coords = get3DCoordinates(i, j);
      copiedLayerData[i][j] = grid[coords.x][coords.y][coords.z];
    }
  }
}

export function pasteLayerFromBuffer() {
  if (!copiedLayerData) return;
  
  for (let i = 0; i < copiedLayerData.length; i++) {
    for (let j = 0; j < copiedLayerData[i].length; j++) {
      const coords = get3DCoordinates(i, j);
      if (copiedLayerData[i][j]) {
        paintCube(coords.x, coords.y, coords.z, convertToBit(copiedLayerData[i][j]));
        grid[coords.x][coords.y][coords.z] = selectedColor;
      }
    }
  }
  updateCanvasPixels();
}


//save to file
function saveGridToFile() {
    // Convert grid data to compact 3D array format
    const output = {
      dimensions: { w, h, l },
      data: []
    };
  
    // Create Z-layers first for logical grouping
    for (let z = 0; z < l; z++) {
      const zLayer = [];
      for (let y = 0; y < h; y++) {
        const yRow = [];
        for (let x = 0; x < w; x++) {
          // Convert color to hex string without alpha
          yRow.push(grid[x][y][z] ? 
            Number(convertToBit(grid[x][y][z])): 
            null
          );
        }
        zLayer.push(yRow);
      }
      output.data.push(zLayer);
    }
  
    // Create downloadable file
    const dataStr = JSON.stringify(output, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `voxel-grid-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
document.getElementById("layerup").addEventListener("click", () => changeLayer(1));
document.getElementById("layerdown").addEventListener("click", () => changeLayer(-1));
document.getElementById("axis_button").addEventListener("click", () => changeAxis());
document.getElementById("copy").addEventListener("click", () => copyLayerToBuffer());
document.getElementById("paste").addEventListener("click", () => pasteLayerFromBuffer());
document.getElementById("save").addEventListener("click", () => saveGridToFile());
document.addEventListener('mouseup', () => { isDrawing = false; });
