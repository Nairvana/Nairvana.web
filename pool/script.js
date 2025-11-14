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
    
    // 在 setupUI 方法中添加以下代码
    setupUI() {
        // 清空按钮
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.microbes = [];
            this.energyPoints = [];
            this.eatEvents = 0;
            this.combatEvents = 0;
            this.escapeEvents = 0;
        });

        // 添加测试生物按钮
        document.getElementById('addTestBtn').addEventListener('click', () => {
            this.addSchoolOfFish();
        });

        // 添加捕食者按钮
        document.getElementById('addPredatorBtn').addEventListener('click', () => {
            this.addPredators();
        });

        // 侧边栏收起/展开功能
        document.getElementById('togglePanel').addEventListener('click', (e) => {
            e.stopPropagation();
            const panel = document.querySelector('.panel');
            panel.classList.toggle('collapsed');
        });

        // 点击标题也可以收起/展开
        document.querySelector('.panel-header').addEventListener('click', (e) => {
            if (e.target.id !== 'togglePanel') {
                const panel = document.querySelector('.panel');
                panel.classList.toggle('collapsed');
            }
        });
    }

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