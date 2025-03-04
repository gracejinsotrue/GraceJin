// three-scene.js - Three.js scene and animation logic

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
document.getElementById('container').appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(0, 1, 1);
scene.add(directionalLight);

// Arrays to store our objects
const parallaxLayers = [];

// Normal, thumbs up, and thumbs down animation planes
let normalAnimationPlane = null;
let thumbsUpAnimationPlane = null;
let thumbsDownAnimationPlane = null;

// Animation state
const animationState = {
    introComplete: false,
    introProgress: 0,
    introSpeed: 0.02,
    introDelay: 0.2,
    layersLoaded: 0,
    totalLayers: 5
};

// Frame animation state
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


// Add this to your existing animation state object
const shelfAnimation = {
    frames: [],
    frameIndex: 0,
    totalFrames: 4,  // Change this based on how many frames you have
    fps: 8,          // Frames per second
    lastFrameTime: 0,
    framesLoaded: false
};


// Function to preload grocery shelf animation frames
function preloadShelfFrames() {
    const textureLoader = new THREE.TextureLoader();
    let loadedFrames = 0;

    // Load shelf animation frames
    for (let i = 1; i <= shelfAnimation.totalFrames; i++) {
        const framePath = `assets/images/groceryshelf_frame${i}.png`;
        textureLoader.load(framePath, (texture) => {
            shelfAnimation.frames[i - 1] = texture;
            loadedFrames++;

            if (loadedFrames >= shelfAnimation.totalFrames) {
                console.log("All shelf animation frames loaded");
                shelfAnimation.framesLoaded = true;

                // Find and update the grocery shelf layer with the first frame
                parallaxLayers.forEach(layer => {
                    if (layer.userData.name === 'groceryshelf') {
                        layer.material.map = shelfAnimation.frames[0];
                        layer.material.needsUpdate = true;
                        layer.userData.isAnimated = true;
                    }
                });
            }
        }, undefined, (err) => {
            console.error(`Error loading ${framePath}:`, err);
            loadedFrames++;
        });
    }
}

const clickableObjects = [];


// Function to create a clickable object
function createClickableObject(imagePath, position, size, url, name = '') {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imagePath, (texture) => {
        const geometry = new THREE.PlaneGeometry(size.width, size.height);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });

        const plane = new THREE.Mesh(geometry, material);
        plane.position.set(position.x, position.y, position.z);

        // Store metadata
        plane.userData = {
            isClickable: true,
            url: url,
            name: name,
            originalScale: new THREE.Vector3(1, 1, 1),
            hoverScale: new THREE.Vector3(1.1, 1.1, 1.1), // 10% larger on hover
            isHovered: false
        };

        scene.add(plane);
        clickableObjects.push(plane);

        console.log(`Created clickable object: ${name}`);
    });
}


// Function to create a parallax clickable object
function createParallaxClickable(imagePath, position, size, parallaxSpeed, url, name = '', initialOffset = 5) {
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
            // Parallax properties
            parallaxSpeed: parallaxSpeed,
            initialOffset: initialOffset,
            initialDelay: animationState.layersLoaded * animationState.introDelay,
            originY: position.y, // Store original Y position for parallax scrolling

            // Clickable properties
            isClickable: true,
            url: url,
            name: name,
            originalScale: new THREE.Vector3(1, 1, 1),
            hoverScale: new THREE.Vector3(1.1, 1.1, 1.1), // 10% larger on hover
            isHovered: false
        };

        scene.add(plane);
        clickableObjects.push(plane);

        // Also add to parallaxLayers to participate in intro animations and parallax scrolling
        parallaxLayers.push(plane);

        animationState.layersLoaded++;

        console.log(`Created parallax clickable object: ${name}`);
    });
}



// Set up raycaster for mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Track mouse movements
function onMouseMove(event) {
    // Calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(clickableObjects);

    // Reset all objects to original scale
    clickableObjects.forEach(obj => {
        if (obj.userData.isHovered) {
            obj.scale.copy(obj.userData.originalScale);
            obj.userData.isHovered = false;
            document.body.style.cursor = 'default';
        }
    });

    // Scale up hovered object
    if (intersects.length > 0) {
        const hoveredObject = intersects[0].object;
        hoveredObject.scale.copy(hoveredObject.userData.hoverScale);
        hoveredObject.userData.isHovered = true;
        document.body.style.cursor = 'pointer';
    }
}

// Handle mouse clicks
function onMouseClick(event) {
    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(clickableObjects);

    // Open URL if a clickable object is clicked
    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        if (clickedObject.userData.url) {
            window.open(clickedObject.userData.url, '_blank');
            console.log(`Clicked on ${clickedObject.userData.name}, opening ${clickedObject.userData.url}`);
        }
    }
}

// Add event listeners
window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('click', onMouseClick, false);


// Variables for scroll interaction
let currentSection = 0;
let targetSection = 0;
let scrollY = 0;
let scrollingEnabled = false;
let groceryFrontLayer = null;

// Calculate the size needed to cover the viewport
function calculateFullscreenSize(distanceFromCamera) {
    const fov = camera.fov * (Math.PI / 180);
    const visibleHeight = 2 * Math.tan(fov / 2) * Math.abs(distanceFromCamera - camera.position.z);
    const visibleWidth = visibleHeight * camera.aspect;
    return {
        width: visibleWidth * 1.1,
        height: visibleHeight * 1.1
    };
}

// Function to create image layers that fill the screen
function createImageLayer(zPosition, imagePath, speed, initialOffset = 5, name = '') {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imagePath, (texture) => {
        const size = calculateFullscreenSize(zPosition);

        const geometry = new THREE.PlaneGeometry(size.width, size.height);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });

        const plane = new THREE.Mesh(geometry, material);
        plane.position.z = zPosition;

        // Set initial position for intro animation
        plane.position.y = initialOffset;

        // Store metadata
        plane.userData = {
            name: name,
            parallaxSpeed: speed,
            targetY: 0,
            initialOffset: initialOffset,
            initialDelay: animationState.layersLoaded * animationState.introDelay,
            originalScale: plane.scale.clone(),
            isAnimated: name == "groceryshelf"
        };

        scene.add(plane);
        parallaxLayers.push(plane);

        // Check if this is the groceryfront layer
        if (name === 'groceryfront') {
            groceryFrontLayer = plane;
            setupPartialVisibility(groceryFrontLayer, 0.4);
        }

        animationState.layersLoaded++;

        window.addEventListener('resize', () => {
            const newSize = calculateFullscreenSize(zPosition);
            plane.geometry.dispose();
            plane.geometry = new THREE.PlaneGeometry(newSize.width, newSize.height);
        });
    });
}

// Function to set up partial visibility for groceryfront layer
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

// Function to update the clip plane based on scroll position
function updateClipPlane(plane, scrollPosition) {
    if (!plane || !plane.userData.clipPlane) return;

    const clipOffset = plane.userData.fullHeight * (0.5 - plane.userData.visiblePortion / 2);
    const revealAmount = scrollPosition * clipOffset;

    plane.userData.clipPlane.constant = clipOffset - revealAmount;
}

// Function to preload animation frames
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

    // Check if all frames have loaded
    function checkAllFramesLoaded() {
        if (loadedFrames >= totalFramesToLoad) {
            console.log("All animation frames loaded");
            frameAnimation.framesLoaded = true;

            // Create animation planes once all frames are loaded
            createAnimationPlanes();
        }
    }
}

// Function to create separate animation planes
function createAnimationPlanes() {
    // Position this in front of other elements
    const zPosition = -2.5;


    // Calculate appropriate size
    const fullSize = calculateFullscreenSize(zPosition);
    const size = {
        width: fullSize.width * 0.25,   // 25% of screen width
        height: fullSize.height * 0.6    // 60% of screen height
    };

    // Create position vector to reuse
    const position = new THREE.Vector3(size.width * 0.9, -size.height * 0.3, zPosition);

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
        normalAnimationPlane.visible = true; // Start with normal visible
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
        thumbsUpAnimationPlane.visible = false; // Start hidden

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
        thumbsDownAnimationPlane.visible = false; // Start hidden

        scene.add(thumbsDownAnimationPlane);
    }

    // Set up resize handlers for all planes
    window.addEventListener('resize', () => {
        const newFullSize = calculateFullscreenSize(zPosition);
        const newSize = {
            width: newFullSize.width * 0.25,
            height: newFullSize.height * 0.6
        };

        const newPosition = new THREE.Vector3(size.width * 0.9, -size.height * 0.3, zPosition);

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

// Function to update animation frames
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

        // Update grocery shelf animation if loaded
        if (shelfAnimation.framesLoaded) {
            // Check if enough time has passed for shelf animation
            const shelfElapsed = timestamp - shelfAnimation.lastFrameTime;
            const shelfFrameDuration = 1000 / shelfAnimation.fps;

            if (shelfElapsed >= shelfFrameDuration) {
                shelfAnimation.lastFrameTime = timestamp;
                shelfAnimation.frameIndex = (shelfAnimation.frameIndex + 1) % shelfAnimation.frames.length;

                // Find and update the grocery shelf layer
                parallaxLayers.forEach(layer => {
                    if (layer.userData.isAnimated && layer.userData.name === 'groceryshelf') {
                        layer.material.map = shelfAnimation.frames[shelfAnimation.frameIndex];
                        layer.material.needsUpdate = true;
                    }
                });
            }
        }
    }
}

// Function to process gesture-based scrolling
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

// Function to trigger thumbs up animation effects
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

// Function to trigger thumbs down animation effects
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

// Create layers with appropriate z-positions and parallax speeds
function createScene() {
    createImageLayer(-6, 'assets/images/groceryfloor.png', 0.2, 8, 'groceryfloor');
    createImageLayer(-5, 'assets/images/groceryshelf.png', 0.4, 6, 'groceryshelf');
    createImageLayer(-4, 'assets/images/groceryshelf2.png', 0.6, 4, 'groceryshelf2');
    createImageLayer(-3, 'assets/images/groceryorang.png', 0.8, 2, 'groceryorang');
    createImageLayer(-2, 'assets/images/groceryfront.png', 1.0, 1, 'groceryfront');


    // Add clickable objects
    createParallaxClickable(
        'assets/images/hmmbottle.png',
        { x: -7.7, y: -1.3, z: -3 },
        { width: 3, height: 3 },
        0.2,
        'https://youtu.be/dQw4w9WgXcQ',
        "???",
        2
    );

    // Set up camera
    camera.position.z = 5;

    // Enable scrolling after intro animation completes
    setTimeout(() => {
        scrollingEnabled = true;
    }, 3000);

    // Preload animation frames
    preloadAnimationFrames();
    preloadShelfFrames(); // Add this line to preload the shelf frames
}

// Handle scrolling
window.addEventListener('wheel', (event) => {
    if (!scrollingEnabled) return;

    scrollY += event.deltaY * 0.001;
    scrollY = Math.max(0, Math.min(scrollY, 2));
    targetSection = Math.round(scrollY);

    document.querySelectorAll('.dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === targetSection);
    });
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
    });
});

// Animation loop
function animate(timestamp) {
    requestAnimationFrame(animate);

    // Update animation frames
    updateAnimationFrame(timestamp);

    // Handle intro animation
    if (!animationState.introComplete) {
        animationState.introProgress += animationState.introSpeed;

        if (animationState.introProgress >= 1) {
            animationState.introComplete = true;
        }

        // Animate each layer falling into place with easing and delay
        parallaxLayers.forEach(layer => {
            // Only start animating after the layer's delay has passed
            const layerProgress = Math.max(0, animationState.introProgress - layer.userData.initialDelay);

            if (layerProgress > 0) {
                // Easing function: ease-out cubic
                const easedProgress = 1 - Math.pow(1 - Math.min(1, layerProgress / (1 - layer.userData.initialDelay)), 3);
                // Move from initial offset position to target position
                // For clickable objects this works differently
                if (layer.userData.isClickable) {
                    // For clickable objects, we move from initial Y + offset to initial Y
                    layer.position.y = layer.userData.originY + (layer.userData.initialOffset * (1 - easedProgress));
                } else {
                    // For regular layers, use the standard animation
                    layer.position.y = layer.userData.initialOffset * (1 - easedProgress);
                }
            }
        });

        // Animate normal animation
        // Animate normal animation plane intro
        if (normalAnimationPlane || thumbsUpAnimationPlane || thumbsDownAnimationPlane) {
            const planeProgress = Math.max(0, animationState.introProgress - 0.8); // Delay appearance

            if (planeProgress > 0) {
                // Elastic easing for bouncy effect
                const t = Math.min(1, planeProgress / 0.2); // Complete over 20% of total time
                const easedProgress = t === 0 ? 0 : t === 1 ? 1 :
                    Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;

                const targetY = -calculateFullscreenSize(-1.5).height * 0.1; // Final position
                normalAnimationPlane.position.y = targetY - 5 * (1 - easedProgress);
                thumbsDownAnimationPlane.position.y = targetY - 5 * (1 - easedProgress);
                thumbsUpAnimationPlane.position.y = targetY - 5 * (1 - easedProgress);
            }
        }
    } else {
        // Regular parallax scrolling effect once intro is complete
        currentSection += (targetSection - currentSection) * 0.05;
        camera.position.y = -currentSection * 10;

        parallaxLayers.forEach(layer => {
            if (layer.userData.isClickable) {
                // For clickable objects, move them relative to their original position
                layer.position.y = layer.userData.originY + (currentSection * 10 * layer.userData.parallaxSpeed);
            } else {
                // For regular layers, use the standard parallax
                layer.position.y = currentSection * 10 * layer.userData.parallaxSpeed;
            }
        });

        // Update groceryfront clipping plane
        if (groceryFrontLayer) {
            const normalizedScroll = scrollY / 2; // Normalize to 0-1 range
            updateClipPlane(groceryFrontLayer, normalizedScroll);
        }
    }

    // Add smooth hover transitions for clickable objects
    clickableObjects.forEach(obj => {
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

// Initialize the scene when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    createScene();
    animate();
});