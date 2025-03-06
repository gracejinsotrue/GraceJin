// class ThreeScene {
//     constructor() {
//         this.container = document.getElementById('threejs-container');
//         this.scene = new THREE.Scene();
//         this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
//         this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

//         this.scrollY = 0;
//         this.objects = [];

//         this.init();
//     }

//     init() {
//         // Setup renderer
//         this.renderer.setSize(window.innerWidth, window.innerHeight);
//         this.renderer.setPixelRatio(window.devicePixelRatio);
//         this.container.appendChild(this.renderer.domElement);

//         // Setup camera
//         this.camera.position.z = 5;

//         // Add lights
//         const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
//         this.scene.add(ambientLight);

//         const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
//         directionalLight.position.set(1, 1, 1);
//         this.scene.add(directionalLight);

//         // Create parallax objects
//         this.createParallaxObjects();

//         // Add event listeners
//         window.addEventListener('resize', this.onWindowResize.bind(this));

//         // Start animation loop
//         this.animate();
//     }

//     createParallaxObjects() {
//         // Create background particles
//         const particleGeometry = new THREE.BufferGeometry();
//         const particleCount = 1000;

//         const positions = new Float32Array(particleCount * 3);
//         const colors = new Float32Array(particleCount * 3);

//         for (let i = 0; i < particleCount; i++) {
//             const i3 = i * 3;

//             // Position
//             positions[i3] = (Math.random() - 0.5) * 10;
//             positions[i3 + 1] = (Math.random() - 0.5) * 10;
//             positions[i3 + 2] = (Math.random() - 0.5) * 10;

//             // Color
//             colors[i3] = Math.random();
//             colors[i3 + 1] = Math.random();
//             colors[i3 + 2] = Math.random();
//         }

//         particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
//         particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

//         const particleMaterial = new THREE.PointsMaterial({
//             size: 0.05,
//             vertexColors: true,
//             transparent: true,
//             opacity: 0.8
//         });

//         const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
//         this.scene.add(particleSystem);
//         this.objects.push({
//             object: particleSystem,
//             parallaxFactor: 0.5
//         });

//         // Create floating geometric shapes
//         const shapes = [];
//         const geometries = [
//             new THREE.IcosahedronGeometry(1, 0),
//             new THREE.BoxGeometry(1, 1, 1),
//             new THREE.TorusGeometry(0.7, 0.3, 16, 32)
//         ];

//         for (let i = 0; i < 10; i++) {
//             const geometry = geometries[Math.floor(Math.random() * geometries.length)];
//             const material = new THREE.MeshStandardMaterial({
//                 color: Math.random() * 0xffffff,
//                 roughness: 0.5,
//                 metalness: 0.1,
//                 transparent: true,
//                 opacity: 0.9
//             });

//             const mesh = new THREE.Mesh(geometry, material);

//             // Random position
//             mesh.position.x = (Math.random() - 0.5) * 8;
//             mesh.position.y = (Math.random() - 0.5) * 8;
//             mesh.position.z = (Math.random() - 0.5) * 5;

//             // Random rotation
//             mesh.rotation.x = Math.random() * Math.PI;
//             mesh.rotation.y = Math.random() * Math.PI;

//             // Random scale
//             const scale = 0.2 + Math.random() * 0.3;
//             mesh.scale.set(scale, scale, scale);

//             this.scene.add(mesh);

//             shapes.push({
//                 object: mesh,
//                 parallaxFactor: 0.2 + Math.random() * 0.8,
//                 rotationSpeed: {
//                     x: (Math.random() - 0.5) * 0.01,
//                     y: (Math.random() - 0.5) * 0.01,
//                     z: (Math.random() - 0.5) * 0.01
//                 }
//             });
//         }

//         this.objects = [...this.objects, ...shapes];
//     }

//     updateParallax() {
//         const scrollFactor = this.scrollY / window.innerHeight;

//         this.objects.forEach(item => {
//             const { object, parallaxFactor, rotationSpeed } = item;

//             // Apply parallax effect based on scroll
//             if (object.type === 'Points') {
//                 object.rotation.y = scrollFactor * 0.2;
//             } else {
//                 // Update position based on scroll
//                 object.position.y = object.position.y + (scrollFactor * parallaxFactor * 0.1 - object.position.y) * 0.1;

//                 // Apply rotation if available
//                 if (rotationSpeed) {
//                     object.rotation.x += rotationSpeed.x;
//                     object.rotation.y += rotationSpeed.y;
//                     object.rotation.z += rotationSpeed.z;
//                 }
//             }
//         });
//     }

//     onWindowResize() {
//         this.camera.aspect = window.innerWidth / window.innerHeight;
//         this.camera.updateProjectionMatrix();
//         this.renderer.setSize(window.innerWidth, window.innerHeight);
//     }

//     updateScroll(scrollY) {
//         this.scrollY = scrollY;
//         this.updateParallax();
//     }

//     animate() {
//         requestAnimationFrame(this.animate.bind(this));

//         // Update scene
//         this.updateParallax();

//         // Render scene
//         this.renderer.render(this.scene, this.camera);
//     }
// }

// // Don't initialize here, will be done in main.js