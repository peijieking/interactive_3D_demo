import * as THREE from 'three';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

// 全局变量
let scene, camera, renderer, particles, particleSystem;
let currentModel = 'christmas';
let particleColor = new THREE.Color(0xff6b6b);
let particleCount = 2000;
let handDistance = 0;
let maxHandDistance = 400;

// 手势检测相关
let hands = null;
let cameraElement = null;
let mpCamera = null;

// 初始化函数
async function init() {
    // 初始化Three.js场景
    initThreeJS();
    
    // 初始化手势检测
    await initHandTracking();
    
    // 初始化UI事件
    initUIEvents();
    
    // 创建粒子系统
    createParticleSystem();
    
    // 开始动画循环
    animate();
}

// 初始化Three.js场景
function initThreeJS() {
    // 创建场景
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 1, 1000);
    
    // 创建相机
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 100;
    
    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    document.getElementById('container').appendChild(renderer.domElement);
    
    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);
    
    // 添加方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);
    
    // 窗口大小调整监听
    window.addEventListener('resize', onWindowResize);
}

// 初始化手势追踪
async function initHandTracking() {
    cameraElement = document.createElement('video');
    cameraElement.style.position = 'fixed';
    cameraElement.style.bottom = '10px';
    cameraElement.style.right = '10px';
    cameraElement.style.width = '120px';
    cameraElement.style.height = '90px';
    cameraElement.style.borderRadius = '8px';
    cameraElement.style.opacity = '0.3';
    cameraElement.style.zIndex = '99';
    
    // 显示摄像头预览帮助用户调试
    document.body.appendChild(cameraElement);

    hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
        }
    });

    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    hands.onResults(onHandsResults);
}

// 启动摄像头
async function startCamera() {
    if (!mpCamera) {
        mpCamera = new Camera(cameraElement, {
            onFrame: async () => {
                await hands.send({ image: cameraElement });
            },
            width: 1280,
            height: 720
        });
    }
    
    try {
        await mpCamera.start();
        document.getElementById('permissionModal').classList.add('hidden');
        return true;
    } catch (error) {
        console.error('摄像头启动失败:', error);
        return false;
    }
}

// 处理手部追踪结果
function onHandsResults(results) {
    if (results.multiHandLandmarks) {
        if (results.multiHandLandmarks.length === 2) {
            // 计算双手距离
            const hand1 = results.multiHandLandmarks[0];
            const hand2 = results.multiHandLandmarks[1];
            
            const hand1Center = {
                x: hand1[9].x,
                y: hand1[9].y
            };
            
            const hand2Center = {
                x: hand2[9].x,
                y: hand2[9].y
            };
            
            const distance = Math.sqrt(
                Math.pow(hand1Center.x - hand2Center.x, 2) +
                Math.pow(hand1Center.y - hand2Center.y, 2)
            );
            
            handDistance = distance * 1000;
            maxHandDistance = Math.max(maxHandDistance, handDistance);
        } else if (results.multiHandLandmarks.length === 1) {
            // 单手张开程度
            const hand = results.multiHandLandmarks[0];
            const thumb = hand[4];
            const pinky = hand[20];
            
            const distance = Math.sqrt(
                Math.pow(thumb.x - pinky.x, 2) +
                Math.pow(thumb.y - pinky.y, 2)
            );
            
            handDistance = distance * 800;
        }
    }
}

// 创建粒子系统
function createParticleSystem() {
    // 移除旧的粒子系统
    if (particleSystem) {
        scene.remove(particleSystem);
    }
    
    // 创建几何体
    let geometry;
    
    switch(currentModel) {
        case 'christmas':
            geometry = createChristmasTreeGeometry();
            break;
        case 'star':
            geometry = createStarGeometry();
            break;
        case 'heart':
            geometry = createHeartGeometry();
            break;
        case 'earth':
            geometry = createEarthGeometry();
            break;
        case 'fireworks':
            geometry = createFireworksGeometry();
            break;
        default:
            geometry = createSphereGeometry();
    }
    
    // 创建材质
    const material = new THREE.PointsMaterial({
        color: particleColor,
        size: 2,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });
    
    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
    particles = geometry.attributes.position.array;
}

// 创建圣诞树几何体
function createChristmasTreeGeometry() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    
    for (let i = 0; i < particleCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const z = (Math.random() - 0.5) * 100;
        const radius = Math.max(0, 30 - Math.abs(z) * 0.6) * Math.random();
        
        const x = radius * Math.cos(theta);
        const y = radius * Math.sin(theta);
        
        positions.push(x, y, z);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
}

// 创建星星几何体
function createStarGeometry() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    
    for (let i = 0; i < particleCount; i++) {
        const r = Math.random() * 50;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        
        positions.push(x, y, z);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
}

// 创建爱心几何体
function createHeartGeometry() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    
    for (let i = 0; i < particleCount; i++) {
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI;
        
        const x = 16 * Math.pow(Math.sin(v), 3) * Math.cos(u) * 2;
        const y = (13 * Math.cos(v) - 5 * Math.cos(2*v) - 2 * Math.cos(3*v) - Math.cos(4*v)) * 2;
        const z = 16 * Math.pow(Math.sin(v), 3) * Math.sin(u) * 2;
        
        positions.push(x + (Math.random() - 0.5) * 10, y + (Math.random() - 0.5) * 10, z + (Math.random() - 0.5) * 10);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
}

// 创建地球几何体
function createEarthGeometry() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    
    for (let i = 0; i < particleCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 30 + Math.random() * 10;
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        
        positions.push(x, y, z);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
}

// 创建烟花几何体
function createFireworksGeometry() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    
    for (let i = 0; i < particleCount; i++) {
        const r = Math.random() * 60;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        
        positions.push(x, y, z);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
}

// 创建球体几何体
function createSphereGeometry() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    
    for (let i = 0; i < particleCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 30;
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        
        positions.push(x, y, z);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
}

// 初始化UI事件
function initUIEvents() {
    // 模型选择
    document.getElementById('modelSelect').addEventListener('change', (e) => {
        currentModel = e.target.value;
        createParticleSystem();
    });
    
    // 颜色选择
    document.getElementById('colorPicker').addEventListener('input', (e) => {
        particleColor = new THREE.Color(e.target.value);
        if (particleSystem) {
            particleSystem.material.color = particleColor;
        }
    });
    
    // 粒子数量调整
    const countSlider = document.getElementById('particleCount');
    const countValue = document.getElementById('countValue');
    
    countSlider.addEventListener('input', (e) => {
        particleCount = parseInt(e.target.value);
        countValue.textContent = particleCount;
    });
    
    // 重置按钮
    document.getElementById('resetBtn').addEventListener('click', () => {
        createParticleSystem();
    });
    
    // 手动缩放控制
    const manualControl = document.getElementById('manualControl');
    const manualValue = document.getElementById('manualValue');
    
    manualControl.addEventListener('input', (e) => {
        handDistance = parseInt(e.target.value);
        manualValue.textContent = e.target.value;
    });
    
    // 全屏按钮
    document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);
    
    // 添加摄像头控制按钮
    const cameraBtn = document.createElement('button');
    cameraBtn.textContent = '开启摄像头控制';
    cameraBtn.className = 'btn';
    cameraBtn.style.marginTop = '10px';
    cameraBtn.addEventListener('click', async () => {
        try {
            // 请求摄像头权限
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            cameraElement.srcObject = stream;
            
            // 启动MediaPipe摄像头
            const success = await startCamera();
            if (success) {
                cameraBtn.textContent = '摄像头已开启';
                cameraBtn.disabled = true;
            }
        } catch (error) {
            console.error('无法获取摄像头权限:', error);
            alert('摄像头权限已被拒绝，请在浏览器设置中手动开启权限');
        }
    });
    
    document.querySelector('.control-panel').appendChild(cameraBtn);
}

// 切换全屏
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error('无法进入全屏模式:', err);
        });
        document.getElementById('fullscreenBtn').innerHTML = '⛶';
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            document.getElementById('fullscreenBtn').innerHTML = '➕';
        }
    }
}

// 窗口大小调整
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    
    // 根据手部距离控制粒子缩放和扩散
    let scale = 1;
    if (handDistance > 0) {
        scale = Math.min(handDistance / (maxHandDistance || 300) * 3, 3);
    }
    
    if (particleSystem) {
        particleSystem.scale.setScalar(scale);
        
        // 粒子扩散效果
        const positions = particleSystem.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const factor = scale * 0.1;
            positions[i] += (Math.random() - 0.5) * factor;
            positions[i + 1] += (Math.random() - 0.5) * factor;
            positions[i + 2] += (Math.random() - 0.5) * factor;
        }
        particleSystem.geometry.attributes.position.needsUpdate = true;
        
        // 旋转粒子系统
        particleSystem.rotation.y += 0.005;
    }
    
    renderer.render(scene, camera);
}

// 启动应用
async function startApp() {
    // 先初始化Three.js场景
    initThreeJS();
    
    // 初始化手势追踪但不自动请求权限
    await initHandTracking();
    
    // 初始化UI事件
    initUIEvents();
    
    // 创建粒子系统
    createParticleSystem();
    
    // 开始动画循环
    animate();
    
    // 默认隐藏权限弹窗，显示粒子系统
    document.getElementById('permissionModal').classList.add('hidden');
    
    // 设置默认手动控制值
    handDistance = 200;
}

startApp();