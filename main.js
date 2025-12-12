import * as THREE from 'https://cdn.skypack.dev/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.158.0/examples/jsm/controls/OrbitControls.js';

class ParticleSystem {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.particles = null;
        this.particleGeometry = null;
        this.particleMaterial = null;
        this.particleCount = 1000;
        this.currentModel = 'christmas';
        this.particleColor = 0x00d4ff;
        this.handDistance = 0.5;
        this.maxDistance = 0;

        this.init();
        this.createParticles();
        this.animate();
        this.setupUI();
    }

    init() {
        const container = document.getElementById('canvas-container');

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0c0c0c, 0.02);

        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 10);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;

        this.setupLighting();
        this.setupEventListeners();
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(0x00d4ff, 1, 100);
        pointLight1.position.set(10, 10, 10);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xff0066, 0.5, 100);
        pointLight2.position.set(-10, -10, 10);
        this.scene.add(pointLight2);
    }

    createParticles() {
        if (this.particles) {
            this.scene.remove(this.particles);
        }

        this.particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);
        const velocities = new Float32Array(this.particleCount * 3);
        const angles = new Float32Array(this.particleCount);

        const color = new THREE.Color(this.particleColor);

        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            this.generateParticlePosition(i3, positions);

            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;

            velocities[i3] = (Math.random() - 0.5) * 0.1;
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;

            angles[i] = Math.random() * Math.PI * 2;
        }

        this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        this.particleGeometry.setAttribute('angle', new THREE.BufferAttribute(angles, 1));

        this.particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
        this.scene.add(this.particles);

        document.getElementById('particleCount').textContent = this.particleCount;
    }

    generateParticlePosition(i3, positions) {
        switch (this.currentModel) {
            case 'christmas':
                this.generateChristmasTree(i3, positions);
                break;
            case 'star':
                this.generateStar(i3, positions);
                break;
            case 'fireworks':
                this.generateFireworks(i3, positions);
                break;
            case 'heart':
                this.generateHeart(i3, positions);
                break;
            case 'earth':
                this.generateEarth(i3, positions);
                break;
            case 'cube':
                this.generateCube(i3, positions);
                break;
            default:
                this.generateChristmasTree(i3, positions);
        }
    }

    generateChristmasTree(i3, positions) {
        const t = Math.random();
        const r = t * 3 * (1 - t);
        const theta = Math.random() * Math.PI * 2;
        const y = (t * 12 - 6) * 0.8;
        
        positions[i3] = r * Math.cos(theta);
        positions[i3 + 1] = y;
        positions[i3 + 2] = r * Math.sin(theta);

        if (Math.random() > 0.8 && t < 0.3) {
            positions[i3 + 1] += Math.random() * 2;
        }
    }

    generateStar(i3, positions) {
        const r = Math.random() * 4;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = r * Math.cos(phi);

        if (Math.random() > 0.7) {
            const variation = (Math.random() - 0.5) * 0.5;
            positions[i3] += variation;
            positions[i3 + 1] += variation;
            positions[i3 + 2] += variation;
        }
    }

    generateFireworks(i3, positions) {
        const explosionTime = Math.random();
        const speed = 5;
        const r = explosionTime * speed;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        positions[i3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = r * Math.cos(phi);
    }

    generateHeart(i3, positions) {
        const t = Math.random() * Math.PI * 2;
        const size = 3;
        
        const x = size * 16 * Math.pow(Math.sin(t), 3);
        const y = size * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        const z = (Math.random() - 0.5) * 2;
        
        positions[i3] = x * 0.1;
        positions[i3 + 1] = y * 0.1;
        positions[i3 + 2] = z;

        const variation = (Math.random() - 0.5) * 0.3;
        positions[i3] += variation;
        positions[i3 + 1] += variation;
    }

    generateEarth(i3, positions) {
        const r = 3 + Math.random() * 0.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = r * Math.cos(phi);

        const noise = (Math.random() - 0.5) * 0.2;
        positions[i3] += noise;
        positions[i3 + 1] += noise;
        positions[i3 + 2] += noise;
    }

    generateCube(i3, positions) {
        positions[i3] = (Math.random() - 0.5) * 6;
        positions[i3 + 1] = (Math.random() - 0.5) * 6;
        positions[i3 + 2] = (Math.random() - 0.5) * 6;
    }

    updateParticles() {
        if (!this.particles) return;

        const positions = this.particleGeometry.attributes.position.array;
        const velocities = this.particleGeometry.attributes.velocity.array;
        const angles = this.particleGeometry.attributes.angle.array;

        const scale = 0.5 + this.handDistance * 2;
        const spread = this.handDistance * 0.3;

        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;

            if (this.currentModel === 'fireworks') {
                positions[i3] += velocities[i3];
                positions[i3 + 1] += velocities[i3 + 1];
                positions[i3 + 2] += velocities[i3 + 2];
                
                velocities[i3 + 1] -= 0.01;

                if (positions[i3 + 1] < -5) {
                    this.generateFireworks(i3, positions);
                    velocities[i3] = (Math.random() - 0.5) * 0.5;
                    velocities[i3 + 1] = Math.random() * 0.5;
                    velocities[i3 + 2] = (Math.random() - 0.5) * 0.5;
                }
            } else {
                // 对于非烟花模型，添加轻微的随机运动
                positions[i3] += (Math.random() - 0.5) * 0.01;
                positions[i3 + 1] += (Math.random() - 0.5) * 0.01;
                positions[i3 + 2] += (Math.random() - 0.5) * 0.01;
            }

            angles[i] += 0.01;
        }

        this.particles.scale.set(scale, scale, scale);
        this.particleGeometry.attributes.position.needsUpdate = true;
        this.particles.rotation.y += 0.005;
    }

    setParticleColor(color) {
        this.particleColor = color;
        const threeColor = new THREE.Color(color);
        const colors = this.particleGeometry.attributes.color.array;
        
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            colors[i3] = threeColor.r;
            colors[i3 + 1] = threeColor.g;
            colors[i3 + 2] = threeColor.b;
        }
        
        this.particleGeometry.attributes.color.needsUpdate = true;
    }

    setModel(model) {
        this.currentModel = model;
        this.createParticles();
    }

    setHandDistance(distance) {
        this.handDistance = distance;
        if (distance > this.maxDistance) {
            this.maxDistance = distance;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.updateParticles();
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    setupUI() {
        document.querySelectorAll('.model-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.model-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setModel(btn.dataset.model);
            });
        });

        const colorPicker = document.getElementById('colorPicker');
        const colorValue = document.getElementById('colorValue');
        
        colorPicker.addEventListener('input', (e) => {
            this.setParticleColor(e.target.value);
            colorValue.textContent = e.target.value.toUpperCase();
        });
    }
}

class HandGestureController {
    constructor(particleSystem) {
        this.particleSystem = particleSystem;
        this.video = document.getElementById('video');
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.isCameraActive = false;
        this.maxContourArea = 0;
        // 不自动启动摄像头，改为用户手动点击
    }

    async setupCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' },
                audio: false
            });
            
            this.video.srcObject = stream;
            this.isCameraActive = true;
            this.detectHands();
            
            document.getElementById('toggleCamera').textContent = '📷 关闭摄像头';
        } catch (error) {
            console.error('无法访问摄像头:', error);
            alert('无法访问摄像头，请检查权限设置');
        }
    }

    toggleCamera() {
        if (this.isCameraActive) {
            this.video.srcObject.getTracks().forEach(track => track.stop());
            this.isCameraActive = false;
            document.getElementById('toggleCamera').textContent = '📷 开启摄像头';
            this.particleSystem.setHandDistance(0.5);
        } else {
            this.setupCamera();
        }
    }

    detectHands() {
        if (!this.isCameraActive) return;

        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const grayData = this.grayscale(imageData);
        const binaryData = this.threshold(grayData, 100);
        
        const contours = this.findContours(binaryData);
        const handContour = this.findLargestContour(contours);
        
        if (handContour && handContour.length > 10) {
            this.processHandContour(handContour);
        }

        requestAnimationFrame(() => this.detectHands());
    }

    grayscale(imageData) {
        const data = imageData.data;
        const grayData = new Uint8ClampedArray(imageData.width * imageData.height);
        
        for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            grayData[i / 4] = gray;
        }
        
        return { width: imageData.width, height: imageData.height, data: grayData };
    }

    threshold(imageData, thresholdValue) {
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i++) {
            data[i] = data[i] < thresholdValue ? 0 : 255;
        }
        
        return imageData;
    }

    findContours(imageData) {
        const contours = [];
        const visited = new Uint8Array(imageData.width * imageData.height);
        
        for (let y = 0; y < imageData.height; y++) {
            for (let x = 0; x < imageData.width; x++) {
                const idx = y * imageData.width + x;
                
                if (imageData.data[idx] === 255 && visited[idx] === 0) {
                    const contour = this.traceContour(x, y, imageData, visited);
                    contours.push(contour);
                }
            }
        }
        
        return contours;
    }

    traceContour(startX, startY, imageData, visited) {
        const contour = [];
        const stack = [{ x: startX, y: startY }];
        
        while (stack.length > 0) {
            const { x, y } = stack.pop();
            const idx = y * imageData.width + x;
            
            if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height ||
                imageData.data[idx] === 0 || visited[idx] === 1) {
                continue;
            }
            
            visited[idx] = 1;
            contour.push({ x, y });
            
            stack.push({ x: x + 1, y });
            stack.push({ x: x - 1, y });
            stack.push({ x, y: y + 1 });
            stack.push({ x, y: y - 1 });
        }
        
        return contour;
    }

    findLargestContour(contours) {
        let largestContour = null;
        let maxArea = 0;
        
        for (const contour of contours) {
            const area = this.calculateContourArea(contour);
            if (area > maxArea && area > 1000) {
                maxArea = area;
                largestContour = contour;
            }
        }
        
        return largestContour;
    }

    calculateContourArea(contour) {
        if (contour.length < 3) return 0;
        
        let area = 0;
        const n = contour.length;
        
        for (let i = 0; i < n; i++) {
            const p1 = contour[i];
            const p2 = contour[(i + 1) % n];
            area += p1.x * p2.y - p2.x * p1.y;
        }
        
        return Math.abs(area) / 2;
    }

    processHandContour(contour) {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        for (const point of contour) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }
        
        const width = maxX - minX;
        const height = maxY - minY;
        const aspectRatio = width / height;
        
        let distance = width / this.canvas.width;
        distance = Math.max(0.1, Math.min(1.0, distance));
        
        this.particleSystem.setHandDistance(distance);
    }
}

// 确保DOM加载完成后再初始化
window.addEventListener('DOMContentLoaded', () => {
    const particleSystem = new ParticleSystem();
    const gestureController = new HandGestureController(particleSystem);

    document.getElementById('toggleCamera').addEventListener('click', () => {
        gestureController.toggleCamera();
    });

    document.getElementById('toggleFullscreen').addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error('无法进入全屏:', err);
            });
        } else {
            document.exitFullscreen();
        }
    });

    document.addEventListener('fullscreenchange', () => {
        const btn = document.getElementById('toggleFullscreen');
        btn.textContent = document.fullscreenElement ? '🔲 退出全屏' : '🔲 全屏';
    });
});