// hand-gestures.js - MediaPipe Hands logic with consent system

// Create a global gesture event dispatcher
window.gestureEvents = {
    dispatch: function (eventName, eventData) {
        // Create and dispatch a custom event
        const event = new CustomEvent(eventName, { detail: eventData });
        window.dispatchEvent(event);
        console.log(`Gesture event dispatched: ${eventName}`, eventData);
    }
};

// Gesture state
const gestureState = {
    thumbsUpDetected: false,
    thumbsDownDetected: false,
    isPointingUp: false,
    isPointingDown: false,
    lastGestureTime: 0,
    gestureCooldown: false,
    gestureDelay: 300 // Milliseconds to prevent accidental gesture triggers
};

// Initialize MediaPipe Hands
function initHandTracking() {
    // Create video element for camera feed
    const videoElement = document.createElement('video');
    videoElement.style.display = 'none';
    document.body.appendChild(videoElement);

    // Create canvas for debugging (optional)
    const canvasElement = document.createElement('canvas');
    canvasElement.style.position = 'fixed';
    canvasElement.style.top = '0';
    canvasElement.style.left = '0';
    canvasElement.style.zIndex = '200';
    canvasElement.style.width = '240px';
    canvasElement.style.height = '180px';
    canvasElement.style.transform = 'scaleX(-1)'; // Mirror the display
    document.body.appendChild(canvasElement);

    const canvasCtx = canvasElement.getContext('2d');

    // Initialize hands model
    const hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    hands.onResults(results => {
        // Draw hand landmarks for debugging
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            for (const landmarks of results.multiHandLandmarks) {
                drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
                drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1 });

                // Process gestures if not in cooldown
                if (!gestureState.gestureCooldown) {
                    detectThumbsUp(landmarks);
                    detectThumbsDown(landmarks);
                    detectPointingGestures(landmarks);
                }
            }
        } else {
            // No hands detected - reset all gesture states
            if (gestureState.thumbsUpDetected) {
                gestureState.thumbsUpDetected = false;
                window.gestureEvents.dispatch('thumbsUp', { active: false });
            }

            if (gestureState.thumbsDownDetected) {
                gestureState.thumbsDownDetected = false;
                window.gestureEvents.dispatch('thumbsDown', { active: false });
            }

            if (gestureState.isPointingUp) {
                gestureState.isPointingUp = false;
                window.gestureEvents.dispatch('pointingUp', { active: false });
            }

            if (gestureState.isPointingDown) {
                gestureState.isPointingDown = false;
                window.gestureEvents.dispatch('pointingDown', { active: false });
            }
        }

        canvasCtx.restore();
    });

    // Start camera
    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({ image: videoElement });
        },
        width: 640,
        height: 480
    });
    camera.start();
}

// Function to detect thumbs up gesture
function detectThumbsUp(landmarks) {
    // Get thumb tip and base positions
    const thumbTip = landmarks[4];
    const thumbBase = landmarks[2];

    // Get index finger positions for reference
    const indexFingerTip = landmarks[8];
    const indexFingerBase = landmarks[5];

    // Get middle finger positions for reference
    const middleFingerBase = landmarks[9];

    // Check if thumb is pointing up
    const thumbPointingUp = thumbTip.y < thumbBase.y - 0.1;

    // Check if other fingers are curled
    const indexFingerCurled = indexFingerTip.y > indexFingerBase.y - 0.05;
    const middleFingerNearBase = landmarks[12].y > middleFingerBase.y - 0.05;
    const ringFingerNearBase = landmarks[16].y > landmarks[13].y - 0.05;
    const pinkyNearBase = landmarks[20].y > landmarks[17].y - 0.05;

    // Determine if showing thumbs up
    const isThumbsUp = thumbPointingUp &&
        indexFingerCurled &&
        middleFingerNearBase &&
        ringFingerNearBase &&
        pinkyNearBase;

    // If thumbs up detected for the first time, emit event
    if (isThumbsUp && !gestureState.thumbsUpDetected) {
        gestureState.thumbsUpDetected = true;

        // Dispatch thumbs up event
        window.gestureEvents.dispatch('thumbsUp', { active: true });

        // Set cooldown
        setCooldown();
    }
}

// Function to detect thumbs down gesture
function detectThumbsDown(landmarks) {
    // Get thumb tip and base positions
    const thumbTip = landmarks[4];
    const thumbBase = landmarks[2];

    // Get index finger positions for reference
    const indexFingerTip = landmarks[8];
    const indexFingerBase = landmarks[5];

    // Get middle finger positions for reference
    const middleFingerBase = landmarks[9];

    // Check if thumb is pointing down
    const thumbPointingDown = thumbTip.y > thumbBase.y + 0.1;

    // Check if other fingers are curled
    const indexFingerCurled = indexFingerTip.y > indexFingerBase.y - 0.05;
    const middleFingerNearBase = landmarks[12].y > middleFingerBase.y - 0.05;
    const ringFingerNearBase = landmarks[16].y > landmarks[13].y - 0.05;
    const pinkyNearBase = landmarks[20].y > landmarks[17].y - 0.05;

    // Determine if showing thumbs down
    const isThumbsDown = thumbPointingDown &&
        indexFingerCurled &&
        middleFingerNearBase &&
        ringFingerNearBase &&
        pinkyNearBase;

    // If thumbs down detected for the first time, emit event
    if (isThumbsDown && !gestureState.thumbsDownDetected) {
        gestureState.thumbsDownDetected = true;

        // Dispatch thumbs down event
        window.gestureEvents.dispatch('thumbsDown', { active: true });

        // Set cooldown
        setCooldown();
    }
}

// Function to detect pointing gestures
function detectPointingGestures(landmarks) {
    // Get index finger tip and PIP joint
    const indexFingerTip = landmarks[8];
    const indexFingerPIP = landmarks[6];

    // Get wrist and middle finger base for reference
    const wrist = landmarks[0];
    const middleFingerBase = landmarks[9];

    // Check if index finger is extended straight
    const indexFingerExtended = indexFingerTip.y < indexFingerPIP.y - 0.1;

    // Check if other fingers are curled
    const middleFingerCurled = landmarks[12].y > middleFingerBase.y - 0.05;
    const ringFingerCurled = landmarks[16].y > landmarks[13].y - 0.05;
    const pinkyFingerCurled = landmarks[20].y > landmarks[17].y - 0.05;
    const thumbCurled = landmarks[4].x > landmarks[2].x - 0.05;

    // Check finger orientation
    const fingerPointingVertical = Math.abs(indexFingerTip.x - wrist.x) < 0.1;

    // Determine if pointing up
    const isPointingUp = indexFingerExtended &&
        middleFingerCurled &&
        ringFingerCurled &&
        pinkyFingerCurled &&
        thumbCurled &&
        fingerPointingVertical &&
        indexFingerTip.y < wrist.y - 0.25;

    // Determine if pointing down
    const isPointingDown = indexFingerExtended &&
        middleFingerCurled &&
        ringFingerCurled &&
        pinkyFingerCurled &&
        thumbCurled &&
        fingerPointingVertical &&
        indexFingerTip.y > wrist.y + 0.1;

    // Update pointing up state
    if (isPointingUp !== gestureState.isPointingUp) {
        gestureState.isPointingUp = isPointingUp;
        window.gestureEvents.dispatch('pointingUp', { active: isPointingUp });
    }

    // Update pointing down state
    if (isPointingDown !== gestureState.isPointingDown) {
        gestureState.isPointingDown = isPointingDown;
        window.gestureEvents.dispatch('pointingDown', { active: isPointingDown });
    }
}

// Function to set gesture cooldown
function setCooldown() {
    gestureState.gestureCooldown = true;
    setTimeout(() => {
        gestureState.gestureCooldown = false;
    }, 1000); // 1-second cooldown
}

// Function to show permission dialog
function showPermissionDialog() {
    // Create permission dialog
    const dialog = document.createElement('div');
    dialog.className = 'permission-dialog';
    dialog.innerHTML = `
        <div class="permission-content">
            <h2>Enable Hand Gestures?</h2>
            <p>This website can respond to your hand gestures for a more interactive experience.</p>
            <p>We'll need access to your webcam to track hand movements.</p>
            <div class="permission-buttons">
                <button id="enable-gestures">Enable Gestures</button>
                <button id="skip-gestures">No Thanks</button>
            </div>
        </div>
    `;

    // Add styles for the dialog
    // Update the CSS for the permission dialog in hand-gestures.js
    // Find this section in the showPermissionDialog() function:

    const style = document.createElement('style');
    style.textContent = `
    .permission-dialog {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    .permission-content {
        background-color: white;
        padding: 2rem;
        border-radius: 8px;
        max-width: 500px;
        text-align: center;
        color: #333; /* Add this line to ensure text is dark */
    }
    .permission-content h2 {
        color: #222; /* Darker text for headings */
        margin-bottom: 1rem;
    }
    .permission-content p {
        color: #444; /* Dark text for paragraphs */
        margin-bottom: 0.8rem;
    }
    .permission-buttons {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-top: 1.5rem;
    }
    .permission-buttons button {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.2s;
    }
    #enable-gestures {
        background-color: #4285f4;
        color: white;
    }
    #enable-gestures:hover {
        background-color: #3367d6;
    }
    #skip-gestures {
        background-color: #f1f1f1;
        color: #333; /* Make sure this is dark enough */
    }
    #skip-gestures:hover {
        background-color: #ddd;
    }
`;

    document.head.appendChild(style);
    document.body.appendChild(dialog);

    // Add event listeners
    document.getElementById('enable-gestures').addEventListener('click', () => {
        dialog.remove();
        initHandTracking();
    });

    document.getElementById('skip-gestures').addEventListener('click', () => {
        dialog.remove();
        // Optionally show a message about how to enable later
        showGestureToggle();
    });
}

// Function to show a small toggle button for later enabling
function showGestureToggle() {
    const toggle = document.createElement('div');
    toggle.className = 'gesture-toggle';
    toggle.innerHTML = `
        <button id="toggle-gestures">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 18V12a7 7 0 0 1 14 0v6"></path>
                <path d="M4 12a7 7 0 0 1 14 0"></path>
                <path d="M4 6a7 7 0 0 1 14 0"></path>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
            Enable Hand Gestures
        </button> //FIX THIS SVG
    `;

    // Add styles for the toggle
    const style = document.createElement('style');
    style.textContent = `
        .gesture-toggle {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 100;
        }
        .gesture-toggle button {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 15px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            border: none;
            border-radius: 30px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
        }
        .gesture-toggle button:hover {
            background-color: rgba(0, 0, 0, 0.9);
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(toggle);

    // Add event listener
    document.getElementById('toggle-gestures').addEventListener('click', () => {
        toggle.remove();
        showPermissionDialog();
    });
}

// Function to initialize the prompt system
function initGesturePrompt() {
    // Check if we should skip the automatic prompt
    if (window.skipAutomaticPrompt) {
        return;
    }

    // Wait a bit before showing the prompt (let the site load first)
    setTimeout(() => {
        showPermissionDialog();
    }, 5000); // Show after some time bruh
}

// Initialize the prompt system when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    initGesturePrompt();
});

// Make these functions globally available
window.requestHandGestures = showPermissionDialog;