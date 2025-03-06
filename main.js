// // Wait for DOM to load
// document.addEventListener('DOMContentLoaded', () => {
//     // Initialize components
//     const scrollManager = new ScrollManager();
//     const threeScene = new ThreeScene();
//     const handTracker = new HandTracker();

//     // Connect scroll manager to ThreeJS scene
//     scrollManager.addScrollCallback((scrollY) => {
//         threeScene.updateScroll(scrollY);
//     });

//     // Set up hand gesture callbacks
//     handTracker.setThumbsUpCallback(() => {
//         console.log('Thumbs up detected!');
//         // Scroll to next section on thumbs up
//         scrollManager.scrollToNextSection();
//     });

//     handTracker.setDefaultCallback(() => {
//         console.log('Default hand position');
//         // You can add additional default hand position logic here
//     });

//     // Add keyboard navigation for testing
//     document.addEventListener('keydown', (event) => {
//         if (event.key === 'ArrowDown') {
//             scrollManager.scrollToNextSection();
//         } else if (event.key === 'ArrowUp') {
//             scrollManager.scrollToPrevSection();
//         }
//     });

//     // Log initialization
//     console.log('Website initialized!');
// });