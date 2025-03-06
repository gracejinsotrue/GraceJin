// class HandTracker {
//     constructor() {
//         this.videoElement = document.getElementById('hand-video');
//         this.canvasElement = document.getElementById('hand-canvas');
//         this.canvasCtx = this.canvasElement.getContext('2d');
//         this.thumbsUpElement = document.getElementById('thumbs-up-animation');

//         this.hands = null;
//         this.camera = null;
//         this.lastGesture = null;
//         this.gestureTimeout = null;

//         // Callbacks
//         this.onThumbsUpCallback = null;
//         this.onDefaultCallback = null;

//         this.init();
//     }

//     init() {
//         // Initialize MediaPipe Hands
//         this.hands = new Hands({
//             locateFile: (file) => {
//                 return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
//             }
//         });

//         // Set hands options
//         this.hands.setOptions({
//             maxNumHands: 1,
//             modelComplexity: 1,
//             minDetectionConfidence: 0.5,
//             minTrackingConfidence: 0.5
//         });

//         // Set callback for hand detection results
//         this.hands.onResults(this.onResults.bind(this));

//         // Initialize camera
//         this.camera = new Camera(this.videoElement, {
//             onFrame: async () => {
//                 await this.hands.send({ image: this.videoElement });
//             },
//             width: 640,
//             height: 480
//         });

//         // Start camera
//         this.camera.start();
//     }

//     onResults(results) {
//         // Clear canvas
//         this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
//         this.canvasCtx.save();

//         // Draw hand landmarks
//         if (results.multiHandLandmarks) {
//             for (const landmarks of results.multiHandLandmarks) {
//                 // Draw landmarks
//                 drawConnectors(this.canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 3 });
//                 drawLandmarks(this.canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1 });

//                 // Detect gestures
//                 this.detectGestures(landmarks);
//             }
//         } else {
//             // No hands detected
//             if (this.lastGesture !== 'none') {
//                 this.lastGesture = 'none';
//                 if (this.onDefaultCallback) {
//                     this.onDefaultCallback();
//                 }
//                 this.hideThumbsUp();
//             }
//         }

//         this.canvasCtx.restore();
//     }

//     detectGestures(landmarks) {
//         // Detect thumbs up gesture
//         // Thumb is pointing up when the tip (landmark 4) is significantly higher than the base (landmark 2)
//         const thumbTip = landmarks[4];
//         const thumbBase = landmarks[2];
//         const thumbIsUp = thumbTip.y < thumbBase.y - 0.1;

//         // Index finger is curled when the tip (landmark 8) is close to the base (landmark 5)
//         const indexTip = landmarks[8];
//         const indexBase = landmarks[5];
//         const indexIsCurled = this.calculateDistance(indexTip, indexBase) < 0.1;

//         // Middle finger is curled when the tip (landmark 12) is close to the base (landmark 9)
//         const middleTip = landmarks[12];
//         const middleBase = landmarks[9];
//         const middleIsCurled = this.calculateDistance(middleTip, middleBase) < 0.1;

//         // Ring finger is curled when the tip (landmark 16) is close to the base (landmark 13)
//         const ringTip = landmarks[16];
//         const ringBase = landmarks[13];
//         const ringIsCurled = this.calculateDistance(ringTip, ringBase) < 0.1;

//         // Pinky is curled when the tip (landmark 20) is close to the base (landmark 17)
//         const pinkyTip = landmarks[20];
//         const pinkyBase = landmarks[17];
//         const pinkyIsCurled = this.calculateDistance(pinkyTip, pinkyBase) < 0.1;

//         // Thumbs up is when thumb is up and all other fingers are curled
//         if (thumbIsUp && indexIsCurled && middleIsCurled && ringIsCurled && pinkyIsCurled) {
//             if (this.lastGesture !== 'thumbsUp') {
//                 this.lastGesture = 'thumbsUp';
//                 if (this.onThumbsUpCallback) {
//                     this.onThumbsUpCallback();
//                 }
//                 this.showThumbsUp();
//             }
//         } else {
//             if (this.lastGesture !== 'default') {
//                 this.lastGesture = 'default';
//                 if (this.onDefaultCallback) {
//                     this.onDefaultCallback();
//                 }
//                 this.hideThumbsUp();
//             }
//         }
//     }

//     calculateDistance(a, b) {
//         return Math.sqrt(
//             Math.pow(a.x - b.x, 2) +
//             Math.pow(a.y - b.y, 2) +
//             Math.pow(a.z - b.z, 2)
//         );
//     }

//     showThumbsUp() {
//         // Clear previous timeout
//         if (this.gestureTimeout) {
//             clearTimeout(this.gestureTimeout);
//         }

//         // Show thumbs up animation
//         this.thumbsUpElement.classList.remove('hidden');
//         this.thumbsUpElement.classList.add('visible');

//         // Hide after 2 seconds
//         this.gestureTimeout = setTimeout(() => {
//             this.hideThumbsUp();
//         }, 2000);
//     }

//     hideThumbsUp() {
//         this.thumbsUpElement.classList.remove('visible');
//         this.thumbsUpElement.classList.add('hidden');
//     }

//     setThumbsUpCallback(callback) {
//         this.onThumbsUpCallback = callback;
//     }

//     setDefaultCallback(callback) {
//         this.onDefaultCallback = callback;
//     }
// }

// // Don't initialize here, will be done in main.js