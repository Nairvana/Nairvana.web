// =============================================
// 主应用类 - 管理整个生态系统
// =============================================
class LifePool {
    constructor() {
        // 初始化画布和上下文
        this.canvas = document.getElementById('poolCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 生态系统数据
        this.microbes = [];      // 所有微生物
        this.isDrawing = false;  // 是否正在绘制
        this.currentStroke = []; // 当前绘制的笔迹
        this.strokeStartTime = 0; // 笔迹开始时间
        
        // 性能监控
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        
        // 初始化
        this.resizeCanvas();
        this.setupEventListeners();
        this.setupUI();
        
        console.log('🌊 生命之池初始化完成');
        console.log('🎨 现在你可以用鼠标在画布上绘制线条来创造生物了！');
        
        // 启动动画循环
        this.animate();
    }
    
    // 调整画布大小以适应窗口
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        console.log(`📐 画布大小调整为: ${this.canvas.width} x ${this.canvas.height}`);
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 窗口大小变化
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 鼠标事件 - 用于绘制笔迹
        this.canvas.addEventListener('mousedown', (e) => this.startStroke(e));
        this.canvas.addEventListener('mousemove', (e) => this.recordStroke(e));
        this.canvas.addEventListener('mouseup', () => this.endStroke());
        this.canvas.addEventListener('mouseleave', () => this.endStroke());
        
        // 触摸事件 - 支持移动设备
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startStroke(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.recordStroke(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.endStroke();
        });
    }
    
    // 设置UI交互
    setupUI() {
        // 清空按钮
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.microbes = [];
            console.log('🧹 池子已清空');
        });
        
        // 添加测试生物按钮
        document.getElementById('addTestBtn').addEventListener('click', () => {
            this.addTestMicrobes();
        });
    }
    
    // =============================================
    // 笔迹交互系统
    // =============================================
    
    // 开始绘制笔迹
    startStroke(e) {
        this.isDrawing = true;
        this.currentStroke = [];
        this.strokeStartTime = Date.now();
        
        const pos = this.getMousePosition(e);
        this.currentStroke.push({
            x: pos.x,
            y: pos.y,
            time: Date.now()
        });
        
        console.log('✏️ 开始绘制笔迹');
    }
    
    // 记录笔迹点
    recordStroke(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getMousePosition(e);
        this.currentStroke.push({
            x: pos.x,
            y: pos.y,
            time: Date.now()
        });
        
        // 实时显示笔迹
        this.drawCurrentStroke();
    }
    
    // 结束绘制笔迹
    endStroke() {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        
        if (this.currentStroke.length > 1) {
            console.log(`🎯 笔迹分析: ${this.currentStroke.length}个点`);
            this.analyzeAndCreateMicrobes();
        }
        
        this.currentStroke = [];
    }
    
    // 获取鼠标位置（考虑画布偏移）
    getMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    // 绘制当前笔迹（实时反馈）
    drawCurrentStroke() {
        if (this.currentStroke.length < 2) return;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.currentStroke[0].x, this.currentStroke[0].y);
        
        for (let i = 1; i < this.currentStroke.length; i++) {
            this.ctx.lineTo(this.currentStroke[i].x, this.currentStroke[i].y);
        }
        this.ctx.stroke();
    }
    
    // =============================================
    // 笔迹分析与生物创建
    // =============================================
    
    // 分析笔迹并创建生物
    analyzeAndCreateMicrobes() {
        const stroke = this.currentStroke;
        const duration = stroke[stroke.length - 1].time - stroke[0].time;
        
        if (duration === 0) return; // 防止除以零
        
        // 1. 计算速度特征
        let totalDistance = 0;
        for (let i = 1; i < stroke.length; i++) {
            const dx = stroke[i].x - stroke[i-1].x;
            const dy = stroke[i].y - stroke[i-1].y;
            totalDistance += Math.sqrt(dx * dx + dy * dy);
        }
        const avgSpeed = totalDistance / duration;
        
        // 2. 计算曲率特征
        let totalCurvature = 0;
        let curvaturePoints = 0;
        
        for (let i = 1; i < stroke.length - 1; i++) {
            const dx1 = stroke[i].x - stroke[i-1].x;
            const dy1 = stroke[i].y - stroke[i-1].y;
            const dx2 = stroke[i+1].x - stroke[i].x;
            const dy2 = stroke[i+1].y - stroke[i].y;
            
            if (dx1 !== 0 || dy1 !== 0) {
                const angle1 = Math.atan2(dy1, dx1);
                const angle2 = Math.atan2(dy2, dx2);
                let angleDiff = angle2 - angle1;
                
                // 标准化角度差到 [-PI, PI]
                if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                
                totalCurvature += Math.abs(angleDiff);
                curvaturePoints++;
            }
        }
        
        const avgCurvature = curvaturePoints > 0 ? totalCurvature / curvaturePoints : 0;
        
        // 3. 计算密度特征
        const density = stroke.length / Math.max(1, totalDistance);
        
        console.log(`📊 笔迹特征 - 速度: ${avgSpeed.toFixed(2)}, 曲率: ${avgCurvature.toFixed(2)}, 密度: ${density.toFixed(2)}`);
        
        // 根据特征创建生物
        this.createMicrobesFromStroke(stroke, {
            speed: avgSpeed,
            curvature: avgCurvature,
            density: density
        });
    }
    
    // 根据笔迹特征创建生物
    createMicrobesFromStroke(stroke, features) {
        // 将笔迹特征映射到DNA参数
        const baseDNA = {
            speed: Math.min(3, Math.max(0.5, features.speed * 100)), // 速度映射
            social: Math.min(1, Math.max(0, features.density * 2)),  // 密度映射到社交性
            curiosity: Math.min(1, Math.max(0, features.curvature * 3)) // 曲率映射到好奇心
        };
        
        console.log('🧬 基础DNA:', baseDNA);
        
        // 沿笔迹路径创建生物（每5个点创建一个）
        const step = Math.max(1, Math.floor(stroke.length / 5));
        let microbesCreated = 0;
        
        for (let i = 0; i < stroke.length; i += step) {
            const point = stroke[i];
            
            // 为每个生物添加一些随机变异
            const dnaVariation = {
                ...baseDNA,
                speed: baseDNA.speed * (0.8 + Math.random() * 0.4),
                size: 2 + Math.random() * 3,
                social: Math.max(0, Math.min(1, baseDNA.social + (Math.random() - 0.5) * 0.2)),
                curiosity: Math.max(0, Math.min(1, baseDNA.curiosity + (Math.random() - 0.5) * 0.2))
            };
            
            const microbe = new Microbe(point.x, point.y, dnaVariation);
            this.microbes.push(microbe);
            microbesCreated++;
        }
        
        console.log(`🐠 创造了 ${microbesCreated} 个新生物`);
    }
    
    // =============================================
    // 测试功能
    // =============================================
    
    // 添加测试生物
    addTestMicrobes() {
        const count = 10;
        for (let i = 0; i < count; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            
            const testDNA = {
                speed: Math.random() * 2 + 0.5,
                size: Math.random() * 3 + 2,
                social: Math.random(),
                curiosity: Math.random()
            };
            
            this.microbes.push(new Microbe(x, y, testDNA));
        }
        console.log(`🧪 添加了 ${count} 个测试生物`);
    }
    
    // =============================================
    // 动画循环和渲染
    // =============================================
    
    // 主动画循环
    animate() {
        // 计算FPS
        this.calculateFPS();
        
        // 清空画布（使用半透明填充创造拖尾效果）
        this.ctx.fillStyle = 'rgba(10, 20, 40, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 更新和绘制所有生物
        this.updateMicrobes();
        
        // 更新UI
        this.updateUI();
        
        // 继续动画循环
        requestAnimationFrame(() => this.animate());
    }
    
    // 更新所有微生物
    updateMicrobes() {
        // 使用filter移除死亡的生物，同时更新存活的生物
        this.microbes = this.microbes.filter(microbe => {
            const isAlive = microbe.update(this.canvas);
            if (isAlive) {
                microbe.draw(this.ctx);
                
                // 处理繁殖
                const child = microbe.reproduce();
                if (child) {
                    this.microbes.push(child);
                }
            }
            return isAlive;
        });
    }
    
    // 计算帧率
    calculateFPS() {
        this.frameCount++;
        const now = performance.now();
        
        if (now >= this.lastFpsUpdate + 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
    }
    
    // 更新UI显示
    updateUI() {
        document.getElementById('microbeCount').textContent = this.microbes.length;
        document.getElementById('fps').textContent = this.fps;
    }
}

// =============================================
// 微生物类 - 定义单个生物的行为和外观
// =============================================
class Microbe {
    constructor(x, y, dna = {}) {
        // 位置和运动
        this.position = { x, y };
        this.velocity = { 
            x: (Math.random() - 0.5) * 2, 
            y: (Math.random() - 0.5) * 2 
        };
        
        // DNA属性（生物特征）
        this.dna = {
            speed: dna.speed || Math.random() * 2 + 0.5,
            size: dna.size || Math.random() * 3 + 2,
            color: dna.color || this.generateColor(),
            social: dna.social || Math.random(),      // 0-1, 群居倾向
            curiosity: dna.curiosity || Math.random(), // 0-1, 探索倾向
            ...dna
        };
        
        // 状态属性
        this.energy = 100;
        this.age = 0;
        this.maxAge = 500 + Math.random() * 1000;
        
        console.log(`🐛 新生物诞生 - 位置: (${x.toFixed(0)}, ${y.toFixed(0)}), DNA:`, this.dna);
    }
    
    // 生成随机颜色
    generateColor() {
        const hue = Math.random() * 360;
        return `hsl(${hue}, 70%, 60%)`;
    }
    
    // 更新生物状态
    update(canvas) {
        // 应用DNA速度
        this.position.x += this.velocity.x * this.dna.speed;
        this.position.y += this.velocity.y * this.dna.speed;
        
        // 边界检测和反弹
        if (this.position.x < 0 || this.position.x > canvas.width) {
            this.velocity.x *= -1;
            this.position.x = Math.max(0, Math.min(canvas.width, this.position.x));
        }
        if (this.position.y < 0 || this.position.y > canvas.height) {
            this.velocity.y *= -1;
            this.position.y = Math.max(0, Math.min(canvas.height, this.position.y));
        }
        
        // 随机方向变化（受好奇心影响）
        if (Math.random() < 0.02 * this.dna.curiosity) {
            this.velocity.x += (Math.random() - 0.5) * 0.5;
            this.velocity.y += (Math.random() - 0.5) * 0.5;
        }
        
        // 归一化速度（保持恒定速度）
        const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
        if (speed > 0) {
            this.velocity.x = (this.velocity.x / speed) * this.dna.speed;
            this.velocity.y = (this.velocity.y / speed) * this.dna.speed;
        }
        
        // 能量和年龄管理
        this.energy -= 0.1;
        this.age++;
        
        // 检查是否死亡
        return this.energy > 0 && this.age < this.maxAge;
    }
    
    // 绘制生物
    draw(ctx) {
        // 绘制主体
        ctx.fillStyle = this.dna.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.dna.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制方向指示器（小尾巴）
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(
            this.position.x - this.velocity.x * 8,
            this.position.y - this.velocity.y * 8
        );
        ctx.stroke();
        
        // 绘制能量环（可选）
        if (this.energy < 50) {
            ctx.strokeStyle = `rgba(255, ${Math.floor(this.energy * 5)}, 0, 0.5)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.dna.size + 3, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // 繁殖后代
    reproduce() {
        // 只有能量充足且随机概率时繁殖
        if (this.energy > 120 && Math.random() < 0.005) {
            this.energy -= 60; // 繁殖消耗能量
            
            const childDNA = { ...this.dna };
            
            // 引入随机变异
            childDNA.speed *= (0.9 + Math.random() * 0.2);
            childDNA.size *= (0.9 + Math.random() * 0.2);
            childDNA.social += (Math.random() - 0.5) * 0.2;
            childDNA.curiosity += (Math.random() - 0.5) * 0.2;
            
            // 限制在合理范围内
            childDNA.speed = Math.max(0.5, Math.min(4, childDNA.speed));
            childDNA.size = Math.max(1, Math.min(6, childDNA.size));
            childDNA.social = Math.max(0, Math.min(1, childDNA.social));
            childDNA.curiosity = Math.max(0, Math.min(1, childDNA.curiosity));
            
            // 颜色变异（30%概率）
            if (Math.random() < 0.3) {
                const currentHue = parseInt(childDNA.color.match(/\d+/)[0]);
                const newHue = (currentHue + (Math.random() - 0.5) * 60 + 360) % 360;
                childDNA.color = `hsl(${newHue}, 70%, 60%)`;
            }
            
            // 在父母附近创建后代
            const child = new Microbe(
                this.position.x + (Math.random() - 0.5) * 20,
                this.position.y + (Math.random() - 0.5) * 20,
                childDNA
            );
            
            return child;
        }
        return null;
    }
}

// =============================================
// 应用启动
// =============================================

// 当页面加载完成后启动应用
window.addEventListener('load', () => {
    console.log('🚀 启动生命之池应用...');
    const lifePool = new LifePool();
    
    // 将应用实例挂载到window以便调试
    window.lifePool = lifePool;
    console.log('🔧 调试提示: 在控制台中使用 "lifePool" 来访问应用实例');
});