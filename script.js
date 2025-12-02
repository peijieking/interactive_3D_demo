// 全局变量
let scene, camera, renderer, particleSystem;
let particles = [];
let currentModel = 'tree';
let particleColor = new THREE.Color(0x4CAF50);
let isFullscreen = false;
let cameraStream = null;
let hands = null;
let gestureData = { hand1: null, hand2: null };

// 初始化Three.js场景
function initScene() {
    // 创建场景
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);
    
    // 创建相机
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 15;
    
    // 创建渲染器
    const canvas = document.getElementById('canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x1a1a2e, 1);
    
    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    // 添加点光源
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);
    
    // 创建粒子系统
    createParticleSystem();
    
    // 添加轨道控制器
    if (typeof THREE.OrbitControls !== 'undefined') {
        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
    }
    
    // 开始动画循环
    animate();
}

// 创建粒子系统
function createParticleSystem() {
    const particleCount = 2000;
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    // 初始化粒子位置
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // 根据当前模型设置粒子位置
        switch (currentModel) {
            case 'tree':
                positions[i3] = (Math.random() - 0.5) * 4;
                positions[i3 + 1] = Math.random() * 8 - 4;
                positions[i3 + 2] = (Math.random() - 0.5) * 4;
                break;
            case 'star':
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 3;
                positions[i3] = Math.cos(angle) * radius;
                positions[i3 + 1] = Math.sin(angle) * radius;
                positions[i3 + 2] = (Math.random() - 0.5) * 2;
                break;
            case 'fireworks':
                positions[i3] = (Math.random() - 0.5) * 6;
                positions[i3 + 1] = (Math.random() - 0.5) * 6;
                positions[i3 + 2] = (Math.random() - 0.5) * 6;
                break;
            case 'heart':
                const t = Math.random() * Math.PI * 2;
                const x = 16 * Math.pow(Math.sin(t), 3);
                const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
                positions[i3] = x * 0.1;
                positions[i3 + 1] = y * 0.1;
                positions[i3 + 2] = (Math.random() - 0.5) * 2;
                break;
            case 'earth':
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const r = 3 + Math.random() * 0.5;
                positions[i3] = r * Math.sin(phi) * Math.cos(theta);
                positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                positions[i3 + 2] = r * Math.cos(phi);
                break;
        }
        
        // 设置粒子颜色
        colors[i3] = particleColor.r;
        colors[i3 + 1] = particleColor.g;
        colors[i3 + 2] = particleColor.b;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // 创建材质
    const material = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
    });
    
    // 创建粒子系统
    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
}

// 初始化手势识别
function initGestureRecognition() {
    console.log('开始初始化手势识别...');
    
    // 检查Hands库是否加载
    if (typeof Hands === 'undefined') {
        console.error('Hands库未加载');
        updateStatus('手势识别库加载失败', true);
        return;
    }
    
    console.log('Hands库已加载，开始创建Hands实例...');
    
    try {
        hands = new Hands({
            locateFile: (file) => {
                console.log('加载MediaPipe文件:', file);
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
            }
        });
        
        console.log('Hands实例创建成功，设置选项...');
        
        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        
        console.log('Hands选项设置成功，设置结果回调...');
        
        hands.onResults(onGestureResults);
        
        console.log('手势识别初始化完成，启动摄像头...');
        
        // 启动摄像头
        startCamera();
    } catch (error) {
        console.error('手势识别初始化失败:', error);
        updateStatus('手势识别初始化失败', true);
    }
}

// 启动摄像头
function startCamera() {
    console.log('开始启动摄像头...');
    
    const videoElement = document.getElementById('video');
    
    if (!videoElement) {
        console.error('视频元素未找到');
        updateStatus('摄像头访问失败: 视频元素未找到', true);
        return;
    }
    
    console.log('视频元素找到，请求摄像头权限...');
    
    navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false
    }).then((stream) => {
        console.log('摄像头权限已获取，设置视频源...');
        videoElement.srcObject = stream;
        cameraStream = stream;
        
        console.log('视频源设置成功，启动MediaPipe摄像头...');
        
        // 启动MediaPipe
        const camera = new Camera(videoElement, {
            onFrame: async () => {
                console.log('处理视频帧...');
                await hands.send({ image: videoElement });
            },
            width: 640,
            height: 480
        });
        camera.start();
        
        console.log('MediaPipe摄像头启动成功');
        updateStatus('手势识别已启动');
    }).catch((error) => {
        console.error('摄像头访问失败:', error);
        updateStatus('无法访问摄像头: ' + error.message, true);
    });
}

// 手势识别结果处理
function onGestureResults(results) {
    console.log('手势识别结果:', results);
    
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        gestureData = { hand1: null, hand2: null };
        updateStatus('未检测到手势');
        return;
    }
    
    console.log(`检测到 ${results.multiHandLandmarks.length} 只手`);
    
    // 处理每只手
    for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const handLandmarks = results.multiHandLandmarks[i];
        
        console.log(`第 ${i+1} 只手的关键点数量:`, handLandmarks ? handLandmarks.length : 'undefined');
        
        // 检查关键点是否存在
        if (!handLandmarks || handLandmarks.length < 9) {
            console.error('手部关键点不足');
            continue;
        }
        
        // 获取指尖位置
        const thumbTip = handLandmarks[4];
        const indexTip = handLandmarks[8];
        
        console.log(`第 ${i+1} 只手的指尖位置: 拇指(${thumbTip ? '存在' : '不存在'}), 食指(${indexTip ? '存在' : '不存在'})`);
        
        // 检查指尖位置是否有效
        if (!thumbTip || !indexTip || !thumbTip.x || !indexTip.x) {
            console.error('指尖位置无效');
            continue;
        }
        
        // 计算指尖距离
        const distance = Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) +
            Math.pow(thumbTip.y - indexTip.y, 2) +
            Math.pow(thumbTip.z - indexTip.z, 2)
        );
        
        console.log(`第 ${i+1} 只手的指尖距离: ${distance}`);
        
        // 存储手势数据
        if (i === 0) {
            gestureData.hand1 = { distance, landmarks: handLandmarks };
        } else {
            gestureData.hand2 = { distance, landmarks: handLandmarks };
        }
    }
    
    console.log('手势数据:', gestureData);
    
    // 更新粒子系统
    updateParticleSystem();
}

// 更新粒子系统
function updateParticleSystem() {
    if (!particleSystem) {
        console.error('粒子系统未初始化');
        return;
    }
    
    // 检查是否有至少一只手的数据
    if (!gestureData.hand1 && !gestureData.hand2) {
        updateStatus('等待手势输入...');
        return;
    }
    
    // 计算缩放因子
    let scaleFactor = 1;
    
    if (gestureData.hand1 && gestureData.hand2) {
        // 双手模式
        const avgDistance = (gestureData.hand1.distance + gestureData.hand2.distance) / 2;
        scaleFactor = Math.max(0.5, Math.min(2, avgDistance * 10));
        console.log(`双手模式 - 平均距离: ${avgDistance}, 缩放因子: ${scaleFactor}`);
    } else if (gestureData.hand1) {
        // 单手模式
        scaleFactor = Math.max(0.5, Math.min(2, gestureData.hand1.distance * 10));
        console.log(`单手模式 - 距离: ${gestureData.hand1.distance}, 缩放因子: ${scaleFactor}`);
    } else if (gestureData.hand2) {
        // 单手模式
        scaleFactor = Math.max(0.5, Math.min(2, gestureData.hand2.distance * 10));
        console.log(`单手模式 - 距离: ${gestureData.hand2.distance}, 缩放因子: ${scaleFactor}`);
    }
    
    // 应用缩放（平滑过渡）
    const currentScale = particleSystem.scale.x;
    const targetScale = scaleFactor;
    const smoothFactor = 0.1;
    
    particleSystem.scale.x += (targetScale - currentScale) * smoothFactor;
    particleSystem.scale.y += (targetScale - currentScale) * smoothFactor;
    particleSystem.scale.z += (targetScale - currentScale) * smoothFactor;
    
    console.log(`粒子系统缩放: 当前=${currentScale.toFixed(3)}, 目标=${targetScale.toFixed(3)}, 新值=${particleSystem.scale.x.toFixed(3)}`);
    
    // 更新状态显示
    const statusText = gestureData.hand1 && gestureData.hand2 
        ? `双手模式 - 缩放 ${targetScale.toFixed(2)}x`
        : `单手模式 - 缩放 ${targetScale.toFixed(2)}x`;
    
    document.getElementById('gesture-info').textContent = statusText;
    updateStatus('手势控制正常');
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    
    // 旋转粒子系统
    if (particleSystem) {
        particleSystem.rotation.y += 0.005;
        particleSystem.rotation.x += 0.002;
    }
    
    // 渲染场景
    renderer.render(scene, camera);
}

// 更新状态显示
function updateStatus(message, isError = false) {
    const statusText = document.getElementById('status-text');
    statusText.textContent = message;
    statusText.style.color = isError ? '#ff6b6b' : '#4CAF50';
}

// 切换模型
function changeModel(modelType) {
    currentModel = modelType;
    
    // 移除旧的粒子系统
    if (particleSystem) {
        scene.remove(particleSystem);
        particleSystem.geometry.dispose();
        particleSystem.material.dispose();
    }
    
    // 创建新的粒子系统
    createParticleSystem();
    
    updateStatus(`模型已切换为: ${modelType}`);
}

// 切换粒子颜色
function changeColor(color) {
    particleColor = new THREE.Color(color);
    
    if (particleSystem) {
        const colors = particleSystem.geometry.attributes.color.array;
        for (let i = 0; i < colors.length; i += 3) {
            colors[i] = particleColor.r;
            colors[i + 1] = particleColor.g;
            colors[i + 2] = particleColor.b;
        }
        particleSystem.geometry.attributes.color.needsUpdate = true;
    }
    
    updateStatus(`颜色已更新`);
}

// 切换全屏模式
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        isFullscreen = true;
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            isFullscreen = false;
        }
    }
}

// 窗口大小调整处理
function handleResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

window.addEventListener('resize', handleResize);

// 初始化UI事件
function initUI() {
    // 模型选择器
    document.getElementById('model-selector').addEventListener('change', (e) => {
        changeModel(e.target.value);
    });
    
    // 颜色选择器
    document.getElementById('color-picker').addEventListener('change', (e) => {
        changeColor(e.target.value);
    });
    
    // 全屏按钮
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
    
    // 切换摄像头按钮
    document.getElementById('toggle-camera-btn').addEventListener('click', () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
        }
        startCamera();
    });
    
    // 键盘控制
    document.addEventListener('keydown', (e) => {
        if (!particleSystem) return;
        
        const scaleChange = 0.1;
        
        switch(e.key) {
            case '+':
            case '=':
                particleSystem.scale.x += scaleChange;
                particleSystem.scale.y += scaleChange;
                particleSystem.scale.z += scaleChange;
                updateStatus(`手动缩放: ${particleSystem.scale.x.toFixed(2)}x`);
                break;
            case '-':
                particleSystem.scale.x -= scaleChange;
                particleSystem.scale.y -= scaleChange;
                particleSystem.scale.z -= scaleChange;
                updateStatus(`手动缩放: ${particleSystem.scale.x.toFixed(2)}x`);
                break;
            case '0':
                particleSystem.scale.set(1, 1, 1);
                updateStatus('缩放已重置');
                break;
        }
    });
}

// 初始化应用
function initApp() {
    initScene();
    initGestureRecognition();
    initUI();
    
    updateStatus('应用已启动');
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}