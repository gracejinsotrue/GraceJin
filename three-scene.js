// three-scene.js with organized section-based structure


// ============================================================
// GLOBAL SCENE SETUP
// ============================================================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
document.getElementById('container').appendChild(renderer.domElement);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Optional: for softer shadows
// Lighting
const ambientLight = new THREE.AmbientLight(0xfff2cc, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffe699, 0.8);

directionalLight.position.set(0, 1, 1);
directionalLight.castShadow = true;

directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
scene.add(directionalLight);






// Set up raycaster for mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// ============================================================
// SECTION MANAGEMENT
// ============================================================
// Arrays to store objects by section
const sectionObjects = {
    section1: {
        parallaxLayers: [],
        clickableObjects: [],
        nonClickableObjects: []
    },
    section2: {
        parallaxLayers: [],
        clickableObjects: []
    },
    section3: {
        parallaxLayers: [],
        clickableObjects: []
    }
};


// const panLimits = {
//     minX: -3,  // Maximum left pan
//     maxX: 3,   // Maximum right pan
//     minY: 0,  // Maximum up pan
//     maxY: 0    // Maximum down pan
// };


// Animation planes are global
let normalAnimationPlane = null;
let thumbsUpAnimationPlane = null;
let thumbsDownAnimationPlane = null;



// Animation and frame state
const animationState = {
    introComplete: false,
    introProgress: 0,
    introSpeed: 0.02,
    introDelay: 0.2,
    layersLoaded: 0,
    totalLayers: 5
};

const frameAnimation = {
    normalFrames: [],
    thumbsUpFrames: [],
    thumbsDownFrames: [],
    normalFrameIndex: 0,
    thumbsUpFrameIndex: 0,
    thumbsDownFrameIndex: 0,
    fps: 12,
    lastFrameTime: 0,
    framesLoaded: false,
    transitionDelay: 500,
    transitionInProgress: false
};

// Variables for scroll interaction
let currentSection = 0;
let targetSection = 0;
let scrollY = 0;
let scrollingEnabled = false;


// Add these variables for zoom and pan control
let zoomLevel = 1;
const zoomSpeed = 0.1;
const minZoom = 0.5;
const maxZoom = 3;
const panSpeed = 0.05;
let isPanning = false;
let keysPressed = {};

// Add to your variables at the top
const panKeys = {
    left: 'a',    // A key to pan left
    right: 'd',   // D key to pan right
    up: 'w',      // W key to pan up
    down: 's'     // S key to pan down
};
// Animation state for the bowl
const bowlAnimation = {
    frames: [],
    currentFrame: 0,
    frameCount: 3,  // 3 frames total
    isClickable: true,
    imagePath: 'assets/images/bowl1.png'  // Path to display when clicked
};

// Animation state for the tea
const teaAnimation = {
    frames: [],
    currentFrame: 0,
    frameCount: 8,  // 
    isClickable: true,
    imagePath: 'assets/images/tea1.png',  // Path to display when clicked
    framesLoaded: 0,
    transitionDuration: 3, // 3 seconds per frame
    lastTransitionTime: 0
};

// Animation state for the soy sauce
const soySauceAnimation = {
    frames: [],
    currentFrame: 0,
    frameCount: 4,
    isClickable: true,
    imagePath: 'assets/images/soysauce1.png',  // Path to display when clicked
    framesLoaded: 0,
    transitionDuration: 0.5, // 3 seconds per frame
    lastTransitionTime: 0
};

// Animation state for the spring rolls
const springRollsAnimation = {
    frames: [],
    currentFrame: 0,
    frameCount: 3,  // 3 frames for spring rolls
    isClickable: true,
    imagePath: 'assets/images/springrolls1.png',  // Path to display when clicked
    framesLoaded: 0,
    transitionDuration: 0.5,
    lastTransitionTime: 0
};


// Initialize variables for model interaction (part 2 for now)
let modelContainer = null;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let modelRotation = { x: 0, y: 0 };
let modelLoaded = false;
// ============================================================
// UTILITY FUNCTIONS
// ============================================================


function createStaticText() {
    const fontLoader = new THREE.FontLoader();
    const textDepth = -6; // Same depth as your animated text

    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
        // Create text geometry with larger size
        const textGeometry = new THREE.TextGeometry('GRACE JIN', {
            font: font,
            size: 2,
            height: 0.1,
            curveSegments: 12,
            bevelEnabled: false
        });

        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);

        // Center the text horizontally
        textGeometry.center();

        // Position above the animated text
        textMesh.position.set(-1.5, 6.5, textDepth); // Higher y-position than animated text
        textMesh.rotation.x = -0.2; // Same tilt as animated text

        scene.add(textMesh);
    });
}

function createStaticText2() {
    const fontLoader = new THREE.FontLoader();
    const textDepth = -6; // Same depth as your animated text

    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
        // Create text geometry with larger size
        const textGeometry = new THREE.TextGeometry('Cornell CS + AI \'27 ', {
            font: font,
            size: 0.5,
            height: 0.1,
            curveSegments: 12,
            bevelEnabled: false
        });

        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);

        // Center the text horizontally
        textGeometry.center();

        // Position above the animated text
        textMesh.position.set(-1.5, 5, textDepth); // Higher y-position than animated text
        textMesh.rotation.x = -0.2; // Same tilt as animated text

        scene.add(textMesh);
    });
}
function createAnimatedText() {
    const fontLoader = new THREE.FontLoader();
    const textDepth = -6;

    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
        const textGeometry = new THREE.TextGeometry('', {
            font: font,
            size: 0.5,
            height: 0.1,
            curveSegments: 12,
            bevelEnabled: false
        });
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);

        textMesh.position.set(-1.5, 4, textDepth);
        textMesh.rotation.x = -0.2;
        scene.add(textMesh);

        // Array of words to cycle through
        const words = ["Software Developer.", "Designer.", "Digital Artist.", "Content Creator.", "Cancer Survivor."];
        let wordIndex = 0;
        let currentText = '';
        let isTyping = true;
        let charIndex = 0;
        let lastUpdateTime = 0;
        const typingSpeed = 50; // milliseconds per character

        // Add debug logging
        console.log("Starting text animation with words:", words);

        function animateText(currentTime) {
            // Only update the text at specified intervals
            if (currentTime - lastUpdateTime > typingSpeed) {
                lastUpdateTime = currentTime;

                if (isTyping) {
                    // Get the current word from the array
                    const currentWord = words[wordIndex];

                    if (charIndex < currentWord.length) {
                        currentText += currentWord[charIndex];
                        charIndex++;
                    } else {
                        // Pause at the end of typing before backspacing
                        isTyping = false;
                        // Don't immediately start backspacing - wait a bit
                        setTimeout(() => {
                            lastUpdateTime = performance.now(); // Reset timer
                        }, 1000);
                    }
                } else {
                    if (currentText.length > 0) {
                        currentText = currentText.slice(0, -1);
                    } else {
                        // Move to the next word when backspacing is complete
                        wordIndex = (wordIndex + 1) % words.length;
                        console.log("Switching to next word, index:", wordIndex, "word:", words[wordIndex]);

                        // Switch back to typing after a short delay
                        isTyping = true;
                        charIndex = 0;
                        // Don't immediately start typing - wait a bit
                        setTimeout(() => {
                            lastUpdateTime = performance.now(); // Reset timer
                        }, 500);
                    }
                }

                // Only update geometry when text changes
                textMesh.geometry.dispose();
                textMesh.geometry = new THREE.TextGeometry(currentText, {
                    font: font,
                    size: 0.5,
                    height: 0.1,
                    curveSegments: 12,
                    bevelEnabled: false
                });

                textMesh.geometry.center();
            }

            // Continue animation loop
            requestAnimationFrame(animateText);
        }

        // Start the animation with timestamp
        requestAnimationFrame(animateText);
    });
}
function calculateFullscreenSize(distanceFromCamera, extraMargin = 0.1) { //should extra margin be in the param
    const fov = camera.fov * (Math.PI / 180);
    const visibleHeight = 2 * Math.tan(fov / 2) * Math.abs(distanceFromCamera - camera.position.z);
    const visibleWidth = visibleHeight * camera.aspect;
    return {
        width: visibleWidth * (1 + extraMargin),
        height: visibleHeight * (1 + extraMargin)
    };
}

function calculateFullscreenSizeW(distanceFromCamera, extraMargin = 0.1, widthMultiplier = 1.0) {
    const fov = camera.fov * (Math.PI / 180);
    const visibleHeight = 2 * Math.tan(fov / 2) * Math.abs(distanceFromCamera - camera.position.z);
    const visibleWidth = visibleHeight * camera.aspect;
    return {
        width: visibleWidth * (1 + extraMargin) * widthMultiplier,
        height: visibleHeight * (1 + extraMargin)
    };
}

function loadInteractiveModel() {
    // Create a container for the model
    modelContainer = new THREE.Object3D();
    modelContainer.scale.set(1, 1, 1);
    modelContainer.position.set(-6, -window.innerHeight / 45 + 10, -1);
    modelContainer.rotation.x = (Math.PI / 2);
    modelContainer.rotation.y = (Math.PI / 2);
    scene.add(modelContainer);

    console.log("Model container added to scene");

    if (typeof storeLayerOriginalPosition === 'function') {
        storeLayerOriginalPosition(modelContainer);
    } else {
        console.warn("storeLayerOriginalPosition is not defined - this may affect controls");
    }

    // Initialize the GLTF loader
    const loader = new THREE.GLTFLoader();

    // For drag functionality
    let isDragging = false;
    let previousMousePosition = {
        x: 0,
        y: 0
    };
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const dragOffset = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const intersection = new THREE.Vector3();

    // Load the model
    loader.load(
        'assets/orange.glb',
        function (gltf) {
            console.log('Model loaded successfully');

            const model = gltf.scene;




            // Compute bounding box
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDimension = Math.max(size.x, size.y, size.z);

            // Scale model to reasonable size
            const scaleFactor = 2 / maxDimension;
            model.scale.set(scaleFactor, scaleFactor, scaleFactor);

            // Recompute bounding box after scaling
            box.setFromObject(model);
            const newCenter = box.getCenter(new THREE.Vector3());

            // Center model to pivot (X and Z), but adjust Y to be higher in view
            model.position.sub(newCenter);
            model.position.y += size.y;

            // Add the model to the container
            modelContainer.add(model);

            modelLoaded = true;

            // Add click event listener to the model
            model.traverse(function (object) {
                if (object.isMesh) {
                    object.castShadow = true;
                    object.userData.clickable = true;
                    object.userData.originalName = object.name;
                }
            });

            // Mouse down event - start dragging
            document.addEventListener('mousedown', function (event) {
                // Convert mouse position to normalized device coordinates
                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

                // Update the raycaster with the camera and mouse position
                raycaster.setFromCamera(mouse, camera);

                // Calculate objects intersecting the ray
                const intersects = raycaster.intersectObjects(model.children, true);

                if (intersects.length > 0) {
                    isDragging = true;

                    // Save mouse position
                    previousMousePosition = {
                        x: event.clientX,
                        y: event.clientY
                    };

                    // Calculate drag plane
                    dragPlane.setFromNormalAndCoplanarPoint(
                        camera.getWorldDirection(dragPlane.normal),
                        intersects[0].point
                    );

                    // Calculate the offset between the intersection point and the model position
                    raycaster.ray.intersectPlane(dragPlane, intersection);
                    modelContainer.worldToLocal(intersection.clone());
                    dragOffset.copy(intersection).sub(modelContainer.position);

                    // Prevent other events
                    event.preventDefault();
                }
            });

            // Mouse move event - perform dragging
            document.addEventListener('mousemove', function (event) {
                if (isDragging) {
                    // Update the raycaster with new mouse position
                    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
                    raycaster.setFromCamera(mouse, camera);

                    // Find intersection with the drag plane
                    if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
                        // Update model position, excluding the offset
                        modelContainer.position.copy(intersection).sub(dragOffset);
                    }

                    // Prevent other events
                    event.preventDefault();
                }
            });

            // Mouse up event - stop dragging
            document.addEventListener('mouseup', function () {
                if (isDragging) {
                    isDragging = false;

                    // Log the new position
                    console.log('Model dragged to position:', {
                        x: modelContainer.position.x,
                        y: modelContainer.position.y,
                        z: modelContainer.position.z
                    });
                }
            });

            // Click event for logging (optional, can be removed if not needed)
            document.addEventListener('click', function (event) {
                if (!isDragging) {  // Only log if not dragging
                    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
                    raycaster.setFromCamera(mouse, camera);
                    const intersects = raycaster.intersectObjects(model.children, true);

                    // if (intersects.length > 0) {
                    //     const clickedObject = intersects[0].object;
                    //     const worldPosition = new THREE.Vector3();
                    //     clickedObject.getWorldPosition(worldPosition);

                    //     console.log('Model clicked! Current position:');
                    //     console.log('Model container position:', {
                    //         x: modelContainer.position.x,
                    //         y: modelContainer.position.y,
                    //         z: modelContainer.position.z
                    //     });
                    //     console.log('Model container rotation:', {
                    //         x: (modelContainer.rotation.x * 180 / Math.PI).toFixed(2) + '°',
                    //         y: (modelContainer.rotation.y * 180 / Math.PI).toFixed(2) + '°',
                    //         z: (modelContainer.rotation.z * 180 / Math.PI).toFixed(2) + '°'
                    //     });
                    //     console.log('Clicked object position:', {
                    //         x: worldPosition.x,
                    //         y: worldPosition.y,
                    //         z: worldPosition.z
                    //     });
                    //     console.log('Clicked object name:', clickedObject.userData.originalName || clickedObject.name);
                    // }
                }
            });
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error('Error loading model:', error);
        }
    );

    return modelContainer;
}
// Function to update model visibility based on current section
function updateModelVisibility() {
    if (!modelLoaded || !modelContainer) return;

    // Show model only when in section 2 (with some buffer for transition)
    if (currentSection >= 0.75 && currentSection <= 1.75) {
        modelContainer.visible = true;
    } else {
        modelContainer.visible = false;
    }
}




function setupPartialVisibility(plane, visiblePortion = 0.4) {
    // Create a clipping plane that only shows the top portion
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);

    // Store the original plane parameters
    plane.userData.clipPlane = clipPlane;
    plane.userData.fullHeight = plane.geometry.parameters.height;
    plane.userData.visiblePortion = visiblePortion;

    // Enable clipping on the material
    plane.material.clippingPlanes = [clipPlane];
    plane.material.clipIntersection = false;

    // Enable clipping in the renderer
    renderer.localClippingEnabled = true;

    // Set initial clipping position to show only the top portion
    updateClipPlane(plane, 0);
}

function updateClipPlane(plane, scrollPosition) {
    if (!plane || !plane.userData.clipPlane) return;

    const clipOffset = plane.userData.fullHeight * (0.5 - plane.userData.visiblePortion / 2);
    const revealAmount = scrollPosition * clipOffset;

    plane.userData.clipPlane.constant = clipOffset - revealAmount;
}

// Update the keyboard controls
function setupKeyboardControls() {
    // Listen for key down events
    document.addEventListener('keydown', function (event) {
        // Store key state
        keysPressed[event.key.toLowerCase()] = true;

        // Handle zoom controls for all sections
        if (event.key === '+' || event.key === '=') {
            zoomIn();
        }
        else if (event.key === '-' || event.key === '_') {
            zoomOut();
        }
        // Check if it's a pan key (WASD)
        else if (Object.values(panKeys).includes(event.key.toLowerCase())) {
            isPanning = true;
        }
    });

    // Listen for key up events
    document.addEventListener('keyup', function (event) {
        // Clear key state
        keysPressed[event.key.toLowerCase()] = false;

        // Check if any pan keys are still pressed
        if (Object.values(panKeys).some(key => keysPressed[key])) {
            isPanning = true;
        } else {
            isPanning = false;
        }
    });

    // Add a visual control panel with updated instructions
    addControlPanel();
}


// Function to zoom in for all sections
function zoomIn() {
    // For section 1
    if (currentSection < 0.5) {
        // Zoom in section 1 elements
        zoomSection(sectionObjects.section1.parallaxLayers);
    }
    // For section 2
    else if (currentSection >= 0.5 && currentSection < 1.5) {
        // Zoom model if it exists
        if (modelContainer && modelContainer.userData.pivot) {
            zoomLevel = Math.min(maxZoom, zoomLevel + zoomSpeed);
            modelContainer.userData.pivot.scale.set(zoomLevel, zoomLevel, zoomLevel);
        }
        // Zoom section 2 elements
        zoomSection(sectionObjects.section2.parallaxLayers);
    }
    // For section 3
    else if (currentSection >= 1.5) {
        // Zoom section 3 elements
        zoomSection(sectionObjects.section3.parallaxLayers);
    }
}

// Function to zoom out for all sections
function zoomOut() {
    // For section 1
    if (currentSection < 0.5) {
        // Zoom out section 1 elements
        zoomSectionOut(sectionObjects.section1.parallaxLayers);
    }
    // For section 2
    else if (currentSection >= 0.5 && currentSection < 1.5) {
        // Zoom out model if it exists
        if (modelContainer && modelContainer.userData.pivot && zoomLevel > minZoom) {
            zoomLevel = Math.max(minZoom, zoomLevel - zoomSpeed);
            modelContainer.userData.pivot.scale.set(zoomLevel, zoomLevel, zoomLevel);
        }
        // Zoom out section 2 elements
        zoomSectionOut(sectionObjects.section2.parallaxLayers);
    }
    // For section 3
    else if (currentSection >= 1.5) {
        if (!isZoomedIn || !currentZoomedObject) return;

        console.log("Zooming out...");

        gsap.to(currentZoomedObject.scale, {
            x: currentZoomedObject.userData.originalScale.x,
            y: currentZoomedObject.userData.originalScale.y,
            z: currentZoomedObject.userData.originalScale.z,
            duration: 0.8,
            ease: "power2.out",
            onComplete: () => {
                console.log("Zoom-out complete, object is back to normal.");
                isZoomedIn = false;
                currentZoomedObject = null;
            }
        });

        // Restore other properties if needed
        gsap.to(currentZoomedObject.position, {
            x: currentZoomedObject.userData.originalX,
            y: currentZoomedObject.userData.originalY,
            z: currentZoomedObject.userData.originalZ,
            duration: 0.8,
            ease: "power2.out"
        });

        gsap.to(currentZoomedObject.rotation, {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.8,
            ease: "power2.out"
        });

        // Remove overlay and back button
        removeOverlay();
        removeBackButton();

        // Enable scrolling again
        scrollingEnabled = true;

        // Remove click outside handler
        document.removeEventListener('click', handleClickOutside);
    }
}

// Helper function to zoom in a section's layers
function zoomSection(layers) {
    if (!layers) return;

    layers.forEach(layer => {
        if (!layer.userData.zoomLevel) {
            layer.userData.zoomLevel = 1;
        }

        layer.userData.zoomLevel = Math.min(maxZoom, layer.userData.zoomLevel + zoomSpeed);
        layer.scale.set(
            layer.userData.zoomLevel,
            layer.userData.zoomLevel,
            layer.userData.zoomLevel
        );
    });
}


// Helper function to zoom out a section's layers
function zoomSectionOut(layers) {
    if (!layers) return;

    layers.forEach(layer => {
        if (!layer.userData.zoomLevel) {
            layer.userData.zoomLevel = 1;
        }

        layer.userData.zoomLevel = Math.max(minZoom, layer.userData.zoomLevel - zoomSpeed);
        layer.scale.set(
            layer.userData.zoomLevel,
            layer.userData.zoomLevel,
            layer.userData.zoomLevel
        );
    });
}

// Function to process panning for all sections
function processPanning() {
    if (!isPanning) return;

    // Get the current active section layers
    let currentLayers = [];

    if (currentSection < 0.5) {
        currentLayers = sectionObjects.section1.parallaxLayers;

        // Process panning for section 1
        processSectionPanning(currentLayers);
    }
    else if (currentSection >= 0.5 && currentSection < 1.5) {
        // Pan the model in section 2

        processModelPanning();

        currentLayers = sectionObjects.section2.parallaxLayers;
        processSectionPanning(currentLayers);
        if (modelContainer) {
            const panAmount = panSpeed * zoomLevel;

            // Pan left/right
            if (keysPressed['ArrowLeft'] && keysPressed['Shift']) {
                modelContainer.position.x += panAmount;
            } else if (keysPressed['ArrowRight'] && keysPressed['Shift']) {
                modelContainer.position.x -= panAmount;
            }

            // Pan up/down
            if (keysPressed['ArrowUp'] && keysPressed['Shift']) {
                modelContainer.position.y -= panAmount;
            } else if (keysPressed['ArrowDown'] && keysPressed['Shift']) {
                modelContainer.position.y += panAmount;
            }
        }

        // Also pan section 2 layers
        currentLayers = sectionObjects.section2.parallaxLayers;
        processSectionPanning(currentLayers);
    }
    else if (currentSection >= 1.5) {
        currentLayers = sectionObjects.section3.parallaxLayers;

        // Process panning for section 3
        processSectionPanning(currentLayers);
    }
}

// Fix the processSectionPanning function to include limits
function processSectionPanning(layers) {
    if (!layers) return;

    const panAmount = panSpeed;

    // Define pan limits
    const panLimits = {
        minX: -3, // Maximum distance to the left
        maxX: 3,  // Maximum distance to the right
        minY: 0,  // Maximum distance up
        maxY: 0    // Maximum distance down
    };

    layers.forEach(layer => {
        // Skip objects explicitly marked with noPanning
        if (layer.userData.noPanning === true) return;

        // Store original position if not already stored
        if (layer.userData.originalPanX === undefined) {
            layer.userData.originalPanX = layer.position.x;
            layer.userData.originalPanY = layer.position.y;
        }

        // Calculate new position based on current position
        let newX = layer.position.x;
        let newY = layer.position.y;

        // Pan left/right with limits
        if (keysPressed['a']) {
            // Calculate the distance from original position
            const currentOffsetX = layer.position.x - layer.userData.originalPanX;

            // Only allow panning if within limits
            if (currentOffsetX < panLimits.maxX) {
                newX = layer.position.x + panAmount;
            }
        } else if (keysPressed['d']) {
            // Calculate the distance from original position
            const currentOffsetX = layer.userData.originalPanX - layer.position.x;

            // Only allow panning if within limits
            if (currentOffsetX < panLimits.maxX) {
                newX = layer.position.x - panAmount;
            }
        }

        // Pan up/down with limits
        if (keysPressed['w']) {
            // Calculate the distance from original position
            const currentOffsetY = layer.userData.originalPanY - layer.position.y;

            // Only allow panning if within limits
            if (currentOffsetY < panLimits.maxY) {
                newY = layer.position.y - panAmount;
            }
        } else if (keysPressed['s']) {
            // Calculate the distance from original position
            const currentOffsetY = layer.position.y - layer.userData.originalPanY;

            // Only allow panning if within limits
            if (currentOffsetY < panLimits.maxY) {
                newY = layer.position.y + panAmount;
            }
        }

        // Apply new position
        layer.position.x = newX;
        layer.position.y = newY;
    });
}

// Function to add visual control panel
function addControlPanel() {
    const panel = document.createElement('div');
    panel.className = 'model-controls';
    panel.innerHTML = `
        <div class="controls-panel">
            <h3>Controls</h3>
            <p><strong>Rotate Model:</strong> Click and drag</p>
            <p><strong>Zoom:</strong> + / - keys</p>
            <p><strong>Pan:</strong> W/A/S/D keys</p>
            <button id="reset-view">Reset View</button>
        </div>
    `;
    // Add styles for the control panel
    const style = document.createElement('style');
    style.textContent = `
        .model-controls {
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 1000;
            opacity: 1;
            transition: opacity 0.3s ease;
            pointer-events: auto;
        }
        .controls-panel {
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px 15px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            max-width: 200px;
        }
        .controls-panel h3 {
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .controls-panel p {
            margin: 5px 0;
        }
        #reset-view {
            background-color: #4285f4;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            margin-top: 10px;
            cursor: pointer;
        }
        #reset-view:hover {
            background-color: #3367d6;
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(panel);

    // Reset button functionality
    document.getElementById('reset-view').addEventListener('click', function () {
        resetAllViews();
    });
}

// Function to reset all views
function resetAllViews() {
    // Reset model in section 2
    if (modelContainer && modelContainer.userData.pivot) {
        // Reset rotation
        modelRotation.x = 0;
        modelRotation.y = 0;
        modelContainer.userData.pivot.rotation.set(0, 0, 0);

        // Reset zoom
        zoomLevel = 1;
        modelContainer.userData.pivot.scale.set(1, 1, 1);

        // Reset position using stored original position
        if (modelContainer.userData.originalX !== undefined) {
            modelContainer.position.set(
                modelContainer.userData.originalX,
                modelContainer.userData.originalY,
                modelContainer.userData.originalZ
            );
        } else {
            // Fallback if original position wasn't stored
            const sectionOffset = -window.innerHeight / 45 + 1;
            modelContainer.position.set(0, sectionOffset, -3);
        }
    }

    // Reset all section layers
    Object.values(sectionObjects).forEach(section => {
        if (section.parallaxLayers) {
            section.parallaxLayers.forEach(layer => {
                // Reset zoom
                layer.userData.zoomLevel = 1;
                layer.scale.set(1, 1, 1);

                // Reset position using stored original position
                if (layer.userData.originalX !== undefined) {
                    // For parallax layers, we need to maintain current Y for scrolling
                    const currentY = layer.position.y;
                    layer.position.set(
                        layer.userData.originalX,
                        currentY,  // Keep current Y for proper scrolling
                        layer.userData.originalZ
                    );
                }
            });
        }
    });


    console.log("All views reset");
}
// Store original positions when creating layers
// Add this to your layer creation functions: /dunno about this one gang
function storeLayerOriginalPosition(layer) {
    layer.userData.originalX = layer.position.x;
    layer.userData.originalY = layer.position.y;
    layer.userData.originalZ = layer.position.z;
}

// Call this for each layer you create
// For example, add to createImageLayer, createSection2ImageLayer, etc.

// ============================================================
// SECTION 1: GROCERY STORE / MAIN PARALLAX
// ============================================================



// Track which items have been clicked
const groceryItems = {
    greenonion: { name: "Green Onion", collected: false },
    ginger: { name: "Ginger", collected: false },
    soysauce: { name: "Soy Sauce", collected: false },
    garlic: { name: "Garlic", collected: false }



};


// Initialize the HTML for the grocery list
function initializeGroceryList() {
    const groceryListElement = document.getElementById('grocery-list');

    // Clear existing content
    const listElement = groceryListElement.querySelector('ul');
    listElement.innerHTML = '';

    // Add each item to the list
    Object.entries(groceryItems).forEach(([key, item]) => {
        const listItem = document.createElement('li');
        listItem.setAttribute('data-item', key);
        listItem.textContent = item.name;
        if (item.collected) {
            listItem.classList.add('checked');
        }
        listElement.appendChild(listItem);
    });

    console.log("Grocery list initialized with items:", Object.keys(groceryItems));
}

// Function to check if all items are collected
function checkAllItemsCollected() {
    return Object.values(groceryItems).every(item => item.collected === true);
}


// Function to update the grocery list UI
function updateGroceryList(itemKey) {
    console.log("Updating grocery list for item:", itemKey);

    // Update the model data
    if (groceryItems[itemKey]) {
        groceryItems[itemKey].collected = true;

        // Update the UI
        const listItem = document.querySelector(`#grocery-list li[data-item="${itemKey}"]`);
        if (listItem) {
            listItem.classList.add('checked');
            console.log(`Marked ${itemKey} as collected`);
        } else {
            console.error(`List item element for ${itemKey} not found`);
        }

        // Check if all items are collected
        if (checkAllItemsCollected()) {
            document.getElementById('congrats-message').style.display = 'block';
            console.log("All items collected! Showing congratulations message.");
        }
    } else {
        console.error(`Item ${itemKey} not found in groceryItems`);
    }
}


// Modify the onMouseClick function to handle grocery item clicks
function onMouseClick(event) {
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

    const allClickableObjects = [];
    Object.values(sectionObjects).forEach(section => {
        if (section.clickableObjects) {
            allClickableObjects.push(...section.clickableObjects);
        }
    });
    console.log("Checking for clicks. Clickable objects:", allClickableObjects.length);

    const intersects = raycaster.intersectObjects(allClickableObjects);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        console.log("Clicked object:", clickedObject.userData);

        // Check if the clicked object is a grocery item
        if (clickedObject.userData.name && collectedItems[clickedObject.userData.name] !== undefined) {
            console.log("Collected item:", clickedObject.userData.name); // Debugging
            // Mark the item as collected
            collectedItems[clickedObject.userData.name] = true;

            // Update the grocery list UI
            updateGroceryList(clickedObject.userData.name);

            // Optionally, hide or disable the clicked object
            clickedObject.visible = false;
        }

    }
}


// Enhanced mouse click handler that works with your existing object structure
function enhancedMouseClick(event) {
    // Get mouse position in normalized device coordinates
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

    // Collect all clickable objects
    const allClickableObjects = [];
    Object.values(sectionObjects).forEach(section => {
        if (section.clickableObjects) {
            allClickableObjects.push(...section.clickableObjects);
        }
    });

    console.log("Checking for clicks. Clickable objects:", allClickableObjects.length);

    // Make raycaster more sensitive
    raycaster.params.Points.threshold = 0.2;
    raycaster.params.Line.threshold = 0.2;

    // Check for intersections
    const intersects = raycaster.intersectObjects(allClickableObjects, true);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        console.log("Clicked object userData:", clickedObject.userData);

        // First, handle your URL functionality if it exists
        if (clickedObject.userData.url && clickedObject.userData.url !== '') {
            window.open(clickedObject.userData.url, '_blank');
        }

        // Then, check if it's a grocery item
        if (clickedObject.userData.name && groceryItems[clickedObject.userData.name]) {
            console.log("Collected item:", clickedObject.userData.name);

            // Update the grocery list
            updateGroceryList(clickedObject.userData.name);

            // Optionally, hide the clicked object
            // clickedObject.visible = false; // Uncomment if you want items to disappear
        }
    } else {
        console.log("No intersections found");
    }
}

// Function to initialize the grocery system using your existing object creation function
function initializeEnhancedGrocerySystem() {
    // Initialize the grocery list UI
    initializeGroceryList();

    // Replace the existing click handler with our enhanced version

    window.addEventListener('click', enhancedMouseClick);

    // Improve raycaster sensitivity
    if (raycaster) {
        raycaster.params.Points.threshold = 0.2;
        raycaster.params.Line.threshold = 0.2;
    }

    console.log("Enhanced grocery system initialized");
}
function createSection1ImageLayer(zPosition, imagePath, speed, initialOffset = 3, name = '', isClickable = false, url = '', heightPosition = 0) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imagePath, (texture) => {
        const size = calculateFullscreenSizeW(zPosition, 0.1, 1.2); //CHANGE SECOND PARAM FOR SCALE PURPOSES

        const geometry = new THREE.PlaneGeometry(size.width, size.height);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });

        const plane = new THREE.Mesh(geometry, material);
        plane.position.z = zPosition - 0.5;

        // Set initial position for intro animation
        plane.position.y = initialOffset;

        // Apply the height position parameter
        plane.userData = {
            section: 'section1',
            name: name,
            parallaxSpeed: speed,
            targetY: heightPosition, // Modified to use the new parameter
            initialOffset: initialOffset,
            initialDelay: animationState.layersLoaded * animationState.introDelay,
            originalScale: plane.scale.clone(),
            isClickable: isClickable,
            url: url,
            hoverScale: new THREE.Vector3(1.05, 1.05, 1.05),
            isHovered: false
        };

        scene.add(plane);
        sectionObjects.section1.parallaxLayers.push(plane);
        storeLayerOriginalPosition(modelContainer);

        // Add to clickable objects if needed
        if (isClickable) {
            sectionObjects.section1.clickableObjects.push(plane);
        }

        animationState.layersLoaded++;

        window.addEventListener('resize', () => {
            const newSize = calculateFullscreenSize(zPosition);
            plane.geometry.dispose();
            plane.geometry = new THREE.PlaneGeometry(newSize.width, newSize.height);
        });
    });
}
function createSection1NonClickableObject(imagePath, position, size, parallaxSpeed, url, name = '', initialOffset = 5) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imagePath, (texture) => {
        const geometry = new THREE.PlaneGeometry(size.width, size.height);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });

        const plane = new THREE.Mesh(geometry, material);

        // Set initial position
        plane.position.set(position.x, position.y + initialOffset, position.z);

        // Store metadata for both parallax and clickable functionality
        plane.userData = {
            section: 'section1',
            parallaxSpeed: parallaxSpeed,
            initialOffset: initialOffset,
            initialDelay: animationState.layersLoaded * animationState.introDelay,
            originY: position.y,
            isClickable: true,
            url: url,
            name: name,
            originalScale: new THREE.Vector3(1, 1, 1),
            hoverScale: new THREE.Vector3(1, 1, 1),
            isHovered: false
        };

        scene.add(plane);
        sectionObjects.section1.nonClickableObjects.push(plane);
        sectionObjects.section1.parallaxLayers.push(plane);

        animationState.layersLoaded++;

        console.log(`Created section 1 clickable object: ${name}`);
    });
}


function createSection1ClickableObject(imagePath, position, size, parallaxSpeed, url, name = '', initialOffset = 5) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imagePath, (texture) => {
        const geometry = new THREE.PlaneGeometry(size.width, size.height);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });

        const plane = new THREE.Mesh(geometry, material);

        // Set initial position
        plane.position.set(position.x, position.y + initialOffset, position.z);

        // Store metadata for both parallax and clickable functionality
        plane.userData = {
            section: 'section1',
            parallaxSpeed: parallaxSpeed,
            initialOffset: initialOffset,
            initialDelay: animationState.layersLoaded * animationState.introDelay,
            originY: position.y,
            isClickable: true,
            url: url,
            name: name,
            originalScale: new THREE.Vector3(1, 1, 1),
            hoverScale: new THREE.Vector3(1.1, 1.1, 1.1),
            isHovered: false
        };

        scene.add(plane);
        sectionObjects.section1.clickableObjects.push(plane);
        sectionObjects.section1.parallaxLayers.push(plane);

        animationState.layersLoaded++;

        console.log(`Created section 1 clickable object: ${name}`);
    });
}

function createAnimationPlanes() {
    // Position this in front of other elements
    const zPosition = -0.2;


    // Calculate appropriate size
    const fullSize = calculateFullscreenSize(zPosition);
    const size = {
        width: fullSize.width * 0.25,
        height: fullSize.height * 0.6
    };

    // Create position vector with higher Y value
    const position = new THREE.Vector3(
        size.width * 0.3,
        size.height * 0.2,
        zPosition
    );



    // 1. Create normal animation plane
    if (frameAnimation.normalFrames.length > 0) {
        const geometry = new THREE.PlaneGeometry(size.width, size.height);
        const material = new THREE.MeshBasicMaterial({
            map: frameAnimation.normalFrames[0],
            transparent: true,
            side: THREE.DoubleSide
        });

        normalAnimationPlane = new THREE.Mesh(geometry, material);
        normalAnimationPlane.position.copy(position);
        normalAnimationPlane.visible = true;
        normalAnimationPlane.position.y -= 5; // Start off-screen for intro animation

        scene.add(normalAnimationPlane);
    }

    // 2. Create thumbs up animation plane
    if (frameAnimation.thumbsUpFrames.length > 0) {
        const geometry = new THREE.PlaneGeometry(size.width, size.height);
        const material = new THREE.MeshBasicMaterial({
            map: frameAnimation.thumbsUpFrames[0],
            transparent: true,
            side: THREE.DoubleSide
        });

        thumbsUpAnimationPlane = new THREE.Mesh(geometry, material);
        thumbsUpAnimationPlane.position.copy(position);
        thumbsUpAnimationPlane.visible = false;

        scene.add(thumbsUpAnimationPlane);
    }

    // 3. Create thumbs down animation plane
    if (frameAnimation.thumbsDownFrames.length > 0) {
        const geometry = new THREE.PlaneGeometry(size.width, size.height);
        const material = new THREE.MeshBasicMaterial({
            map: frameAnimation.thumbsDownFrames[0],
            transparent: true,
            side: THREE.DoubleSide
        });

        thumbsDownAnimationPlane = new THREE.Mesh(geometry, material);
        thumbsDownAnimationPlane.position.copy(position);
        thumbsDownAnimationPlane.visible = false;

        scene.add(thumbsDownAnimationPlane);
    }

    // Set up resize handlers for all planes
    window.addEventListener('resize', () => {
        const newFullSize = calculateFullscreenSize(zPosition);
        const newSize = {
            width: newFullSize.width * 0.25,
            height: newFullSize.height * 0.6
        };

        const newPosition = new THREE.Vector3(
            newSize.width * 0.3,
            newSize.height * 0.2,
            zPosition
        );

        // Update each plane
        [normalAnimationPlane, thumbsUpAnimationPlane, thumbsDownAnimationPlane].forEach(plane => {
            if (plane) {
                plane.geometry.dispose();
                plane.geometry = new THREE.PlaneGeometry(newSize.width, newSize.height);
                plane.position.copy(newPosition);
            }
        });
    });
}

function preloadAnimationFrames() {
    const textureLoader = new THREE.TextureLoader();
    const totalNormalFrames = 8;
    const totalThumbsUpFrames = 8;
    const totalThumbsDownFrames = 8;

    let loadedFrames = 0;
    const totalFramesToLoad = totalNormalFrames + totalThumbsUpFrames + totalThumbsDownFrames;

    // Load normal animation frames
    for (let i = 1; i <= totalNormalFrames; i++) {
        const framePath = `assets/images/normal_frame${i}.png`;
        textureLoader.load(framePath, (texture) => {
            frameAnimation.normalFrames[i - 1] = texture;
            loadedFrames++;
            checkAllFramesLoaded();
        }, undefined, (err) => {
            console.error(`Error loading ${framePath}:`, err);
            loadedFrames++;
            checkAllFramesLoaded();
        });
    }

    // Load thumbs up animation frames
    for (let i = 1; i <= totalThumbsUpFrames; i++) {
        const framePath = `assets/images/thumbsup_frame${i}.png`;
        textureLoader.load(framePath, (texture) => {
            frameAnimation.thumbsUpFrames[i - 1] = texture;
            loadedFrames++;
            checkAllFramesLoaded();
        }, undefined, (err) => {
            console.error(`Error loading ${framePath}:`, err);
            loadedFrames++;
            checkAllFramesLoaded();
        });
    }

    // Load thumbs down animation frames
    for (let i = 1; i <= totalThumbsDownFrames; i++) {
        const framePath = `assets/images/thumbsdown_frame${i}.png`;
        textureLoader.load(framePath, (texture) => {
            frameAnimation.thumbsDownFrames[i - 1] = texture;
            loadedFrames++;
            checkAllFramesLoaded();
        }, undefined, (err) => {
            console.error(`Error loading ${framePath}:`, err);
            loadedFrames++;
            checkAllFramesLoaded();
        });
    }

    function checkAllFramesLoaded() {
        if (loadedFrames >= totalFramesToLoad) {
            console.log("All animation frames loaded");
            frameAnimation.framesLoaded = true;
            createAnimationPlanes();
        }
    }
}

function createSection1() {
    // Create all section 1 layers
    createSection1ImageLayer(-6, './assets/images/groceryfloor.', 0.8, 8, 'groceryfloor', 0); // set floor to oe or else overalp
    createSection1ImageLayer(-5, 'https://media.discordapp.net/attachments/1009968505958965291/1348204839582175323/IMG_0535.png?ex=67cf45da&is=67cdf45a&hm=1b7723afde32724e2198a2ed0185c4a59887af2e57d7a1aeabbd7dfe9a5e0722&=&format=webp&quality=lossless&width=498&height=1080', 0.4, 6, 'groceryshelf', 0);
    createSection1ImageLayer(-4, 'assets/images/groceryshelf2.png', 0.6, 4, 'groceryshelf2', 0);
    //createSection1ImageLayer(-3, 'assets/images/groceryorang.png', 0.8, 2, 'groceryorang', true, 'https://example.com/oranges');
    //createSection1ImageLayer(-3, 'assets/images/groceryorang.png', 0.8, 2, 'groceryorang', 0);
    //  createSection1ImageLayer(-2, 'assets/images/groceryfront.png', 1.0, 1, 'groceryfront', -10);
    //createAnimatedText();

    createSection1ClickableObject(

        'assets/images/greenonion.png',
        { x: -3.5, y: -1.2, z: 1.61 },
        { width: 1.5, height: 1.5 },
        2,
        '',
        'greenonion'
    );

    createSection1ClickableObject(

        'assets/images/soysaucebottle.png',
        { x: 2.2, y: 0.2, z: 0 },
        { width: 2, height: 2 },
        0.01,
        '',
        'soysauce'
    );


    createSection1ClickableObject(

        './assets/images/ginger.png',
        { x: -4.3, y: 1.1, z: -0.2 },
        { width: 1, height: 1 },
        0.01,
        '',
        'ginger'
    );

    createSection1ClickableObject(

        'assets/images/garlic.png',
        { x: -6.75, y: 1.7, z: -0.2 },
        { width: 0.6, height: 0.6 },
        0.01,
        '',
        'garlic'
    );

    // createSection1ClickableObject(

    //     'assets/images/wontonwrapper.png',
    //     { x: 3.2, y: -0.2, z: 2 },
    //     { width: 0.5, height: 0.5 },
    //     0,
    //     'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    //     0
    // ); //problem with wonton wrapper panning



    createSection1NonClickableObject(

        'assets/images/groceryfront.png',
        { x: 2.1, y: -1.5, z: 0.01 },
        { width: 6, height: 6 },
        0.7,
        0
    );

    createSection1NonClickableObject(
        'assets/images/lefttable.png',
        { x: -6, y: -1.2, z: 1.5 },
        { width: 5, height: 5 },
        0.7,
        0
    );


    createSection1NonClickableObject(
        'assets/images/leftbox.png',
        { x: -5, y: -1.6, z: 1.6 },
        { width: 5, height: 3.5 },
        0.7,
        0
    );

    createSection1NonClickableObject(
        'assets/images/groceryorang.png',
        { x: -4.5, y: 0, z: -0.3 },
        { width: 7, height: 5 },
        0.7,
        0
    );

    createSection1NonClickableObject(
        'assets/images/orang2.png',
        { x: -9.8, y: 0, z: -0.5 },
        { width: 7, height: 5 },
        0.7,
        0
    );

    createSection1NonClickableObject(
        'assets/images/rightshelf.png',
        {
            x: 5, y: -0.1, z: 1.5

        },
        { width: 7, height: 8 },
        0.7,
        0
    );

    initializeEnhancedGrocerySystem();

}

// ============================================================
// SECTION 2: NEW SECTION IMPLEMENTATION
// ============================================================
function createSection2ImageLayer(zPosition, imagePath, speed, name = '') {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imagePath, (texture) => {
        const size = calculateFullscreenSize(zPosition);

        const geometry = new THREE.PlaneGeometry(size.width * 1.3, size.height * 1.1);
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });

        const plane = new THREE.Mesh(geometry, material);
        plane.position.z = zPosition;

        // Position for section 2 (starts one screen height down)
        plane.position.y = -window.innerHeight / 100;

        // Store metadata
        plane.userData = {
            section: 'section2',
            name: name,
            parallaxSpeed: speed,
            originalScale: plane.scale.clone()
        };

        scene.add(plane);
        sectionObjects.section2.parallaxLayers.push(plane);
        storeLayerOriginalPosition(modelContainer);

        window.addEventListener('resize', () => {
            const newSize = calculateFullscreenSize(zPosition);
            plane.geometry.dispose();
            plane.geometry = new THREE.PlaneGeometry(newSize.width, newSize.height);
        });
    });
}

function createSection2ClickableObject(imagePath, position, size, url, name = '') {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imagePath, (texture) => {
        const geometry = new THREE.PlaneGeometry(size.width, size.height);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });

        const plane = new THREE.Mesh(geometry, material);

        // Adjust position for section 2
        const adjustedPosition = {
            x: position.x,
            y: position.y - window.innerHeight / 100, // Move down one screen height 
            z: position.z
        };

        plane.position.set(adjustedPosition.x, adjustedPosition.y, adjustedPosition.z);

        // Store metadata
        plane.userData = {
            section: 'section2',
            isClickable: true,
            url: url,
            name: name,
            originalScale: new THREE.Vector3(1, 1, 1),
            hoverScale: new THREE.Vector3(1.1, 1.1, 1.1),
            isHovered: false
        };

        scene.add(plane);
        sectionObjects.section2.clickableObjects.push(plane);

        console.log(`Created section 2 clickable object: ${name}`);
    });
}

function createSection2() {
    // Create all section 2 layers
    createSection2ImageLayer(-7, 'assets/images/table.png', 0.2, 'section2-background');
    // createSection2ImageLayer(-4, 'assets/images/section2-midground.png', 0.6, 'section2-midground');
    // createSection2ImageLayer(-2, 'assets/images/section2-foreground.png', 1.0, 'section2-foreground');

    // loadInteractiveModel(); //fix panning issue

    // Add animated bowl
    createAnimatedBowl({ x: 0, y: 5, z: 1 }, { width: 4.5, height: 7 }); //ok now it looks fat, adjust height for the perspective to not look fat
    //TO DO: change th efuckass size of the physical image so the frame is no so fat. thse imgse also need to change accrdin to zoom in
    // Add animated tea - positioned to the right of the bowl
    createAnimatedTea({ x: -5.5, y: 7, z: -0.9 }, { width: 4, height: 4 });
    createAnimatedSoySauce({ x: 3.8, y: 3, z: 1.1 }, { width: 2.5, height: 2 });

    // Add animated spring rolls - positioned to the right of the soy sauce
    createAnimatedSpringRolls({ x: 5, y: 8.5, z: -0.1 }, { width: 4, height: 6.7 });
    // Load bowl animation frames
    loadBowlAnimation();
    loadTeaAnimation();
    loadSoySauceAnimation();
    loadSpringRollsAnimation();





    // Add clickable object, use this for fortune cookie
    createSection2ClickableObject(
        'assets/images/section2-button.png',
        { x: 0, y: 0, z: -1.5 },
        { width: 1.0, height: 0.5 },
        'https://example.com/section2',
        'section2-button'
    );
}


// Add these mouse event handlers for model interaction
function onModelMouseDown(event) {
    // Only interact if we're in section 2
    if (Math.abs(currentSection - 1) > 0.5) return;
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

    if (modelContainer) {
        // Log to verify the model is being targeted
        console.log("Checking for model intersection");

        // Create an array of all objects to check (model container and its children)
        const objectsToCheck = [modelContainer];
        modelContainer.traverse(child => {
            if (child.isMesh) {
                objectsToCheck.push(child);
            }
        });

        const intersects = raycaster.intersectObjects(objectsToCheck, true);
        console.log("Intersects:", intersects.length);

        if (intersects.length > 0) {
            console.log("Model clicked");
            isDragging = true;
            previousMousePosition = {
                x: event.clientX,
                y: event.clientY
            };

            // Change cursor style
            document.body.style.cursor = 'grabbing';

            // Prevent other click events
            event.preventDefault();
            event.stopPropagation();
        }
    }
}

function onModelMouseMove(event) {
    if (isZoomedIn) return;
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

    if (modelContainer) {
        const objectsToCheck = [modelContainer];
        modelContainer.traverse(child => {
            if (child.isMesh) {
                objectsToCheck.push(child);
            }
        });

        const intersects = raycaster.intersectObjects(objectsToCheck, true);

        if (intersects.length > 0) {
            document.body.style.cursor = 'grab'; // Show grab cursor when hovering over model
        } else if (!isDragging) {
            document.body.style.cursor = 'default'; // Reset cursor if not dragging
        }
    }

    if (!isDragging) return;

    const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
    };

    modelRotation.y += deltaMove.x * 0.01;
    modelRotation.x += deltaMove.y * 0.01;
    modelContainer.rotation.y = modelRotation.y;
    modelContainer.rotation.x = Math.max(Math.min(modelRotation.x, Math.PI / 4), -Math.PI / 4);

    previousMousePosition = { x: event.clientX, y: event.clientY };
}


function onModelMouseUp() {
    isDragging = false;
    // Reset cursor style back to default
    document.body.style.cursor = 'default';
}

// Make sure other handlers don't interfere with zoomed state
// Add this check to any function that might modify object scale or position
function checkZoomedState() {
    // If we're zoomed in, prevent other modifications
    if (isZoomedIn) return true;
    return false;
}


// Function to load bowl animation frames
function loadBowlAnimation() {
    const textureLoader = new THREE.TextureLoader();

    // Load all three frames
    for (let i = 1; i <= bowlAnimation.frameCount; i++) {
        const framePath = `assets/images/bowl${i}.png`;
        console.log(`Attempting to load bowl frame: ${framePath}`);

        textureLoader.load(framePath, (texture) => {
            bowlAnimation.frames[i - 1] = texture;
            bowlAnimation.framesLoaded++;
            console.log(`Loaded bowl frame ${i}, total loaded: ${bowlAnimation.framesLoaded}/${bowlAnimation.frameCount}`);

            // If this is the first frame, make sure it's applied to the bowl
            if (i === 1 && sectionObjects.section2) {
                // Find the bowl in the scene
                sectionObjects.section2.parallaxLayers.forEach(layer => {
                    if (layer.userData.name === 'bowl') {
                        layer.material.map = texture;
                        layer.material.needsUpdate = true;
                    }
                });
            }
        }, undefined, (err) => {
            console.error(`Error loading ${framePath}:`, err);
        });
    }
}

// Define variables outside the function
let lastBowlFrameTime = 0;
const FRAME_DELAY = 300; // 2 fps or whatever aha greatest graphics

// Function to update bowl animation
function updateBowlAnimation(timestamp) {
    // Make sure timestamp is a number
    timestamp = timestamp || performance.now();

    // Only animate if we have at least 2 frames loaded
    if (bowlAnimation.framesLoaded < 2) return;

    // Check if enough time has passed (hardcoded delay)
    const elapsedTime = timestamp - lastBowlFrameTime;
    if (elapsedTime < FRAME_DELAY) return;

    // Update the time tracker
    lastBowlFrameTime = timestamp;

    // Only animate when in section 2
    if (currentSection < 0.5 || currentSection >= 1.5) return;

    // Log for debugging


    // Increment frame index
    bowlAnimation.currentFrame = (bowlAnimation.currentFrame + 1) % bowlAnimation.frameCount;

    // Find the bowl mesh in section2.parallaxLayers
    let bowlFound = false;
    if (sectionObjects.section2 && sectionObjects.section2.parallaxLayers) {
        sectionObjects.section2.parallaxLayers.forEach(layer => {
            if (layer.userData && layer.userData.name === 'bowl' && layer.userData.isAnimated) {
                bowlFound = true;
                // Update the texture
                const newTexture = bowlAnimation.frames[bowlAnimation.currentFrame];
                if (newTexture) {
                    layer.material.map = newTexture;
                    layer.material.needsUpdate = true;
                } else {
                    console.log(`No texture available for frame ${bowlAnimation.currentFrame}`);
                }
            }
        });
    }

    if (!bowlFound) {
        console.log("Bowl not found in section2.parallaxLayers");
    }
}

// Function to create the animated bowl object
function createAnimatedBowl(position, size) {
    const textureLoader = new THREE.TextureLoader();

    // Load the first frame to start with
    textureLoader.load('assets/images/bowl1.png', (texture) => {
        console.log("Successfully loaded first bowl frame");

        const geometry = new THREE.PlaneGeometry(size.width, size.height);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });

        const plane = new THREE.Mesh(geometry, material);

        // Adjust position for section 2
        const sectionSpacing = window.innerHeight / 70;
        const adjustedPosition = {
            x: position.x,
            y: position.y - sectionSpacing, // Position in section 2
            z: position.z
        };

        plane.position.set(adjustedPosition.x, adjustedPosition.y, adjustedPosition.z);

        // Store metadata
        plane.userData = {
            section: 'section2',
            name: 'bowl',
            isAnimated: true,
            isClickable: bowlAnimation.isClickable,
            imagePath: bowlAnimation.imagePath,
            originalScale: new THREE.Vector3(1, 1, 1),
            hoverScale: new THREE.Vector3(1.05, 1.05, 1.05),
            isHovered: false
        };

        // Store original position for reset
        storeLayerOriginalPosition(plane);

        scene.add(plane);

        // Add to appropriate arrays
        sectionObjects.section2.parallaxLayers.push(plane);

        if (bowlAnimation.isClickable) {
            sectionObjects.section2.clickableObjects.push(plane);
        }

        console.log("Created animated bowl");
    }, undefined, (error) => {
        console.error("Error loading first bowl frame:", error);
    });
}

// Function to display a local image in a modal overlay
function displayLocalImage(imagePath) {
    // Create a modal to display the image
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <img src="${imagePath}" alt="Bowl Image">
        </div>
    `;

    // Add styles for the modal
    const style = document.createElement('style');
    style.textContent = `
        .image-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .modal-content {
            position: relative;
            background-color: #222;
            padding: 20px;
            border-radius: 10px;
            max-width: 80%;
            max-height: 80%;
        }
        .modal-content img {
            max-width: 100%;
            max-height: 70vh;
            display: block;
            border-radius: 5px;
        }
        .close-button {
            position: absolute;
            top: 10px;
            right: 15px;
            color: white;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }
        .close-button:hover {
            color: #ccc;
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(modal);

    // Add close functionality
    const closeButton = modal.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    // Also close when clicking outside the image
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Function to load tea animation frames
function loadTeaAnimation() {
    const textureLoader = new THREE.TextureLoader();

    // Load all four frames
    for (let i = 1; i <= teaAnimation.frameCount; i++) {
        const framePath = `assets/images/tea${i}.png`;
        console.log(`Attempting to load tea frame: ${framePath}`);

        textureLoader.load(framePath, (texture) => {
            teaAnimation.frames[i - 1] = texture;
            teaAnimation.framesLoaded++;
            console.log(`Loaded tea frame ${i}, total loaded: ${teaAnimation.framesLoaded}/${teaAnimation.frameCount}`);

            // If this is the first frame, make sure it's applied to the tea
            if (i === 1 && sectionObjects.section2) {
                // Find the tea in the scene
                sectionObjects.section2.parallaxLayers.forEach(layer => {
                    if (layer.userData.name === 'tea') {
                        layer.material.map = texture;
                        layer.material.needsUpdate = true;
                    }
                });
            }
        }, undefined, (err) => {
            console.error(`Error loading ${framePath}:`, err);
        });
    }
}

// Function to create the animated tea object
function createAnimatedTea(position, size) {
    const textureLoader = new THREE.TextureLoader();

    // Load the first frame to start with
    textureLoader.load('assets/images/tea1.png', (texture) => {
        console.log("Successfully loaded first tea frame");

        const geometry = new THREE.PlaneGeometry(size.width, size.height);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });

        const plane = new THREE.Mesh(geometry, material);

        // Adjust position for section 2
        const sectionSpacing = window.innerHeight / 70;
        const adjustedPosition = {
            x: position.x,
            y: position.y - sectionSpacing, // Position in section 2
            z: position.z
        };

        plane.position.set(adjustedPosition.x, adjustedPosition.y, adjustedPosition.z);

        // When setting up userData, add a flag to indicate it shouldn't respond to panning
        plane.userData = {
            section: 'section2',
            name: 'tea',
            isAnimated: true,
            isClickable: teaAnimation.isClickable,
            imagePath: teaAnimation.imagePath,
            originalScale: new THREE.Vector3(1, 1, 1),
            hoverScale: new THREE.Vector3(1.05, 1.05, 1.05),
            isHovered: false,
            // noPanning: true  // Add this flag to indicate it shouldn't pan
        };


        // Store original position for reset
        storeLayerOriginalPosition(plane);

        scene.add(plane);

        // Add to appropriate arrays
        sectionObjects.section2.parallaxLayers.push(plane);

        if (teaAnimation.isClickable) {
            sectionObjects.section2.clickableObjects.push(plane);
        }

        console.log("Created animated tea");
    }, undefined, (error) => {
        console.error("Error loading first tea frame:", error);
    });
}

// Function to update tea animation
function updateTeaAnimation(timestamp) {
    // Only animate if we have all frames loaded
    if (teaAnimation.framesLoaded < teaAnimation.frameCount) return;

    // Only animate when in section 2
    if (currentSection < 0.5 || currentSection >= 1.5) return;

    // Check if it's time for a transition (every transitionDuration seconds)
    if (timestamp - teaAnimation.lastTransitionTime < teaAnimation.transitionDuration * 100) return; //TODO: LAST PARAM CONTROLS FRAMERATE

    // Time to change frames
    teaAnimation.lastTransitionTime = timestamp;
    teaAnimation.currentFrame = (teaAnimation.currentFrame + 1) % teaAnimation.frameCount;

    // Find the tea and update its texture
    sectionObjects.section2.parallaxLayers.forEach(layer => {
        if (layer.userData.name === 'tea' && layer.userData.isAnimated) {
            layer.material.map = teaAnimation.frames[teaAnimation.currentFrame];
            layer.material.needsUpdate = true;
        }
    });
}


// Function to load soy sauce animation frames
function loadSoySauceAnimation() {
    const textureLoader = new THREE.TextureLoader();

    // Load all three frames
    for (let i = 1; i <= soySauceAnimation.frameCount; i++) {
        const framePath = `assets/images/soysauce${i}.png`;
        console.log(`Attempting to load soy sauce frame: ${framePath}`);

        textureLoader.load(framePath, (texture) => {
            soySauceAnimation.frames[i - 1] = texture;
            soySauceAnimation.framesLoaded++;
            console.log(`Loaded soy sauce frame ${i}, total loaded: ${soySauceAnimation.framesLoaded}/${soySauceAnimation.frameCount}`);

            // If this is the first frame, make sure it's applied to the soy sauce
            if (i === 1 && sectionObjects.section2) {
                // Find the soy sauce in the scene
                sectionObjects.section2.parallaxLayers.forEach(layer => {
                    if (layer.userData.name === 'soysauce') {
                        layer.material.map = texture;
                        layer.material.needsUpdate = true;
                    }
                });
            }
        }, undefined, (err) => {
            console.error(`Error loading ${framePath}:`, err);
        });
    }
}
// Function to create the animated soy sauce object
function createAnimatedSoySauce(position, size) {
    const textureLoader = new THREE.TextureLoader();

    // Load the first frame to start with
    textureLoader.load('assets/images/soysauce1.png', (texture) => {
        console.log("Successfully loaded first soy sauce frame");

        const geometry = new THREE.PlaneGeometry(size.width, size.height);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });

        const plane = new THREE.Mesh(geometry, material);

        // Adjust position for section 2 - use the exact same logic as in createAnimatedBowl
        const sectionSpacing = window.innerHeight / 70;
        const adjustedPosition = {
            x: position.x,
            y: position.y - sectionSpacing, // Position in section 2
            z: position.z
        };

        plane.position.set(adjustedPosition.x, adjustedPosition.y, adjustedPosition.z);

        // Store metadata - make sure it exactly matches the bowl's userData structure
        plane.userData = {
            section: 'section2',
            name: 'soysauce',
            isAnimated: true,
            isClickable: soySauceAnimation.isClickable,
            imagePath: soySauceAnimation.imagePath,
            originalScale: new THREE.Vector3(1, 1, 1),
            hoverScale: new THREE.Vector3(1.05, 1.05, 1.05),
            isHovered: false,
            parallaxSpeed: position.parallaxSpeed || 0.6 // Make sure to provide this value
        };

        // Make sure storeLayerOriginalPosition is called with the exact same parameters as for the bowl
        storeLayerOriginalPosition(plane);

        scene.add(plane);

        // Make sure it's added to the same arrays as the bowl
        sectionObjects.section2.parallaxLayers.push(plane);

        if (soySauceAnimation.isClickable) {
            sectionObjects.section2.clickableObjects.push(plane);
        }

        console.log("Created animated soy sauce");
    });
}

// Function to update soy sauce animation
function updateSoySauceAnimation(timestamp) {
    // Only animate if we have all frames loaded
    if (soySauceAnimation.framesLoaded < soySauceAnimation.frameCount) return;

    // Only animate when in section 2
    if (currentSection < 0.5 || currentSection >= 1.5) return;

    // Check if it's time for a transition (every transitionDuration seconds)
    if (timestamp - soySauceAnimation.lastTransitionTime < soySauceAnimation.transitionDuration * 1000) return;

    // Time to change frames
    soySauceAnimation.lastTransitionTime = timestamp;
    soySauceAnimation.currentFrame = (soySauceAnimation.currentFrame + 1) % soySauceAnimation.frameCount;

    // Find the soy sauce and update its texture
    sectionObjects.section2.parallaxLayers.forEach(layer => {
        if (layer.userData.name === 'soysauce' && layer.userData.isAnimated) {
            layer.material.map = soySauceAnimation.frames[soySauceAnimation.currentFrame];
            layer.material.needsUpdate = true;
        }
    });
}
// Function to load spring rolls animation frames
function loadSpringRollsAnimation() {
    const textureLoader = new THREE.TextureLoader();

    // Load all three frames
    for (let i = 1; i <= springRollsAnimation.frameCount; i++) {
        const framePath = `assets/images/springrolls${i}.png`;
        console.log(`Attempting to load spring rolls frame: ${framePath}`);

        textureLoader.load(framePath, (texture) => {
            springRollsAnimation.frames[i - 1] = texture;
            springRollsAnimation.framesLoaded++;
            console.log(`Loaded spring rolls frame ${i}, total loaded: ${springRollsAnimation.framesLoaded}/${springRollsAnimation.frameCount}`);

            // If this is the first frame, make sure it's applied to the spring rolls
            if (i === 1 && sectionObjects.section2) {
                // Find the spring rolls in the scene
                sectionObjects.section2.parallaxLayers.forEach(layer => {
                    if (layer.userData.name === 'springrolls') {
                        layer.material.map = texture;
                        layer.material.needsUpdate = true;
                    }
                });
            }
        }, undefined, (err) => {
            console.error(`Error loading ${framePath}:`, err);
        });
    }
}

// Function to create the animated spring rolls object
function createAnimatedSpringRolls(position, size) {
    const textureLoader = new THREE.TextureLoader();

    // Load the first frame to start with
    textureLoader.load('assets/images/springrolls1.png', (texture) => {
        console.log("Successfully loaded first spring rolls frame");

        const geometry = new THREE.PlaneGeometry(size.width, size.height);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });

        const plane = new THREE.Mesh(geometry, material);

        // Adjust position for section 2
        const sectionSpacing = window.innerHeight / 70;
        const adjustedPosition = {
            x: position.x,
            y: position.y - sectionSpacing, // Position in section 2
            z: position.z
        };

        plane.position.set(adjustedPosition.x, adjustedPosition.y, adjustedPosition.z);

        // Store metadata
        plane.userData = {
            section: 'section2',
            name: 'springrolls',
            isAnimated: true,
            isClickable: springRollsAnimation.isClickable,
            imagePath: springRollsAnimation.imagePath,
            originalScale: new THREE.Vector3(1, 1, 1),
            hoverScale: new THREE.Vector3(1.05, 1.05, 1.05),
            isHovered: false
        };

        // Store original position for reset
        storeLayerOriginalPosition(plane);

        scene.add(plane);

        // Add to appropriate arrays
        sectionObjects.section2.parallaxLayers.push(plane);

        if (springRollsAnimation.isClickable) {
            sectionObjects.section2.clickableObjects.push(plane);
        }

        console.log("Created animated spring rolls");
    }, undefined, (error) => {
        console.error("Error loading first spring rolls frame:", error);
    });
}

// Function to update spring rolls animation
function updateSpringRollsAnimation(timestamp) {
    // Only animate if we have all frames loaded
    if (springRollsAnimation.framesLoaded < springRollsAnimation.frameCount) return;

    // Only animate when in section 2
    if (currentSection < 0.5 || currentSection >= 1.5) return;

    // Check if it's time for a transition (every transitionDuration seconds)
    if (timestamp - springRollsAnimation.lastTransitionTime < springRollsAnimation.transitionDuration * 1000) return;

    // Time to change frames
    springRollsAnimation.lastTransitionTime = timestamp;
    springRollsAnimation.currentFrame = (springRollsAnimation.currentFrame + 1) % springRollsAnimation.frameCount;

    // Find the spring rolls and update its texture
    sectionObjects.section2.parallaxLayers.forEach(layer => {
        if (layer.userData.name === 'springrolls' && layer.userData.isAnimated) {
            layer.material.map = springRollsAnimation.frames[springRollsAnimation.currentFrame];
            layer.material.needsUpdate = true;
        }
    });
}



// ============================================================
// SECTION 3: DESK VIEW WITH INTERACTIVE OBJECTS
// ============================================================

// Variables for section 3 zoom state
let isZoomedIn = false;
let currentZoomedObject = null;
let originalCameraPosition = null;

// Function to create image layers for section 3
function createSection3ImageLayer(zPosition, imagePath, speed, name = '') {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imagePath, (texture) => {
        const size = calculateFullscreenSize(zPosition, 0.3); // Add extra margin for panning

        const geometry = new THREE.PlaneGeometry(size.width, size.height);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });

        const plane = new THREE.Mesh(geometry, material);
        plane.position.z = zPosition;

        // Position for section 3 (starts two screen heights down)
        const sectionSpacing = window.innerHeight / 70; //CHANGE THIS VALUE FOR STLYLISTIC PURPISES, THIS CONTROLS SPACING
        plane.position.y = -sectionSpacing * 2;

        // Store metadata
        plane.userData = {
            section: 'section3',
            name: name,
            parallaxSpeed: speed,
            originalScale: plane.scale.clone()
        };

        // Store original position for reset
        storeLayerOriginalPosition(plane);

        scene.add(plane);
        sectionObjects.section3.parallaxLayers.push(plane);

        window.addEventListener('resize', () => {
            const newSize = calculateFullscreenSize(zPosition, 0.3);
            plane.geometry.dispose();
            plane.geometry = new THREE.PlaneGeometry(newSize.width, newSize.height);
        });
    });
}

// Function to create clickable objects in section 3 that can be zoomed in on
function createSection3ZoomableObject(imagePath, position, size, name = '', zoomDetails = {}) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imagePath, (texture) => {
        const geometry = new THREE.PlaneGeometry(size.width, size.height);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });

        const plane = new THREE.Mesh(geometry, material);

        // Adjust position for section 3
        const sectionSpacing = window.innerHeight / 60; //CHANGE THIS FOR SLISTIC PURPOSES
        const adjustedPosition = {
            x: position.x,
            y: position.y - sectionSpacing * 2,
            z: position.z
        };

        plane.position.set(adjustedPosition.x, adjustedPosition.y, adjustedPosition.z);

        // Store metadata
        plane.userData = {
            section: 'section3',
            isClickable: true,
            isZoomable: true,
            name: name,
            originalScale: new THREE.Vector3(1, 1, 1),
            hoverScale: new THREE.Vector3(1.05, 1.05, 1.05),
            isHovered: false,

            // Zoom properties
            zoomPosition: zoomDetails.position || { x: 0, y: -sectionSpacing * 2, z: -2 },
            zoomScale: zoomDetails.scale || 2,
            zoomRotation: zoomDetails.rotation || { x: 0, y: 0, z: 0 },
            closeupTexture: null,
            closeupPath: zoomDetails.closeupPath || null
        };

        // If a closeup texture is provided, load it
        if (zoomDetails.closeupPath) {
            textureLoader.load(zoomDetails.closeupPath, (closeupTexture) => {
                plane.userData.closeupTexture = closeupTexture;
            });
        }

        // Store original position for reset
        storeLayerOriginalPosition(plane);

        scene.add(plane);
        sectionObjects.section3.clickableObjects.push(plane);
        sectionObjects.section3.parallaxLayers.push(plane);

        console.log(`Created zoomable object in section 3: ${name}`);
    });
}

// Function to handle clicking on a zoomable object
function handleZoomableObjectClick(object) {
    if (!object || !object.userData.isZoomable) return;

    console.log(`Clicked on zoomable object: ${object.userData.name}`);

    if (isZoomedIn && currentZoomedObject === object) {
        // We're already zoomed in on this object, zoom out
        zoomOut();
    } else {
        // Zoom in on this object
        zoomInOn(object);
    }
}

// Function to zoom in on an object
function zoomInOn(object) {
    if (!object || isZoomedIn) return;

    // Store current state
    isZoomedIn = true;
    currentZoomedObject = object;
    originalCameraPosition = {
        position: camera.position.clone(),
        rotation: camera.rotation.clone()
    };

    // If we have a closeup texture, save the original first and then switch
    if (object.userData.closeupTexture) {
        // Save the original texture
        object.userData.originalTexture = object.material.map;
        // Also save path for fallback
        object.userData.originalTexturePath = object.userData.closeupPath.replace('_closeup', '');

        // Then switch to closeup
        object.material.map = object.userData.closeupTexture;
        object.material.needsUpdate = true;
    }

    // Create a semi-transparent overlay to dim other elements
    createOverlay();

    // Disable scrolling while zoomed in
    scrollingEnabled = false;

    // Add a "back" button
    addBackButton();

    // Apply zoom animation
    animateZoomIn(object);

    // Add click outside to zoom out
    document.addEventListener('click', handleClickOutside);
}
// Function to zoom out
function zoomOut() {
    if (!isZoomedIn || !currentZoomedObject) return;

    // Switch back to original texture if needed
    if (currentZoomedObject.userData.closeupTexture) {
        // Don't try to access the texture path directly
        // Instead, use the original texture that was saved or reload it
        if (currentZoomedObject.userData.originalTexture) {
            // If we saved the original texture, use it
            currentZoomedObject.material.map = currentZoomedObject.userData.originalTexture;
            currentZoomedObject.material.needsUpdate = true;
        } else {
            // Otherwise, reload from the path (without trying to access .src)
            const originalTexturePath = currentZoomedObject.userData.originalTexturePath;
            if (originalTexturePath) {
                new THREE.TextureLoader().load(originalTexturePath, (texture) => {
                    currentZoomedObject.material.map = texture;
                    currentZoomedObject.material.needsUpdate = true;
                });
            }
        }
    }

    // Remove overlay
    removeOverlay();

    // Enable scrolling again
    scrollingEnabled = true;

    // Remove back button
    removeBackButton();

    // Remove click outside handler
    document.removeEventListener('click', handleClickOutside);

    // Apply zoom out animation
    animateZoomOut();

    // Clear state
    isZoomedIn = false;
    currentZoomedObject = null;
}

// Function to animate zooming in
function animateZoomIn(object) {
    const zoomPosition = object.userData.zoomPosition;
    const zoomScale = object.userData.zoomScale;
    const zoomRotation = object.userData.zoomRotation;

    // // Store original properties to restore later
    // object.userData.originalPosition = object.position.clone();
    // object.userData.originalRotation = object.rotation.clone();
    // object.userData.originalScale = object.scale.clone();
    // Move object to center of screen and scale it up
    if (typeof gsap !== 'undefined') {
        // Animate with GSAP
        gsap.to(object.position, {
            x: 0, // Center horizontally
            y: camera.position.y, // Match camera height
            z: -2, // Bring forward
            duration: 0.8,
            ease: "power2.out"
        });

        gsap.to(object.scale, {
            x: zoomScale,
            y: zoomScale,
            z: zoomScale,
            duration: 1.5,
            ease: "power2.out",
            onComplete: () => {
                console.log("Zoom-in complete, object stays big!");
                isZoomedIn = true; // Ensure state is properly set
            }
        });

        // Make sure rotation is set properly
        gsap.to(object.rotation, {
            x: zoomRotation.x,
            y: zoomRotation.y,
            z: zoomRotation.z,
            duration: 0.8,
            ease: "power2.out"
        });
    } else {
        // Fallback without GSAP
        object.position.set(0, camera.position.y, -2);
        object.scale.set(zoomScale, zoomScale, zoomScale);
        object.rotation.set(zoomRotation.x, zoomRotation.y, zoomRotation.z);
        object.userData.isZoomedIn = true;

        console.log("Fallback zoom-in complete, object stays big!");
    }

    // Fade out other objects
    sectionObjects.section3.parallaxLayers.forEach(layer => {
        if (layer !== object) {
            gsap.to(layer.material, {
                opacity: 0.2,
                duration: 0.5
            });
        }
    });
}

// Function to animate zooming out
function animateZoomOut() {
    const object = currentZoomedObject;
    if (!object) return;

    // Animate back to original position and scale
    gsap.to(object.position, {
        x: object.userData.originalX,
        y: object.userData.originalY,
        z: object.userData.originalZ,
        duration: 0.8,
        ease: "power2.out"
    });

    gsap.to(object.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.8,
        ease: "power2.out"
    });

    gsap.to(object.rotation, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.8,
        ease: "power2.out"
    });

    // Fade in other objects
    sectionObjects.section3.parallaxLayers.forEach(layer => {
        gsap.to(layer.material, {
            opacity: 1,
            duration: 0.5
        });
    });
}

// Create semi-transparent overlay
function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'zoom-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '90';
    overlay.style.pointerEvents = 'none'; // Allow clicks to pass through
    document.body.appendChild(overlay);
}

// Remove overlay
function removeOverlay() {
    const overlay = document.getElementById('zoom-overlay');
    if (overlay) {
        overlay.parentNode.removeChild(overlay);
    }
}

// Add back button
function addBackButton() {
    const backBtn = document.createElement('button');
    backBtn.id = 'back-button';
    backBtn.innerHTML = '← Back';
    backBtn.style.position = 'fixed';
    backBtn.style.top = '20px';
    backBtn.style.left = '20px';
    backBtn.style.padding = '10px 20px';
    backBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    backBtn.style.color = 'white';
    backBtn.style.border = 'none';
    backBtn.style.borderRadius = '5px';
    backBtn.style.cursor = 'pointer';
    backBtn.style.zIndex = '100';
    backBtn.style.fontFamily = 'Arial, sans-serif';

    backBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        zoomOut();
    });

    document.body.appendChild(backBtn);
}

// Remove back button
function removeBackButton() {
    const backBtn = document.getElementById('back-button');
    if (backBtn) {
        backBtn.parentNode.removeChild(backBtn);
    }
}

// Modify the handleClickOutside function to prevent automatic zoom out
function handleClickOutside(e) {
    // Only check if we're actually zoomed in
    if (!isZoomedIn || !currentZoomedObject) return;

    // Check if this is a click on the back button (which has its own handler)
    if (e.target.id === 'back-button') {
        return; // Let the back button handler handle this
    }

    // Check if click was outside the zoomed object
    const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
    const intersects = raycaster.intersectObject(currentZoomedObject);

    // Only zoom out if click is outside the object
    if (intersects.length === 0) {
        zoomOut();
    }
}


// Modify the onMouseClick function to handle local image display
function onMouseClick(event) {
    // Update the picking ray with the camera and mouse position
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

    // Get all clickable objects from all sections
    const allClickableObjects = [];
    Object.values(sectionObjects).forEach(section => {
        if (section.clickableObjects) {
            allClickableObjects.push(...section.clickableObjects);
        }
    });

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(allClickableObjects);

    // Handle clicked object
    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;

        // Handle different types of clickable objects
        if (clickedObject.userData.isZoomable && currentSection >= 1.5) {
            // Handle zoom action for section 3 objects
            handleZoomableObjectClick(clickedObject);
        } else if (clickedObject.userData.url) {
            // Handle URL action (for objects with URLs)
            window.open(clickedObject.userData.url, '_blank');
        } else if (clickedObject.userData.imagePath) {
            // Handle local image display
            displayLocalImage(clickedObject.userData.imagePath);
        }

        console.log(`Clicked on ${clickedObject.userData.name}`);
    }
}
// Create section 3
function createSection3() {
    console.log("Creating section 3...");
    // Background layers with parallax
    createSection3ImageLayer(-6, 'assets/images/section3/desk_background.png', 0.2, 'desk-background');
    createSection3ImageLayer(-5, 'assets/images/section3/desk_surface.png', 0.4, 'desk-surface');
    createSection3ImageLayer(-4, 'assets/images/section3/desk_items.png', 0.6, 'desk-items');
    // createSection3ImageLayer(-3, 'assets/images/section3/books.png', 0.7, 'books');
    createSection3ImageLayer(-2, 'assets/images/section3/tablet.png', 0.8, 'tablet');

    // Add zoomable objects
    createSection3ZoomableObject(
        'assets/images/section3/bulletin_board.png',
        { x: -1.5, y: 0.5, z: -2.5 },
        { width: 1.0, height: 1.2 },
        'bulletin-board',
        {
            closeupPath: 'assets/images/section3/bulletin_board.png',
            position: { x: 0, y: -window.innerHeight / 45 * 2, z: -2 },
            scale: 3,
            rotation: { x: 0, y: 0, z: 0 }
        }
    );



    // Add more zoomable objects as needed...
}

// ============================================================
// INTERACTION HANDLERS
// ============================================================
function updateAnimationFrame(timestamp) {
    if (!frameAnimation.framesLoaded) return;

    // Calculate elapsed time for consistent frame rate
    const elapsed = timestamp - frameAnimation.lastFrameTime;
    const frameDuration = 1000 / frameAnimation.fps;

    // Update frames if enough time has elapsed
    if (elapsed >= frameDuration) {
        frameAnimation.lastFrameTime = timestamp;

        // Update normal animation if visible
        if (normalAnimationPlane && normalAnimationPlane.visible) {
            frameAnimation.normalFrameIndex = (frameAnimation.normalFrameIndex + 1) % frameAnimation.normalFrames.length;
            normalAnimationPlane.material.map = frameAnimation.normalFrames[frameAnimation.normalFrameIndex];
            normalAnimationPlane.material.needsUpdate = true;
        }

        // Update thumbs up animation if visible
        if (thumbsUpAnimationPlane && thumbsUpAnimationPlane.visible) {
            frameAnimation.thumbsUpFrameIndex = (frameAnimation.thumbsUpFrameIndex + 1) % frameAnimation.thumbsUpFrames.length;
            thumbsUpAnimationPlane.material.map = frameAnimation.thumbsUpFrames[frameAnimation.thumbsUpFrameIndex];
            thumbsUpAnimationPlane.material.needsUpdate = true;
        }

        // Update thumbs down animation if visible
        if (thumbsDownAnimationPlane && thumbsDownAnimationPlane.visible) {
            frameAnimation.thumbsDownFrameIndex = (frameAnimation.thumbsDownFrameIndex + 1) % frameAnimation.thumbsDownFrames.length;
            thumbsDownAnimationPlane.material.map = frameAnimation.thumbsDownFrames[frameAnimation.thumbsDownFrameIndex];
            thumbsDownAnimationPlane.material.needsUpdate = true;
        }
    }
}

// Update the processModelPanning function for WASD
function processModelPanning() {
    if (!modelContainer) return;

    const panAmount = panSpeed * zoomLevel;
    let newX = modelContainer.position.x;
    let newY = modelContainer.position.y;

    // Pan left/right with WASD
    if (keysPressed[panKeys.left]) {
        newX = Math.min(panLimits.maxX, modelContainer.position.x + panAmount);
    } else if (keysPressed[panKeys.right]) {
        newX = Math.max(panLimits.minX, modelContainer.position.x - panAmount);
    }

    // Pan up/down with WASD
    const baseY = -window.innerHeight / 45 + 1;
    if (keysPressed[panKeys.up]) {
        newY = Math.max(baseY + panLimits.minY, modelContainer.position.y - panAmount);
    } else if (keysPressed[panKeys.down]) {
        newY = Math.min(baseY + panLimits.maxY, modelContainer.position.y + panAmount);
    }

    // Apply new position
    modelContainer.position.x = newX;
    modelContainer.position.y = newY;
}

function processGestureScrolling(isPointingUp, isPointingDown) {
    if (!scrollingEnabled) return;

    if (isPointingUp) {
        // Scroll up (decrease scrollY)
        scrollY = Math.max(0, scrollY - 0.05);
        targetSection = Math.round(scrollY);

        // Update active dot
        document.querySelectorAll('.dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === targetSection);
        });
    } else if (isPointingDown) {
        // Scroll down (increase scrollY)
        scrollY = Math.min(2, scrollY + 0.05);
        targetSection = Math.round(scrollY);

        // Update active dot
        document.querySelectorAll('.dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === targetSection);
        });
    }
}

function triggerThumbsUpAnimation() {
    if (thumbsUpAnimationPlane) {
        // Save original scale
        const originalScale = thumbsUpAnimationPlane.scale.clone();

        // Scale up animation
        const scaleUp = () => {
            thumbsUpAnimationPlane.scale.x = originalScale.x * 1.3;
            thumbsUpAnimationPlane.scale.y = originalScale.y * 1.3;

            setTimeout(() => {
                const scaleDown = () => {
                    thumbsUpAnimationPlane.scale.x = originalScale.x;
                    thumbsUpAnimationPlane.scale.y = originalScale.y;
                };
                requestAnimationFrame(scaleDown);
            }, 200);
        };

        requestAnimationFrame(scaleUp);
    }
}

function triggerThumbsDownAnimation() {
    if (thumbsDownAnimationPlane) {
        // Shake animation
        const originalPosition = thumbsDownAnimationPlane.position.clone();

        let shakeCount = 0;
        const maxShakes = 6;
        const shakeAmount = 0.1;
        const shakeInterval = 60; // milliseconds

        const shakeAnimation = () => {
            if (shakeCount >= maxShakes) {
                // Reset position when done
                thumbsDownAnimationPlane.position.copy(originalPosition);
                return;
            }

            // Alternate direction
            const xOffset = (shakeCount % 2 === 0) ? shakeAmount : -shakeAmount;
            thumbsDownAnimationPlane.position.x = originalPosition.x + xOffset;

            shakeCount++;
            setTimeout(shakeAnimation, shakeInterval);
        };

        shakeAnimation();
    }

    // Apply a negative effect to the scene (optional)
    scene.background = new THREE.Color(0x330000); // Red tint
    setTimeout(() => {
        scene.background = new THREE.Color(0x000000); // Reset to black
    }, 300);
}

// Update your mouse move handler to check for isClickable flag
function onMouseMove(event) {
    // Calculate mouse position in normalized device coordinates
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    // Skip hover effects if we're in zoomed mode
    if (isZoomedIn) return;

    // Update the picking ray
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

    // Get all clickable objects
    const allClickableObjects = [];
    Object.values(sectionObjects).forEach(section => {
        if (section.clickableObjects) {
            allClickableObjects.push(...section.clickableObjects);
        }
    });

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(allClickableObjects);

    // Reset hover states for all objects
    allClickableObjects.forEach(obj => {
        obj.userData.isHovered = false;
    });

    // Set default cursor
    document.body.style.cursor = 'auto';

    // Handle hover state for the first (closest) intersected object
    if (intersects.length > 0) {
        const hoveredObject = intersects[0].object;

        // Only set hover state and change cursor if object is marked as clickable
        if (hoveredObject.userData.isClickable === true) {
            hoveredObject.userData.isHovered = true;

            // Change cursor to pointer only for clickable objects
            document.body.style.cursor = 'pointer';
        }
    }

    // Apply hover effects (scaling, etc.)
    allClickableObjects.forEach(obj => {
        // Only apply hover effects to objects marked as clickable
        if (obj.userData.isClickable === true) {
            if (obj.userData.isHovered) {
                // Smoothly scale up
                obj.scale.lerp(obj.userData.hoverScale, 0.1);
            } else {
                // Smoothly scale down to original
                obj.scale.lerp(obj.userData.originalScale, 0.1);
            }
        }
    });
}

// ============================================================
// ANIMATION AND RENDERING
// ============================================================
function animate(timestamp) {
    requestAnimationFrame(animate);

    updateModelVisibility();

    // Update animation frames
    updateAnimationFrame(timestamp);
    updateBowlAnimation();
    updateTeaAnimation(timestamp);
    updateSoySauceAnimation(timestamp);
    updateSpringRollsAnimation(timestamp);



    processPanning();

    // Handle intro animation
    if (!animationState.introComplete) {
        animationState.introProgress += animationState.introSpeed;

        if (animationState.introProgress >= 1) {
            animationState.introComplete = true;
        }

        // Animate section 1 layers falling into place
        sectionObjects.section1.parallaxLayers.forEach(layer => {
            // Only start animating after the layer's delay has passed
            const layerProgress = Math.max(0, animationState.introProgress - layer.userData.initialDelay);

            if (layerProgress > 0) {
                // Easing function: ease-out cubic
                const easedProgress = 1 - Math.pow(1 - Math.min(1, layerProgress / (1 - layer.userData.initialDelay)), 3);

                // Move from initial offset position to target position
                if (layer.userData.isClickable && layer.userData.originY !== undefined) {
                    // For clickable objects, we move from initial Y + offset to initial Y
                    layer.position.y = layer.userData.originY + (layer.userData.initialOffset * (1 - easedProgress));
                } else {
                    // For regular layers, use the standard animation
                    layer.position.y = layer.userData.initialOffset * (1 - easedProgress);
                }
            }
        });

        // Animate normal animation plane intro
        if (normalAnimationPlane) {
            const planeProgress = Math.max(0, animationState.introProgress - 0.8); // Delay appearance

            if (planeProgress > 0) {
                // Elastic easing for bouncy effect
                const t = Math.min(1, planeProgress / 0.2); // Complete over 20% of total time
                const easedProgress = t === 0 ? 0 : t === 1 ? 1 :
                    Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;

                // Update the target Y position to match our new higher position
                const targetY = calculateFullscreenSize(-1.5).height * 0.2 - 3; //TODO fuckass
                normalAnimationPlane.position.y = targetY - 5 * (1 - easedProgress);
            }
        }
    } else {
        // Regular parallax scrolling effect once intro is complete
        currentSection += (targetSection - currentSection) * 0.05;
        camera.position.y = -currentSection * 10;

        // Parallax effect for section 1
        sectionObjects.section1.parallaxLayers.forEach(layer => {
            if (layer.userData.isClickable && layer.userData.originY !== undefined) {
                // For clickable objects, move them relative to their original position
                layer.position.y = layer.userData.originY + (currentSection * 10 * layer.userData.parallaxSpeed);
            } else {
                // For regular layers, use the standard parallax
                layer.position.y = currentSection * 10 * layer.userData.parallaxSpeed;
            }
        });


    }

    // Add smooth hover transitions for clickable objects
    const allClickableObjects = [];
    Object.values(sectionObjects).forEach(section => {
        if (section.clickableObjects) {
            allClickableObjects.push(...section.clickableObjects);
        }
    });

    allClickableObjects.forEach(obj => {
        if (obj.userData.isHovered) {
            // Smoothly scale up
            obj.scale.lerp(obj.userData.hoverScale, 0.1);
        } else {
            // Smoothly scale down to original
            obj.scale.lerp(obj.userData.originalScale, 0.1);
        }
    });

    renderer.render(scene, camera);
}

// ============================================================
// EVENT LISTENERS
// ============================================================
// Handle scrolling
// Also update the wheel event handler to keep DOM and Three.js in sync
window.addEventListener('wheel', (event) => {
    if (!scrollingEnabled) return;

    scrollY += event.deltaY * 0.001;
    scrollY = Math.max(0, Math.min(scrollY, 3));
    targetSection = Math.round(scrollY);

    document.querySelectorAll('.dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === targetSection);
    });

    // If we've scrolled to a new section, sync the DOM scroll position
    if (Math.abs(scrollY - targetSection) < 0.1) {
        const sectionHeight = window.innerHeight;
        const targetScrollPosition = targetSection * sectionHeight;

        // Use requestAnimationFrame to avoid interrupting the wheel event
        requestAnimationFrame(() => {
            window.scrollTo({
                top: targetScrollPosition,
                behavior: 'smooth'
            });
        });
    }
});
// Navigation dots click handler
document.querySelectorAll('.dot').forEach(dot => {
    dot.addEventListener('click', () => {
        if (!scrollingEnabled) return;

        targetSection = parseInt(dot.getAttribute('data-section'));
        scrollY = targetSection;

        document.querySelectorAll('.dot').forEach((d, index) => {
            d.classList.toggle('active', index === targetSection);
        });
        // Scroll the DOM content to match
        const sectionHeight = window.innerHeight;
        const targetScrollPosition = targetSection * sectionHeight;

        window.scrollTo({
            top: targetScrollPosition,
            behavior: 'smooth'
        });
    });
});

// Mouse interaction handlers
window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('click', onMouseClick, false);


// Add the event listeners for model interaction
document.addEventListener('mousedown', onModelMouseDown, false);
document.addEventListener('mousemove', onModelMouseMove, false);
document.addEventListener('mouseup', onModelMouseUp, false);

// Listen for key down events
document.addEventListener('keydown', function (event) {
    // Store key state
    keysPressed[event.key] = true;

    // Handle zoom controls for all sections
    // Zoom in with + or =
    if (event.key === '+' || event.key === '=') {
        zoomIn();
    }
    // Zoom out with - or _
    else if (event.key === '-' || event.key === '_') {
        zoomOut();
    }
    // Arrow keys for panning (when holding Shift)
    else if (event.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        isPanning = true;
        // Prevent default scrolling behavior
        event.preventDefault();

        // Additional explicit handling for up/down arrows with shift
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            // Ensure no scrolling happens
            event.stopPropagation();
        }
    }
});

window.addEventListener('click', onMouseClick);

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Set up event listeners for gesture events from hand-gestures.js
window.addEventListener('thumbsUp', (event) => {
    const active = event.detail.active;

    if (active) {
        console.log("Thumbs up detected in three-scene.js");

        if (!frameAnimation.transitionInProgress) {
            frameAnimation.transitionInProgress = true;

            // First trigger the animation
            triggerThumbsUpAnimation();

            // Then after a delay, show the thumbs up animation
            setTimeout(() => {
                if (normalAnimationPlane) normalAnimationPlane.visible = false;
                if (thumbsUpAnimationPlane) thumbsUpAnimationPlane.visible = true;
                if (thumbsDownAnimationPlane) thumbsDownAnimationPlane.visible = false;

                frameAnimation.transitionInProgress = false;
            }, frameAnimation.transitionDelay);
        }
    } else {
        console.log("Thumbs up ended in three-scene.js");

        if (!frameAnimation.transitionInProgress) {
            frameAnimation.transitionInProgress = true;

            // Delay before switching back to normal
            setTimeout(() => {
                if (normalAnimationPlane) normalAnimationPlane.visible = true;
                if (thumbsUpAnimationPlane) thumbsUpAnimationPlane.visible = false;
                if (thumbsDownAnimationPlane) thumbsDownAnimationPlane.visible = false;

                frameAnimation.transitionInProgress = false;
            }, frameAnimation.transitionDelay);
        }
    }
});

window.addEventListener('thumbsDown', (event) => {
    const active = event.detail.active;

    if (active) {
        console.log("Thumbs down detected in three-scene.js");

        if (!frameAnimation.transitionInProgress) {
            frameAnimation.transitionInProgress = true;

            // First trigger the animation and scrolling
            triggerThumbsDownAnimation();

            // Scroll down to the next section
            if (scrollingEnabled && targetSection < 2) {
                targetSection += 1;
                scrollY = targetSection;

                // Update active dot
                document.querySelectorAll('.dot').forEach((dot, index) => {
                    dot.classList.toggle('active', index === targetSection);
                });

                // Scroll the actual DOM content
                // This is the key addition to fix the text scrolling issue
                const sectionHeight = window.innerHeight;
                const targetScrollPosition = targetSection * sectionHeight;

                // Smoothly scroll to the target section
                window.scrollTo({
                    top: targetScrollPosition,
                    behavior: 'smooth'
                });
            }

            // Then after a delay, show the thumbs down animation
            setTimeout(() => {
                if (normalAnimationPlane) normalAnimationPlane.visible = false;
                if (thumbsUpAnimationPlane) thumbsUpAnimationPlane.visible = false;
                if (thumbsDownAnimationPlane) thumbsDownAnimationPlane.visible = true;

                frameAnimation.transitionInProgress = false;
            }, frameAnimation.transitionDelay);
        }
    } else {
        console.log("Thumbs down ended in three-scene.js");

        if (!frameAnimation.transitionInProgress) {
            frameAnimation.transitionInProgress = true;

            // Delay before switching back to normal
            setTimeout(() => {
                if (normalAnimationPlane) normalAnimationPlane.visible = true;
                if (thumbsUpAnimationPlane) thumbsUpAnimationPlane.visible = false;
                if (thumbsDownAnimationPlane) thumbsDownAnimationPlane.visible = false;

                frameAnimation.transitionInProgress = false;
            }, frameAnimation.transitionDelay);
        }
    }
});

window.addEventListener('pointingUp', (event) => {
    processGestureScrolling(event.detail.active, false);
});

window.addEventListener('pointingDown', (event) => {
    processGestureScrolling(false, event.detail.active);
});

// ============================================================
// INITIALIZATION
// ============================================================
function createScene() {
    setupKeyboardControls();
    // Create each section
    createSection1();
    createAnimatedText();
    createStaticText();
    createStaticText2();
    //   initializeAnimatedText();
    createSection2();
    createSection3();



    console.log("All sections created:",
        "Section1:", sectionObjects.section1.parallaxLayers.length,
        "Section2:", sectionObjects.section2.parallaxLayers.length,
        "Section3:", sectionObjects.section3.parallaxLayers.length);

    // Set up camera
    camera.position.z = 5;

    // Enable scrolling after intro animation completes
    setTimeout(() => {
        scrollingEnabled = true;
    }, 3000);

    // Preload animation frames
    preloadAnimationFrames();
}

// Initialize the scene when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    createScene();
    animate();
});