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
const ambientLight = new THREE.AmbientLight(0xfff2cc, 1.2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffc0cb, 1);

directionalLight.position.set(0, 1, 1);
directionalLight.castShadow = true;



// Position the light to better illuminate your model
directionalLight.position.set(-5, 5, 5);

// Set up shadow properties
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;


scene.add(directionalLight);



function ensureCastShadows(model) {
    model.traverse(function (node) {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;

            // Fix for some materials that may not support shadows properly
            if (node.material) {
                // If it's an array of materials
                if (Array.isArray(node.material)) {
                    node.material.forEach(material => {
                        material.shadowSide = THREE.BackSide; // Try BackSide if FrontSide doesn't work
                        // Force material update
                        material.needsUpdate = true;
                    });
                } else {
                    // Single material
                    node.material.shadowSide = THREE.BackSide; // Try BackSide if FrontSide doesn't work
                    // Force material update
                    node.material.needsUpdate = true;
                }
            }
        }
    });
}


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

const textAnimationState = {
    sectionOneActive: false,
    sectionTwoActive: false
};


// Animation planes are global
let normalAnimationPlane = null;
let thumbsUpAnimationPlane = null;
let thumbsDownAnimationPlane = null;

// 1. Update the switchableImages object structure
const switchableImages = {
    tangerine: {
        currentImageIndex: 0,
        imagePaths: [
            'assets/images/tangerine1.png',
            'assets/images/tangerine2.png',
            'assets/images/tangerine3.png' // You can add as many paths as needed
        ],
        textures: [] // This will store the preloaded textures
    }
    // // Example of another item with multiple images
    // bowl: {
    //     currentImageIndex: 0,
    //     imagePaths: [
    //         'assets/images/bowl1.png',
    //         'assets/images/bowl2.png',
    //         'assets/images/bowl3.png',
    //         'assets/images/bowl4.png'
    //     ],
    //     textures: []
    // }
    // You can add more switchable image objects here
};

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
    fps: 9,
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
const maxZoom = 1.1;
const panSpeed = 0.05;
let isPanning = false;
let keysPressed = {};

const panKeys = {
    left: 'arrowleft',
    right: 'arrowright'

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


const projectDescriptions = {
    bowl: {
        title: "This Website!",
        description: "I designed and programmed this to encapsulate who I am. This website, from the hand-drawn assets to the style of writing, is something that only I'd make. This was really fun to work with though! I am still adding new easter eggs and side quests if you check back at a later time! ",
        technologies: ["Javascript, Three.js, CSS, HTML"],
        image: "assets/images/bowl1.png",
        link: "https://grace-jin.vercel.app/"
    },

    springrolls: {
        title: "Physics XR Models for Cornell's Physics Department",
        description: "Building visualizations for EM Waves, Gaussian Surfaces, and multiple other models with Unity and C# to help students visualize otherwise invisible electromagnetism concepts. Built in collaboration with Cornell's Physics department, with 800+ plays.",
        technologies: ["Unity", "C#"],
        image: "assets/images/springrolls1.png",
        link: "https://play.unity.com/en/games/f03d915a-8c42-4005-98c4-b00c0ef4da1b/gaussian-surface-simulation"
    },
    tea: {
        title: "NeuroScent-MIT Reality Hack 2025 Smart Sensing Winner",
        description: "Inspired by a reserach paper, I collaborated with a team of 5 to create Neuroscent, a system connecting VR brain-computer interfaces with olfactory displays to promote users’ mental well-being based on biofeedback. Used OpenBCI’s Galea ($30k) BCI VR Headset connected to Unity with a dynamic interactive environment based off of detected alpha brain waves. Basically, hands-free exploration in a Unity Enviornment that I designed and coded up from scratch :). Trying to turn this into a cross-university project right now!",
        technologies: ["C#", "Unity", "OpenBCI software", "Blender", "Arduino"],
        image: "assets/images/tea1.png",
        link: "https://devpost.com/software/neuroscent"

    },
    soysauce:
    {
        title: "Good Old Soy Sauce",
        description: "I just really like soy sauce.",
        technologies: ["probably crack because it tastes so good"],
        image: "assets/images/soysauce1.png",
        link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"


    }

    // springrolls: {

    // }
};

// Initialize variables for model interaction (part 2 for now)
let modelContainer = null;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let modelRotation = { x: 0, y: 0 };
let modelLoaded = false;

// const enhancedProjectDescriptions = {
//     bowl: {
//         title: "Interactive Data Visualization Dashboard",
//         shortDescription: "An interactive dashboard that visualizes complex datasets using D3.js and React.",
//         fullDescription: `This project addresses the challenge of making complex data accessible and understandable through intuitive visualizations. 

//         I designed and implemented a responsive dashboard that transforms raw datasets into interactive visual representations. The dashboard features real-time filtering, customizable views, and animated transitions between data states.

//         Key features include:
//         • Interactive charts and graphs with tooltips and drill-down capabilities
//         • Custom animation system for smooth transitions between data views
//         • Responsive design that works across desktop and mobile devices
//         • Data export functionality in multiple formats`,
//         technologies: ["React", "D3.js", "JavaScript", "CSS", "REST API", "Figma"],
//         mainImage: "assets/images/projects/data_viz_project.jpg",
//         galleryImages: [
//             "assets/images/projects/data_viz_1.jpg",
//             "assets/images/projects/data_viz_2.jpg",
//             "assets/images/projects/data_viz_3.jpg"
//         ],
//         stats: {
//             duration: "3 months",
//             role: "Lead Developer",
//             team: "3 people",
//             status: "Deployed"
//         },
//         link: "https://github.com/yourusername/data-viz-project",
//         demoLink: "https://your-demo-url.com"
//     }
// };


// ============================================================
// UTILITY FUNCTIONS
// ============================================================
let assetsLoaded = 0;
const totalAssets = 10; // Adjust this number

function assetLoaded() {
    assetsLoaded++;
    if (assetsLoaded >= totalAssets) {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 1000);
    }
}

function createStaticText() {
    const fontLoader = new THREE.FontLoader();
    const textDepth = -6; // Same depth as your animated text

    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
        // Create text geometry with larger size
        const textGeometry = new THREE.TextGeometry('GRACE JIN', {
            font: font,
            size: 1.5,
            height: 0.1,
            curveSegments: 12,
            bevelEnabled: false
        });

        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);

        // Center the text horizontally
        textGeometry.center();

        // Position above the animated text
        textMesh.position.set(-1, 6.7, textDepth); // Higher y-position than animated text
        textMesh.rotation.x = -0.2; // Same tilt as animated text

        scene.add(textMesh);
    });
}

function createStaticText2() {
    const fontLoader = new THREE.FontLoader();
    const textDepth = -6; // Same depth as your animated text

    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
        // Create text geometry with larger size
        const textGeometry = new THREE.TextGeometry('Cornell  + AI \'27 ', {
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
        textMesh.position.set(-1.5, 5.2, textDepth); // Higher y-position than animated text
        textMesh.rotation.x = -0.2; // Same tilt as animated text

        scene.add(textMesh);
    });
}
// Updated section one text animation function
function createAnimatedText() {
    const fontLoader = new THREE.FontLoader();
    const textDepth = -6;

    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
        const textGeometry = new THREE.TextGeometry('', {
            font: font,
            size: 0.3,
            height: 0.1,
            curveSegments: 12,
            bevelEnabled: false
        });
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);

        textMesh.position.set(-1.5, 3, textDepth);
        textMesh.rotation.x = -0.2;
        scene.add(textMesh);

        // Array of words to cycle through
        const words = ["Passionionate about \nconnecting with people \nthrough fun, immersive technology, \n coding, and design.", "I am a...",
            "Software Developer.", "Designer.", "Digital Artist.", "Content Creator.", "Cancer Survivor.", "Try looking around!"];
        let wordIndex = 0;
        let currentText = '';
        let isTyping = true;
        let charIndex = 0;
        let lastUpdateTime = 0;
        const typingSpeed = 30; // milliseconds per character

        console.log("Starting section one text animation with words:", words);

        function animateText(currentTime) {
            // First check if we should be active based on section
            if (currentSection > 0.7) {
                if (textAnimationState.sectionOneActive) {
                    console.log("SECTION ONE: Deactivating text animation");
                    textAnimationState.sectionOneActive = false;
                }
                textMesh.visible = false;
                requestAnimationFrame(animateText);
                return;
            } else {
                if (!textAnimationState.sectionOneActive) {
                    console.log("SECTION ONE: Activating text animation");
                    textAnimationState.sectionOneActive = true;
                }
                textMesh.visible = true;
            }

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
                        console.log("SECTION ONE: Switching to next word, index:", wordIndex, "word:", words[wordIndex]);

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
                    size: 0.3,
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
    modelContainer.position.set(-3, -window.innerHeight / 45 + 12, 1.5);
    modelContainer.rotation.x = Math.PI / 2;
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

    // Rotation variables
    let isRotating = true;  // Set to true to start rotating by default
    const rotationSpeed = 0.01;  // Adjust rotation speed as needed

    // Load the model
    loader.load(
        'assets/fortunecookie.glb',
        function (gltf) {
            console.log('Model loaded successfully');

            const model = gltf.scene;

            ensureCastShadows(model);


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

            // Set up shadows for all meshes in the model
            model.traverse(function (object) {
                if (object.isMesh) {
                    object.castShadow = true;
                    object.receiveShadow = true;
                    object.userData.clickable = true;
                    object.userData.originalName = object.name;
                }
            });

            // Create a rotation animation function
            function animateModelRotation() {
                if (isRotating && !isDragging) {
                    // Rotate the model around the Y axis (can be changed to any axis)
                    model.rotation.y += rotationSpeed;
                }
                requestAnimationFrame(animateModelRotation);
            }

            // Start the rotation animation
            animateModelRotation();

            // Add key press to toggle rotation (optional)
            document.addEventListener('keydown', function (event) {
                if (event.key === 'r' || event.key === 'R') {
                    isRotating = !isRotating;
                    console.log("Rotation toggled:", isRotating ? "ON" : "OFF");
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



// Update your event listeners in setupKeyboardControls function:
function setupKeyboardControls() {
    // Listen for key down events
    document.addEventListener('keydown', function (event) {
        // Store key state (convert to lowercase for consistency)
        keysPressed[event.key.toLowerCase()] = true;

        // Handle zoom controls for all sections
        if (event.key === '+' || event.key === '=') {
            zoomIn();
        }
        else if (event.key === '-' || event.key === '_') {
            zoomOut();
        }
        // Check if it's a pan key (left/right arrows only)
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

        // Pan left/right with limits (using arrow keys now)
        if (keysPressed['arrowleft']) {
            // Calculate the distance from original position
            const currentOffsetX = layer.position.x - layer.userData.originalPanX;

            // Only allow panning if within limits
            if (currentOffsetX < panLimits.maxX) {
                newX = layer.position.x + panAmount;
            }
        } else if (keysPressed['arrowright']) {
            // Calculate the distance from original position
            const currentOffsetX = layer.userData.originalPanX - layer.position.x;

            // Only allow panning if within limits
            if (currentOffsetX < panLimits.maxX) {
                newX = layer.position.x - panAmount;
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
            <p><strong>Scroll!:</strong> scroll down to see more!</p>
            <p><strong>Zoom:</strong> + / - keys</p>
            <p><strong>Pan:</strong> left and right keys</p>
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
        plane.position.z = zPosition - 0.7;

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
        width: fullSize.width * 0.2,
        height: fullSize.height * 0.7
    };

    // Create position vector with higher Y value
    const position = new THREE.Vector3(
        size.width * 0.4,
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
            height: newFullSize.height * 0.85
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
    const totalNormalFrames = 5;
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
    createSection1ImageLayer(-6, '/assets/images/groceryfloor.png', 0.8, 8, 'groceryfloor', 0); // set floor to oe or else overalp
    createSection1ImageLayer(-5, 'assets/images/groceryshelf.png', 0.4, 6, 'groceryshelf', 0);
    createSection1ImageLayer(-4, 'assets/images/groceryshelf2.png', 0.6, 4, 'groceryshelf2', 0);


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

        '/assets/images/ginger.png',
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

    createSection1ClickableObject(

        'assets/images/linkedin.png',
        { x: 2.8, y: 3, z: -0.5 },
        { width: 2, height: 3 },
        0.01,
        'https://www.linkedin.com/in/grace-jin-9654a826b/',
        ''
    );

    createSection1ClickableObject(

        'assets/images/github.png',
        { x: -3.5, y: 2.6, z: 0 },
        { width: 1.5, height: 2.5 },
        0.01,
        'https://github.com/gracejinsotrue',
        ''
    );

    createSection1NonClickableObject(

        'assets/images/aboutme.png',
        { x: -5.2, y: 2.6, z: 0 },
        { width: 2.4, height: 3.4 },
        0.01,
        0.7, 0
    );



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
// Updated section two text animation function
// function createSectionTwoText() {
//     const fontLoader = new THREE.FontLoader();

//     fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
//         // Create initial text with content for immediate visibility
//         const textGeometry = new THREE.TextGeometry('SECTION TWO TEXT', {
//             font: font,
//             size: 0.5,              // Good size for visibility
//             height: 0.1,
//             curveSegments: 12,
//             bevelEnabled: false
//         });

//         // Use a bright, visible material
//         const textMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff }); // Cyan for visibility
//         const textMesh = new THREE.Mesh(textGeometry, textMaterial);

//         // Position the text in front of the camera
//         // With camera at z=5, this puts the text at z=0, which is within view
//         textMesh.position.set(0, 0, 0);

//         // Center the text geometry
//         textGeometry.computeBoundingBox();
//         const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
//         const textHeight = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;
//         textMesh.position.x = -textWidth / 2;
//         textMesh.position.y = -textHeight / 2;

//         // Add to scene
//         scene.add(textMesh);

//         console.log("Section two text added at position:",
//             textMesh.position.x, textMesh.position.y, textMesh.position.z);

//         // Array of words for section two
//         const words = [
//             "Welcome to section two!",
//             "Here you can learn about\nmy projects and skills.",
//             "Explore interactive models\nand designs.",
//             "Discover my creative process."
//         ];

//         let wordIndex = 0;
//         let currentText = 'SECTION TWO TEXT'; // Start with visible text
//         let isTyping = true;
//         let charIndex = 0;
//         let lastUpdateTime = 0;
//         const typingSpeed = 30;

//         function animateText(currentTime) {
//             // Check if we should be visible based on section
//             const shouldBeVisible = currentSection >= 0.7 && currentSection <= 1.5;

//             if (!shouldBeVisible) {
//                 if (textMesh.visible) {
//                     console.log("Section two text hidden, section =", currentSection);
//                     textMesh.visible = false;
//                 }
//                 requestAnimationFrame(animateText);
//                 return;
//             }

//             // Make visible if it wasn't already
//             if (!textMesh.visible) {
//                 console.log("Section two text shown, section =", currentSection);
//                 textMesh.visible = true;
//                 // Reset animation when becoming visible again
//                 wordIndex = 0;
//                 charIndex = 0;
//                 currentText = '';
//                 isTyping = true;
//             }

//             // Animate the text
//             if (currentTime - lastUpdateTime > typingSpeed) {
//                 lastUpdateTime = currentTime;

//                 if (isTyping) {
//                     const currentWord = words[wordIndex];

//                     if (charIndex < currentWord.length) {
//                         currentText = currentWord.substring(0, charIndex + 1);
//                         charIndex++;
//                     } else {
//                         isTyping = false;
//                         setTimeout(() => {
//                             lastUpdateTime = performance.now();
//                         }, 1500);
//                     }
//                 } else {
//                     if (currentText.length > 0) {
//                         currentText = currentText.slice(0, -1);
//                     } else {
//                         wordIndex = (wordIndex + 1) % words.length;
//                         console.log("Section 2 text switching to:", words[wordIndex]);
//                         isTyping = true;
//                         charIndex = 0;
//                         setTimeout(() => {
//                             lastUpdateTime = performance.now();
//                         }, 500);
//                     }
//                 }

//                 // Update the text geometry
//                 textMesh.geometry.dispose();
//                 textMesh.geometry = new THREE.TextGeometry(currentText, {
//                     font: font,
//                     size: 0.5,
//                     height: 0.1,
//                     curveSegments: 12,
//                     bevelEnabled: false
//                 });

//                 // Center the updated text
//                 textMesh.geometry.computeBoundingBox();
//                 const updatedTextWidth = textMesh.geometry.boundingBox.max.x - textMesh.geometry.boundingBox.min.x;
//                 const updatedTextHeight = textMesh.geometry.boundingBox.max.y - textMesh.geometry.boundingBox.min.y;
//                 textMesh.position.x = -updatedTextWidth / 2;
//                 textMesh.position.y = -updatedTextHeight / 2;
//             }

//             requestAnimationFrame(animateText);
//         }

//         // Start the animation
//         requestAnimationFrame(animateText);
//     });
// }
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

// Function to create a switchable image in section 2
function createSection2SwitchableImage(position, size, name) {
    if (!switchableImages[name]) {
        console.error(`No switchable image configuration found for: ${name}`);
        return;
    }

    const imageConfig = switchableImages[name];
    const initialPath = imageConfig.imagePaths.default;

    const textureLoader = new THREE.TextureLoader();

    textureLoader.load(initialPath, (texture) => {
        console.log(`Successfully loaded initial image for ${name}`);

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
            name: name,
            isSwitchable: true,  // Flag to identify switchable images
            originalScale: new THREE.Vector3(1, 1, 1),
            hoverScale: new THREE.Vector3(1.05, 1.05, 1.05),
            isHovered: false,
            isClickable: true
        };

        // Store original position for reset
        storeLayerOriginalPosition(plane);

        scene.add(plane);

        // Add to appropriate arrays
        sectionObjects.section2.parallaxLayers.push(plane);
        sectionObjects.section2.clickableObjects.push(plane);

        console.log(`Created switchable image: ${name}`);

        // Preload the alternate image
        textureLoader.load(imageConfig.imagePaths.alternate, (altTexture) => {
            // Store the textures in the switchableImages object for quick access
            switchableImages[name].textures = {
                default: texture,
                alternate: altTexture
            };
        });
    });
}


// Updated switchImage function to stop at the last image
function switchImage(objectName) {
    if (!switchableImages[objectName]) {
        console.error(`Attempted to switch non-existent image: ${objectName}`);
        return;
    }

    const imageConfig = switchableImages[objectName];

    // Advance to the next image, but only if not at the last one already
    if (imageConfig.currentImageIndex < imageConfig.imagePaths.length - 1) {
        imageConfig.currentImageIndex += 1;
        console.log(`Switching ${objectName} to image index: ${imageConfig.currentImageIndex}`);
    } else {
        console.log(`${objectName} already at final image (index: ${imageConfig.currentImageIndex})`);
        return; // Already at the last image, do nothing
    }

    // Find the object in the scene
    let found = false;
    sectionObjects.section2.parallaxLayers.forEach(layer => {
        if (layer.userData.name === objectName && layer.userData.isSwitchable) {
            found = true;

            // Use the preloaded textures if available
            if (imageConfig.textures && imageConfig.textures.length > 0) {
                const newTexture = imageConfig.textures[imageConfig.currentImageIndex];

                if (newTexture) {
                    layer.material.map = newTexture;
                    layer.material.needsUpdate = true;
                    console.log(`Switched ${objectName} to texture at index: ${imageConfig.currentImageIndex}`);
                } else {
                    console.warn(`No preloaded texture found for ${objectName} at index ${imageConfig.currentImageIndex}`);
                }
            } else {
                // Fallback to loading the texture if not preloaded
                const texturePath = imageConfig.imagePaths[imageConfig.currentImageIndex];

                new THREE.TextureLoader().load(texturePath, (texture) => {
                    layer.material.map = texture;
                    layer.material.needsUpdate = true;
                    console.log(`Loaded and switched ${objectName} to image at path: ${texturePath}`);
                });
            }
        }
    });

    if (!found) {
        console.error(`Could not find object to switch: ${objectName}`);
    }
}


// 3. Enhanced function to preload all textures for smoother switching
function preloadSwitchableImageTextures() {
    const textureLoader = new THREE.TextureLoader();

    Object.keys(switchableImages).forEach(objName => {
        const imageConfig = switchableImages[objName];

        // Clear any existing textures
        imageConfig.textures = [];

        // Preload all textures for this object
        imageConfig.imagePaths.forEach((path, index) => {
            console.log(`Preloading texture for ${objName}, path: ${path}`);

            textureLoader.load(path, (texture) => {
                imageConfig.textures[index] = texture;
                console.log(`Preloaded texture ${index + 1}/${imageConfig.imagePaths.length} for ${objName}`);
            });
        });
    });
}



// 4. Enhanced createSection2SwitchableImage function to work with the new system
function createSection2SwitchableImage(position, size, name) {
    if (!switchableImages[name]) {
        console.error(`No switchable image configuration found for: ${name}`);
        return;
    }

    const imageConfig = switchableImages[name];
    const initialPath = imageConfig.imagePaths[0]; // Always start with the first image

    const textureLoader = new THREE.TextureLoader();

    textureLoader.load(initialPath, (texture) => {
        console.log(`Successfully loaded initial image for ${name}`);

        // Store the loaded texture
        if (!imageConfig.textures[0]) {
            imageConfig.textures[0] = texture;
        }

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
            name: name,
            isSwitchable: true,  // Flag to identify switchable images
            originalScale: new THREE.Vector3(1, 1, 1),
            hoverScale: new THREE.Vector3(1.05, 1.05, 1.05),
            isHovered: false,
            isClickable: true
        };

        // Store original position for reset
        storeLayerOriginalPosition(plane);

        scene.add(plane);

        // Add to appropriate arrays
        sectionObjects.section2.parallaxLayers.push(plane);
        sectionObjects.section2.clickableObjects.push(plane);

        console.log(`Created switchable image: ${name}`);

        // Preload all other images for this switchable image
        for (let i = 1; i < imageConfig.imagePaths.length; i++) {
            textureLoader.load(imageConfig.imagePaths[i], (altTexture) => {
                imageConfig.textures[i] = altTexture;
                console.log(`Preloaded alternative texture ${i} for ${name}`);
            });
        }
    });
}
// Call this in createSection2() to add your tangerine
function addSwitchableImagesToSection2() {
    // Add the tangerine at an appropriate position
    createSection2SwitchableImage(
        { x: 3.9, y: 4.8, z: 0.1 },  // Position
        { width: 2.4, height: 3 },     // Size
        'tangerine'                   // Name (must match entry in switchableImages)
    );
}

// 5. Call this during initialization to preload all texturefs
function initSwitchableImages() {
    preloadSwitchableImageTextures();

    // Call this in your scene setup
    // Make sure to add this call to createScene() or another initialization function
    console.log("Initialized enhanced switchable images system");
}
function createSection2() {
    // Create all section 2 layers
    createSection2ImageLayer(-7, 'assets/images/table.png', 0.2, 'section2-background');


    loadInteractiveModel(); //fix panning issue

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

    addSwitchableImagesToSection2();
    initSwitchableImages();






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

// Modify createAnimatedBowl function to add a project property
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

        // Store metadata with project information
        plane.userData = {
            section: 'section2',
            name: 'bowl',
            isAnimated: true,
            isClickable: bowlAnimation.isClickable,
            imagePath: bowlAnimation.imagePath,
            originalScale: new THREE.Vector3(1, 1, 1),
            hoverScale: new THREE.Vector3(1.05, 1.05, 1.05),
            isHovered: false,
            project: true // Flag to indicate this is a project object
        };

        // Store original position for reset
        storeLayerOriginalPosition(plane);

        scene.add(plane);

        // Add to appropriate arrays
        sectionObjects.section2.parallaxLayers.push(plane);

        if (bowlAnimation.isClickable) {
            sectionObjects.section2.clickableObjects.push(plane);
        }

        console.log("Created animated bowl with project info");
    }, undefined, (error) => {
        console.error("Error loading first bowl frame:", error);
    });
}

// // Function to display a local image in a modal overlay
// function displayLocalImage(imagePath) {
//     // Create a modal to display the image
//     const modal = document.createElement('div');
//     modal.className = 'image-modal';
//     modal.innerHTML = `
//         <div class="modal-content">
//             <span class="close-button">&times;</span>
//             <img src="${imagePath}" alt="Bowl Image">
//         </div>
//     `;

//     // Add styles for the modal
//     const style = document.createElement('style');
//     style.textContent = `
//         .image-modal {
//             position: fixed;
//             top: 0;
//             left: 0;
//             width: 100%;
//             height: 100%;
//             background-color: rgba(0, 0, 0, 0.8);
//             display: flex;
//             justify-content: center;
//             align-items: center;
//             z-index: 1000;
//         }
//         .modal-content {
//             position: relative;
//             background-color: #222;
//             padding: 20px;
//             border-radius: 10px;
//             max-width: 80%;
//             max-height: 80%;
//         }
//         .modal-content img {
//             max-width: 100%;
//             max-height: 70vh;
//             display: block;
//             border-radius: 5px;
//         }
//         .close-button {
//             position: absolute;
//             top: 10px;
//             right: 15px;
//             color: white;
//             font-size: 28px;
//             font-weight: bold;
//             cursor: pointer;
//         }
//         .close-button:hover {
//             color: #ccc;
//         }
//     `;

//     document.head.appendChild(style);
//     document.body.appendChild(modal);

//     // Add close functionality
//     const closeButton = modal.querySelector('.close-button');
//     closeButton.addEventListener('click', () => {
//         document.body.removeChild(modal);
//     });

//     // Also close when clicking outside the image
//     modal.addEventListener('click', (e) => {
//         if (e.target === modal) {
//             document.body.removeChild(modal);
//         }
//     });
// }

// Function to create and display project description popup
function displayProjectDescription(objectName) {
    // Create a modal to display the project information
    const modal = document.createElement('div');
    modal.className = 'project-modal';

    // Get project data for the clicked object
    const project = projectDescriptions[objectName] || {
        title: "Project Details",
        description: "Details for this project will be coming soon!",
        technologies: ["JavaScript", "Three.js"],
        image: `${objectName}1.png`, // Fallback to the first frame of animation
        link: "#"
    };

    // Create HTML content with project details
    modal.innerHTML = `
        <div class="project-content">
            <span class="close-button">&times;</span>
            <div class="project-layout">
                <div class="project-image-container">
                    <img src="${project.image}" alt="${project.title}" class="project-image">
                </div>
                <div class="project-details">
                    <h2 class="project-title">${project.title}</h2>
                    <p class="project-description">${project.description}</p>
                    <div class="tech-stack">
                        <h3>Technologies:</h3>
                        <ul>
                            ${project.technologies.map(tech => `<li>${tech}</li>`).join('')}
                        </ul>
                    </div>
                    <a href="${project.link}" target="_blank" class="project-link">View Project</a>
                </div>
            </div>
        </div>
    `;

    // Add styles for the modal
    if (!document.getElementById('project-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'project-modal-styles';
        style.textContent = `
           
.project-modal {
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
    opacity: 0;
    transition: opacity 0.3s ease;
    font-family: Arial, sans-serif;
}

.project-content {
    position: relative;
    background-color: #fff;
    color: #333;
    padding: 30px;
    border-radius: 10px;
    width: 70%;
    max-width: 1100px; 
    max-height: 90vh;
    overflow-y: auto;
    overflow-x: hidden; /* Prevent horizontal scrolling */
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    transform: translateY(20px);
    transition: transform 0.3s ease;
    box-sizing: border-box;
}

.project-modal.active {
    opacity: 1;
}

.project-modal.active .project-content {
    transform: translateY(0);
}

.project-layout {
    display: flex;
    flex-wrap: wrap;
    gap: 50px; /* More spacing between sections */
    width: 100%;
    box-sizing: border-box;
}

.project-image-container {
    flex: 1;
    min-width: 250px;
    max-width: 100%;
    box-sizing: border-box;
}

.project-details {
    flex: 3; /* Give text much more space */
    min-width: 300px;
    max-width: 100%;
    box-sizing: border-box;
    width: 100%;
}

.project-image {
    width: 100%;
    max-height: 300px;
    object-fit: cover;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.project-title {
    font-size: 28px;
    margin-top: 0;
    margin-bottom: 20px;
    color: #2a2a2a;
    word-break: break-word;
}

.project-description {
    font-size: 16px;
    line-height: 1.7;
    margin-bottom: 25px;
    word-break: normal;
    word-wrap: break-word;
    overflow-wrap: break-word;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    display: block;
    overflow-x: hidden;
}

.project-description p {
    margin-bottom: 1em;
    max-width: 100%;
    white-space: normal;
}

.tech-stack h3 {
    font-size: 18px;
    margin-bottom: 12px;
    color: #333;
}

.tech-stack ul {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    list-style: none;
    padding: 0;
    margin: 0 0 25px 0;
    max-width: 100%;
    box-sizing: border-box;
}

.tech-stack li {
    background-color: #f0f0f0;
    padding: 8px 14px;
    border-radius: 20px;
    font-size: 14px;
    color: #555;
    box-sizing: border-box;
}

.project-links {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    margin-top: 25px;
    max-width: 100%;
    box-sizing: border-box;
}

.project-link {
    display: inline-block;
    padding: 10px 20px;
    background-color: #4285f4;
    color: white;
    text-decoration: none;
    border-radius: 5px;
    font-weight: 500;
    transition: background-color 0.3s;
    box-sizing: border-box;
}

.demo-link {
    background-color: #34a853;
}

.project-link:hover {
    background-color: #3367d6;
}

.demo-link:hover {
    background-color: #2d8e47;
}

.close-button {
    position: absolute;
    top: 15px;
    right: 20px;
    color: #555;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
    transition: color 0.3s;
    z-index: 5;
}

.close-button:hover {
    color: #000;
}

.project-gallery {
    margin-top: 20px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    max-width: 100%;
    box-sizing: border-box;
}

.gallery-thumbnail {
    width: 100%;
    height: 70px;
    object-fit: cover;
    border-radius: 4px;
    cursor: pointer;
    transition: transform 0.2s;
}

.gallery-thumbnail:hover {
    transform: scale(1.05);
}

.project-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin: 20px 0;
    max-width: 100%;
    box-sizing: border-box;
}

.stat-item {
    background-color: #f8f8f8;
    padding: 8px 14px;
    border-radius: 6px;
    font-size: 14px;
    text-transform: capitalize;
    box-sizing: border-box;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    #main-title {
        font-size: 3rem;
    }

    #animated-subtitle {
        font-size: 1rem;
    }
    
    .project-layout {
        flex-direction: column;
        gap: 30px;
    }
    
    .project-content {
        padding: 20px;
        width: 90%;
    }
    
    .project-gallery {
        grid-template-columns: repeat(2, 1fr);
    }
}
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(modal);

    // Add close functionality
    const closeButton = modal.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    // Also close when clicking outside the content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });

    // Animation for the modal appearance
    requestAnimationFrame(() => {
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.3s ease';

        requestAnimationFrame(() => {
            modal.style.opacity = '1';
        });
    });
}

// Replace the existing displayLocalImage function with our new project description popup
function displayLocalImage(imagePath) {
    // Extract the object name from the image path
    let objectName = 'unknown';

    // Parse the name from the path (e.g., "assets/images/bowl1.png" -> "bowl")
    const match = imagePath.match(/\/([^\/]+?)(\d+)\.png$/);
    if (match && match[1]) {
        objectName = match[1];
    }

    // Call our new function with the extracted object name
    displayProjectDescription(objectName);
}
// Initialize our enhanced project system
function initializeEnhancedProjectSystem() {
    // Create the image directory for projects if it doesn't exist
    if (!document.querySelector('#project-directory-notice')) {
        const notice = document.createElement('div');
        notice.id = 'project-directory-notice';
        notice.style.display = 'none';
        notice.textContent = 'Remember to create the assets/images/projects/ directory';
        document.body.appendChild(notice);

        console.log('Don\'t forget to create the project images directory: assets/images/projects/');
    }

    // Apply the enhanced click handler
    updateMouseClickHandler();

    console.log("Enhanced project description system initialized");
}

// Function to update mouse click handler
function updateMouseClickHandler() {
    // Remove the old event listener
    window.removeEventListener('click', onMouseClick);

    // Add the updated event listener
    window.addEventListener('click', onMouseClick);

    console.log("Mouse click handler updated to support switchable images");
}

function formatDescription(text) {
    // Split by double newlines (paragraphs)
    const paragraphs = text.split('\n\n');

    // Join paragraphs with proper HTML paragraph tags
    return paragraphs.map(p => {
        // Trim whitespace and replace single newlines with spaces
        const cleanedParagraph = p.trim().replace(/\n/g, ' ');
        return `<p>${cleanedParagraph}</p>`;
    }).join('');
}

function closeModal(modal) {
    modal.style.opacity = '0';
    const content = modal.querySelector('.project-content');

    if (content) {
        content.style.transform = 'translateY(20px)';
    }

    // Remove after animation completes
    setTimeout(() => {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    }, 300);
}

function displayEnhancedProjectDescription(objectName) {
    // Create a modal to display the project information
    const modal = document.createElement('div');
    modal.className = 'project-modal';

    // Get project data for the clicked object
    const project = enhancedProjectDescriptions[objectName] || {
        title: "Project Details",
        shortDescription: "Details for this project will be coming soon!",
        fullDescription: "A more detailed description of this project will be available soon.",
        technologies: ["JavaScript", "Three.js"],
        mainImage: `assets/images/${objectName}1.png`, // Fallback to the first frame of animation
        galleryImages: [],
        stats: {
            duration: "Ongoing",
            role: "Developer",
            team: "Solo project",
            status: "In development"
        },
        link: "#",
        demoLink: null
    };

    // Format the description text into proper HTML paragraphs
    function formatDescription(text) {
        // Split by double newlines (paragraphs)
        const paragraphs = text.split('\n\n');

        // Join paragraphs with proper HTML paragraph tags
        return paragraphs.map(p => {
            // Trim whitespace and replace single newlines with spaces
            const cleanedParagraph = p.trim().replace(/\n/g, ' ');
            return `<p>${cleanedParagraph}</p>`;
        }).join('');
    }

    // Create HTML content with project details
    modal.innerHTML = `
        <div class="project-content">
            <span class="close-button">&times;</span>
            <div class="project-layout">
                <div class="project-image-container">
                    <img src="${project.mainImage}" alt="${project.title}" class="project-image">
                    
                    ${project.galleryImages.length > 0 ? `
                        <div class="project-gallery">
                            ${project.galleryImages.map(img =>
        `<img src="${img}" alt="Project screenshot" class="gallery-thumbnail">`
    ).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="project-details">
                    <h2 class="project-title">${project.title}</h2>
                    <div class="project-description">
                        ${formatDescription(project.fullDescription)}
                    </div>
                    
                    <div class="project-stats">
                        ${Object.entries(project.stats).map(([key, value]) =>
        `<div class="stat-item"><i class="stat-icon"></i>${key}: ${value}</div>`
    ).join('')}
                    </div>
                    
                    <div class="tech-stack">
                        <h3>Technologies:</h3>
                        <ul>
                            ${project.technologies.map(tech => `<li>${tech}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="project-links">
                        <a href="${project.link}" target="_blank" class="project-link">View Code</a>
                        ${project.demoLink ? `<a href="${project.demoLink}" target="_blank" class="project-link demo-link">Live Demo</a>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add close functionality
    const closeButton = modal.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
        closeModal(modal);
    });

    // Also close when clicking outside the content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });

    // Add gallery image enlargement functionality
    const galleryThumbnails = modal.querySelectorAll('.gallery-thumbnail');
    const mainImage = modal.querySelector('.project-image');

    if (galleryThumbnails.length > 0 && mainImage) {
        galleryThumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', () => {
                // Swap the images with a smooth transition
                mainImage.style.opacity = '0';
                setTimeout(() => {
                    mainImage.src = thumbnail.src;
                    mainImage.style.opacity = '1';
                }, 150);
            });
        });
    }

    // Animation for the modal appearance
    requestAnimationFrame(() => {
        modal.style.opacity = '0';
        const content = modal.querySelector('.project-content');

        if (content) {
            content.style.transform = 'translateY(20px)';
        }

        requestAnimationFrame(() => {
            modal.style.opacity = '1';

            if (content) {
                content.style.transform = 'translateY(0)';
            }
        });
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

let drawableScreen = {
    mesh: null,            // The Three.js mesh for the screen
    canvas: null,          // HTML canvas for drawing
    context: null,         // Canvas 2D context
    texture: null,         // Three.js texture created from canvas
    isHovering: false      // Whether mouse is hovering over screen
};

function createDrawableScreen() {
    // Create an HTML canvas for drawing
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;

    // Get the canvas context and set initial properties
    const context = canvas.getContext('2d');
    context.fillStyle = '#FFFFFF';  // White background
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Create a texture from the canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    // Create a plane geometry for the screen
    const geometry = new THREE.PlaneGeometry(2, 1.5);
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide
    });

    // Create the mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, -window.innerHeight / 200 - 25, 0);
    mesh.rotation.x = 0.1;

    // Add to scene
    scene.add(mesh);

    // Store references
    drawableScreen.mesh = mesh;
    drawableScreen.canvas = canvas;
    drawableScreen.context = context;
    drawableScreen.texture = texture;

    // Setup hover drawing event listener
    renderer.domElement.addEventListener('mousemove', onDrawableScreenMouseMove);

    return mesh;
}

function onDrawableScreenMouseMove(event) {
    // Calculate mouse position in normalized device coordinates
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    // Update raycaster
    raycaster.setFromCamera(mouse, camera);

    // Check for intersection with drawable screen
    const intersects = raycaster.intersectObject(drawableScreen.mesh);

    if (intersects.length > 0) {
        // Get intersection point
        const intersect = intersects[0];

        // Convert intersection point UV coordinates to canvas coordinates
        const canvasX = Math.floor(intersect.uv.x * drawableScreen.canvas.width);
        const canvasY = Math.floor((1 - intersect.uv.y) * drawableScreen.canvas.height);

        // Draw a line
        const ctx = drawableScreen.context;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 5;  // Adjust line thickness as desired
        ctx.lineCap = 'round';

        // Draw a dot or continue line
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();

        // Update texture
        drawableScreen.texture.needsUpdate = true;
    }
}

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

// // Function to create clickable objects in section 3 that can be zoomed in on
// function createSection3ZoomableObject(imagePath, position, size, name = '', zoomDetails = {}) {
//     const textureLoader = new THREE.TextureLoader();
//     textureLoader.load(imagePath, (texture) => {
//         const geometry = new THREE.PlaneGeometry(size.width, size.height);
//         const material = new THREE.MeshBasicMaterial({
//             map: texture,
//             transparent: true,
//             side: THREE.DoubleSide
//         });

//         const plane = new THREE.Mesh(geometry, material);

//         // Adjust position for section 3
//         const sectionSpacing = window.innerHeight / 60; //CHANGE THIS FOR SLISTIC PURPOSES
//         const adjustedPosition = {
//             x: position.x,
//             y: position.y - sectionSpacing * 2,
//             z: position.z
//         };

//         plane.position.set(adjustedPosition.x, adjustedPosition.y, adjustedPosition.z);

//         // Store metadata
//         plane.userData = {
//             section: 'section3',
//             isClickable: true,
//             isZoomable: true,
//             name: name,
//             originalScale: new THREE.Vector3(1, 1, 1),
//             hoverScale: new THREE.Vector3(1.05, 1.05, 1.05),
//             isHovered: false,

//             // Zoom properties
//             zoomPosition: zoomDetails.position || { x: 0, y: -sectionSpacing * 2, z: -2 },
//             zoomScale: zoomDetails.scale || 2,
//             zoomRotation: zoomDetails.rotation || { x: 0, y: 0, z: 0 },
//             closeupTexture: null,
//             closeupPath: zoomDetails.closeupPath || null
//         };

//         // If a closeup texture is provided, load it
//         if (zoomDetails.closeupPath) {
//             textureLoader.load(zoomDetails.closeupPath, (closeupTexture) => {
//                 plane.userData.closeupTexture = closeupTexture;
//             });
//         }

//         // Store original position for reset
//         storeLayerOriginalPosition(plane);

//         scene.add(plane);
//         sectionObjects.section3.clickableObjects.push(plane);
//         sectionObjects.section3.parallaxLayers.push(plane);

//         console.log(`Created zoomable object in section 3: ${name}`);
//     });
// }
// Function to create clickable objects in section 3 that can be zoomed in on (supports images and videos)
function createSection3ZoomableObject(mediaPath, position, size, name = '', zoomDetails = {}) {
    let material;
    let geometry = new THREE.PlaneGeometry(size.width, size.height);

    // Check if the mediaPath is a video or image
    if (mediaPath.endsWith('.mp4') || mediaPath.endsWith('.webm') || mediaPath.endsWith('.ogg')) {
        // Create video element
        const video = document.createElement('video');
        video.src = mediaPath;
        video.loop = true;
        video.muted = true;  // Ensure it's muted
        video.autoplay = true;  // Set autoplay if needed
        video.play().catch(error => {
            console.error("Video play error:", error);
        });

        // Create VideoTexture
        const videoTexture = new THREE.VideoTexture(video);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        videoTexture.generateMipmaps = false;
        videoTexture.format = THREE.RGBAFormat;

        // Create material using the VideoTexture
        material = new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.DoubleSide });
    } else {
        // Load image texture
        const textureLoader = new THREE.TextureLoader();
        material = new THREE.MeshBasicMaterial({
            map: textureLoader.load(mediaPath),
            transparent: true,
            side: THREE.DoubleSide
        });
    }

    const plane = new THREE.Mesh(geometry, material);

    // Adjust position for section 3
    const sectionSpacing = window.innerHeight / 60; // Change this for stylistic purposes
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

    // If a closeup image is provided, load it
    if (zoomDetails.closeupPath) {
        const textureLoader = new THREE.TextureLoader();
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

/// Function to zoom in on an object by moving the camera
function zoomInOn(object) {
    if (!object || isZoomedIn) return;

    // Store current state
    isZoomedIn = true;
    currentZoomedObject = object;

    // Store original camera position and rotation for later restoration
    originalCameraPosition = {
        position: camera.position.clone(),
        target: new THREE.Vector3(0, camera.position.y, 0) // Assuming camera looks at center by default
    };

    // If we have a closeup texture, save the original first and then switch
    if (object.userData.closeupTexture) {
        // Save the original texture
        object.userData.originalTexture = object.material.map;
        // Switch to closeup
        object.material.map = object.userData.closeupTexture;
        object.material.needsUpdate = true;
    }

    // Calculate target position for camera (in front of the object)
    const objectPosition = new THREE.Vector3();
    object.getWorldPosition(objectPosition);

    // Create a position slightly in front of the object
    const targetPosition = objectPosition.clone();

    // Adjust the z position to be closer to the object
    targetPosition.z += 2; // Move camera 2 units in front of the object

    // Create a visual overlay to dim other elements
    createOverlay();

    // Disable scrolling while zoomed in
    scrollingEnabled = false;

    // Add a "back" button
    addBackButton();

    // Animate camera to move toward the object
    gsap.to(camera.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z - 3.5, // TODO: Position camera 3 units in front of the object
        duration: 1.2,
        ease: "power2.inOut",
        onUpdate: function () {
            // Optional: make camera continuously look at the object during animation
            camera.lookAt(objectPosition);
        },
        onComplete: function () {
            camera.lookAt(objectPosition);
            console.log("Camera zoom-in complete!");
        }
    });

    // Add click outside to zoom out
    document.addEventListener('click', handleClickOutside);
}
// Function to zoom out by moving camera back to original position
function zoomOut() {
    if (!isZoomedIn || !currentZoomedObject) return;

    // Switch back to original texture if needed
    if (currentZoomedObject.userData.closeupTexture) {
        if (currentZoomedObject.userData.originalTexture) {
            currentZoomedObject.material.map = currentZoomedObject.userData.originalTexture;
            currentZoomedObject.material.needsUpdate = true;
        } else {
            const originalTexturePath = currentZoomedObject.userData.originalTexturePath;
            if (originalTexturePath) {
                new THREE.TextureLoader().load(originalTexturePath, (texture) => {
                    currentZoomedObject.material.map = texture;
                    currentZoomedObject.material.needsUpdate = true;
                });
            }
        }
    }

    // After a brief delay, move camera back to original position
    setTimeout(() => {
        if (originalCameraPosition) {
            // Animate camera back to original position
            gsap.to(camera.position, {
                x: originalCameraPosition.position.x,
                y: originalCameraPosition.position.y,
                z: originalCameraPosition.position.z,
                duration: 1.2,
                ease: "power2.inOut",
                onUpdate: function () {
                    // Optional: gradually transition camera look target
                    camera.lookAt(0, camera.position.y, 0);
                },
                onComplete: function () {
                    camera.lookAt(0, camera.position.y, 0);
                    console.log("Camera zoom-out complete!");
                }
            });
        }

        // Remove overlay and back button
        removeOverlay();
        removeBackButton();

        // Enable scrolling again
        scrollingEnabled = true;

        // Remove click outside handler
        document.removeEventListener('click', handleClickOutside);

        // Reset state
        isZoomedIn = false;
        currentZoomedObject = null;
    }, 500); // Half-second delay before camera moves back
}
// Function to zoom in on an object by moving the camera //TODO: fix the positioning of thse hoes
function zoomInOn(object) {
    if (!object || isZoomedIn) return;

    // Store current state
    isZoomedIn = true;
    currentZoomedObject = object;

    // Store original camera position and rotation for later restoration
    originalCameraPosition = {
        position: camera.position.clone(),
        target: new THREE.Vector3(0, camera.position.y, 0)
    };

    // Calculate target position for camera (in front of the object)
    const objectPosition = new THREE.Vector3();
    object.getWorldPosition(objectPosition);

    // Calculate how much to move the camera
    // Since your camera is at z = 5, we need a different approach
    const currentZ = camera.position.z; // Should be 5 based on your info
    const targetZ = objectPosition.z + 2; // Position camera 3 units in front of object
    const moveAmount = currentZ - targetZ; // How much to move the camera

    // If we have a closeup texture, save the original first and then switch
    if (object.userData.closeupTexture) {
        // Save the original texture
        object.userData.originalTexture = object.material.map;
        // Switch to closeup
        object.material.map = object.userData.closeupTexture;
        object.material.needsUpdate = true;
    }

    // Create a visual overlay to dim other elements
    //  createOverlay();

    // Disable scrolling while zoomed in
    scrollingEnabled = false;

    // Add a "back" button
    addBackButton();

    // Animate camera to move toward the object
    gsap.to(camera.position, {
        x: objectPosition.x, // Center on the object horizontally
        y: objectPosition.y, // Center on the object vertically
        z: targetZ, // Move camera to the calculated z position
        duration: 1.2,
        ease: "power2.inOut",
        onComplete: function () {
            // Make sure camera is looking at the object
            camera.lookAt(objectPosition);
            console.log("Camera zoom-in complete!");
        }
    });

    // Add click outside to zoom out
    document.addEventListener('click', handleClickOutside);
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


// Updated onMouseClick function to handle switchable images
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
        console.log("Clicked object userData:", clickedObject.userData);

        // Check if it's a switchable image
        if (clickedObject.userData.isSwitchable && clickedObject.userData.name &&
            switchableImages[clickedObject.userData.name]) {
            console.log(`Switching image: ${clickedObject.userData.name}`);
            switchImage(clickedObject.userData.name);
            return; // Stop here to prevent other actions
        }

        // Handle different types of clickable objects
        if (clickedObject.userData.isZoomable && currentSection >= 1.5) {
            // Handle zoom action for section 3 objects
            handleZoomableObjectClick(clickedObject);
        } else if (clickedObject.userData.url) {
            // Handle URL action (for objects with URLs)
            window.open(clickedObject.userData.url, '_blank');
        } else if (clickedObject.userData.name && currentSection >= 0.5 && currentSection < 1.5) {
            // We're in section 2 and clicked on a named object (bowl, tea, etc.)
            // Instead of showing an image, show project description
            displayProjectDescription(clickedObject.userData.name);
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
    createSection3ImageLayer(-6, 'assets/images/section3/background.png', 0.2, 'background');
    createSection3ImageLayer(-2, 'assets/images/section3/bulletin_board.png', 0.2, 'bulletinboard');
    // createSection3ImageLayer(-1, 'assets/images/section3/desk_surface.png', 0.4, 'desk-surface');
    createSection3ImageLayer(1, 'assets/images/section3/desk.png', 0.6, 'desk');
    // // createSection3ImageLayer(-3, 'assets/images/section3/books.png', 0.7, 'books');
    //  createSection3ImageLayer(-2, 'assets/images/section3/tablet.png', 0.8, 'tablet');

    createSection3ZoomableObject(
        'assets/images/section3/sticky.png',
        { x: -3, y: 7.2, z: 0.1 },
        { width: 3, height: 2.5 },
        'instagram',
        {
            closeupPath: 'assets/images/section3/sticky.png',
            position: { x: 0, y: -window.innerHeight / 45 * 2, z: 0 },
            scale: 3,
            rotation: { x: 0, y: 0, z: 0 }
        }
    );

    // Add zoomable objects
    createSection3ZoomableObject(
        'assets/images/section3/insta.png',
        { x: 1, y: 4.8, z: 0 },
        { width: 2, height: 3.5 },
        'instagram',
        {
            closeupPath: 'assets/images/section3/insta.png',
            position: { x: 0, y: -window.innerHeight / 45 * 2, z: 0 },
            scale: 3,
            rotation: { x: 0, y: 0, z: 0 }
        }
    );

    createSection3ZoomableObject(
        'assets/images/section3/instanote.png',
        { x: 3, y: 5, z: 0 },
        { width: 2.5, height: 2.5 },
        'instanote',
        {
            closeupPath: 'assets/images/section3/instanote.png',
            position: { x: 0, y: -window.innerHeight / 45 * 2, z: 0 },
            scale: 3,
            rotation: { x: 0, y: 0, z: 0 }
        }
    );


    createSection3ZoomableObject(
        'assets/images/section3/characterdesign1.png',
        { x: -4, y: 5.5, z: 0 },
        { width: 3, height: 3.2 },
        'handsomePL1',
        {
            closeupPath: 'assets/images/section3/characterdesign1.png',
            position: { x: 0, y: -window.innerHeight / 45 * 2, z: 0 },
            scale: 3,
            rotation: { x: 0, y: 0, z: 0 }
        }
    );


    // Add zoomable objects
    createSection3ZoomableObject(
        'assets/images/section3/scolastic.png',
        { x: 1, y: 7.5, z: 0 },
        { width: 5.5, height: 2.1 },
        'instagram',
        {
            closeupPath: 'assets/images/section3/scolastic.png',
            position: { x: 0, y: -window.innerHeight / 45 * 2, z: 0 },
            scale: 3,
            rotation: { x: 0, y: 0, z: 0 }
        }
    );


    createSection3ZoomableObject(
        'assets/images/section3/characterdesign2.png',
        { x: -2, y: 4, z: 0 },
        { width: 3, height: 3.2 },
        'handsomePL2',
        {
            closeupPath: 'assets/images/section3/characterdesign2.png',
            position: { x: 0, y: -window.innerHeight / 45 * 2, z: 0 },
            scale: 3,
            rotation: { x: 0, y: 0, z: 0 }
        }
    );

    //enhanceSection3WithDrawableScreen(); // this is not working bro

}

// Call this in your section creation function
function enhanceSection3WithDrawableScreen() {
    createDrawableScreen();
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

// Update the processModelPanning function for WASD //no logner using wasd
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

    // // Pan up/down with WASD
    // const baseY = -window.innerHeight / 45 + 1;
    // if (keysPressed[panKeys.up]) {
    //     newY = Math.max(baseY + panLimits.minY, modelContainer.position.y - panAmount);
    // } else if (keysPressed[panKeys.down]) {
    //     newY = Math.min(baseY + panLimits.maxY, modelContainer.position.y + panAmount);
    // }

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
                const targetY = calculateFullscreenSize(-1.5).height * 0.2 - 2.8; //TODO fuckass
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
    //createSectionTwoText();
    createStaticText();
    createStaticText2();
    //   initializeAnimatedText();
    createSection2();
    createSection3();
    // enhanceSection3WithDrawableScreen()
    updateMouseClickHandler();



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