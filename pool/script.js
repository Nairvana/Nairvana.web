// =============================================
// 能量点类 - 定义能量点的行为和外观
// =============================================
    class EnergyPoint {
        constructor(x, y, energy = 50) {
            this.position = { x, y };
            this.energy = energy;
            this.maxEnergy = energy;
            this.lifespan = 300; // 能量点存在时间（帧数）
            this.age = 0;
            this.pulse = 0;
            this.attractionRadius = 150; // 吸引范围
        }

        // 更新能量点状态
        update() {
            this.age++;
            this.pulse = Math.sin(this.age * 0.1) * 0.5 + 0.5; // 脉动效果

            // 能量随时间减少
            this.energy = this.maxEnergy * (1 - this.age / this.lifespan);

            return this.age < this.lifespan && this.energy > 0;
        }

        // 绘制能量点
        draw(ctx) {
            const size = 5 + this.pulse * 3;

            // 发光效果
            const gradient = ctx.createRadialGradient(
                this.position.x, this.position.y, 0,
                this.position.x, this.position.y, size * 2
            );
            gradient.addColorStop(0, `rgba(255, 255, 100, ${0.8 * this.energy/this.maxEnergy})`);
            gradient.addColorStop(0.5, `rgba(255, 200, 50, ${0.4 * this.energy/this.maxEnergy})`);
            gradient.addColorStop(1, 'rgba(255, 150, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, size * 2, 0, Math.PI * 2);
            ctx.fill();

            // 能量点核心
            ctx.fillStyle = `rgba(255, 255, 100, ${this.energy/this.maxEnergy})`;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // 吸引附近的生物
        attractMicrobes(microbes) {
            for (const microbe of microbes) {
                const dx = this.position.x - microbe.position.x;
                const dy = this.position.y - microbe.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.attractionRadius) {
                    // 计算吸引力（距离越近吸引力越大）
                    const attraction = (1 - distance / this.attractionRadius) * 0.1;

                    // 向能量点移动
                    if (distance > 0) {
                        microbe.velocity.x += (dx / distance) * attraction;
                        microbe.velocity.y += (dy / distance) * attraction;
                    }
                }
            }
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

            // 生物类型
            this.type = dna.type || 'normal'; // normal, predator

            // DNA属性（生物特征）
            this.dna = {
                // 基础速度 - 现在与大小成反比，整体提高了速度
                baseSpeed: dna.baseSpeed || Math.random() * 3 + 2, // 提高基础速度
                size: dna.size || Math.random() * 4 + 2,
                color: dna.color || this.generateColor(),
                social: dna.social || Math.random(),
                curiosity: dna.curiosity || Math.random(),
                alignment: dna.alignment || Math.random(), // 对齐倾向
                cohesion: dna.cohesion || Math.random(),   // 凝聚倾向
                separation: dna.separation || Math.random(), // 分离倾向
                aggression: dna.aggression || Math.random(), // 攻击性
                ...dna
            };

            // 根据类型调整属性
            this.applyTypeModifiers();

            // 状态属性 - 移除了自然死亡机制
            this.energy = 100;
            this.age = 0;

            // 伴随系统
            this.lord = null;
            this.followOffset = { x: 0, y: 0 };
            this.isFollowing = false;

            // 争斗系统
            this.combatTarget = null;
            this.combatCooldown = 0;
            this.exclamationTimer = 0;

            // 逃避系统
            this.escapeTarget = null;
            this.escapeTimer = 0;

            // 鱼群系统
            this.flockMates = [];

            // 捕食系统（捕食者特有）
            this.huntTarget = null;
            this.huntCooldown = 0;

            // 唯一标识符
            this.id = Math.random().toString(36).substr(2, 9);
        }

        // 根据类型调整属性
        applyTypeModifiers() {
            if (this.type === 'predator') {
                // 鲨鱼：更大、更具攻击性（速度现在统一在get speed中处理）
                this.dna.size *= 2.5;
                this.dna.aggression = Math.max(0.8, this.dna.aggression);
                this.dna.social = Math.min(0.2, this.dna.social);
                this.dna.color = `hsl(200, 80%, 40%)`; // 深蓝色
            }

            // 限制在合理范围内
            this.dna.baseSpeed = Math.max(0.5, Math.min(8, this.dna.baseSpeed));
            this.dna.size = Math.max(1, Math.min(15, this.dna.size));
        }

        // 计算实际速度 - 所有生物统一速度，鲨鱼为3倍速
        get speed() {
            // 基础速度（所有生物统一）
            const baseSpeed = 2.0;

            // 鲨鱼速度为3倍
            if (this.type === 'predator') {
                return baseSpeed * 3.0;
            }

            // 其他生物正常速度
            return baseSpeed;
        }

        // 生成随机颜色
        generateColor() {
            const hue = Math.random() * 60 + 180; // 蓝色到青色范围
            return `hsl(${hue}, 70%, 60%)`;
        }

        // 更新生物状态
        update(canvas) {
            this.allMicrobes = window.lifePool.microbes;
            this.energyPoints = window.lifePool.energyPoints;

            // 更新计时器
            if (this.exclamationTimer > 0) this.exclamationTimer--;
            if (this.combatCooldown > 0) this.combatCooldown--;
            if (this.escapeTimer > 0) this.escapeTimer--;
            if (this.huntCooldown > 0) this.huntCooldown--;

            // 捕食者行为：主动寻找猎物
            if (this.type === 'predator' && this.huntCooldown <= 0 && !this.escapeTarget) {
                this.huntTarget = this.findPrey();
            }

            if (this.huntTarget) {
                this.huntPrey();
            }
            // 逃避行为优先于其他行为
            else if (!this.escapeTarget) {
                this.escapeTarget = this.findThreat();
            }

            if (this.escapeTarget) {
                this.escapeFromThreat();
            }
            // 如果没有逃避行为，继续其他行为
            else if (!this.combatTarget && !this.lord) {
                // 寻找领主（如果没有在争斗中）
                this.lord = this.findLord();
            }

            // 跟随领主移动
            if (this.lord && !this.combatTarget && !this.escapeTarget && !this.huntTarget) {
                this.followLord();
            }

            // 如果没有逃避、争斗、捕食或跟随，应用鱼群行为
            if (!this.escapeTarget && !this.combatTarget && !this.lord && !this.huntTarget) {
                this.applyFlocking();
            }

            // 更新位置 - 使用实际速度
            this.position.x += this.velocity.x * this.speed;
            this.position.y += this.velocity.y * this.speed;

            // 检测碰撞（包括争斗和捕食）
            this.checkAllCollisions();

            // 边界检测和环绕（而不是反弹）
            if (this.position.x < -this.dna.size) {
                this.position.x = canvas.width + this.dna.size;
            }
            if (this.position.x > canvas.width + this.dna.size) {
                this.position.x = -this.dna.size;
            }
            if (this.position.y < -this.dna.size) {
                this.position.y = canvas.height + this.dna.size;
            }
            if (this.position.y > canvas.height + this.dna.size) {
                this.position.y = -this.dna.size;
            }

            // 随机方向变化（受好奇心影响）
            if (Math.random() < 0.01 * this.dna.curiosity && !this.escapeTarget && !this.huntTarget) {
                this.velocity.x += (Math.random() - 0.5) * 0.5;
                this.velocity.y += (Math.random() - 0.5) * 0.5;
            }

            // 归一化速度（保持恒定速度）
            const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
            if (speed > 0) {
                this.velocity.x = (this.velocity.x / speed);
                this.velocity.y = (this.velocity.y / speed);
            }

            // 年龄增长（不再导致死亡）
            this.age++;

            // 检查是否死亡（只通过争斗或吞噬）
            return this.energy > 0 && this.dna.size > 0.5;
        }

        // 绘制生物
        draw(ctx) {
            // 根据状态决定颜色
            let color = this.dna.color;
            if (this.escapeTarget) {
                // 逃避状态显示为红色
                color = `hsl(0, 70%, 60%)`;
            } else if (this.combatTarget) {
                // 争斗状态显示为橙色
                color = `hsl(30, 70%, 60%)`;
            } else if (this.huntTarget) {
                // 捕食状态显示为深红色
                color = `hsl(0, 90%, 50%)`;
            }

            // 根据社交性决定透明度（社交性高的更不透明）
            const alpha = 0.3 + this.dna.social * 0.7;
            ctx.fillStyle = color.replace(')', `, ${alpha})`).replace('hsl', 'hsla');

            // 绘制鱼形
            if (this.type === 'predator') {
                this.drawShark(ctx, this.position.x, this.position.y, this.dna.size);
            } else {
                this.drawFish(ctx, this.position.x, this.position.y, this.dna.size);
            }

            // 绘制感叹号（如果正在显示）
            if (this.exclamationTimer > 0) {
                this.drawExclamation(ctx);
            }
        }

        // 绘制普通鱼形
        drawFish(ctx, x, y, size) {
            // 确保鱼不会倒着游
            let angle = Math.atan2(this.velocity.y, this.velocity.x);

            // 如果速度几乎为零，使用随机角度
            if (Math.abs(this.velocity.x) < 0.01 && Math.abs(this.velocity.y) < 0.01) {
                angle = Math.random() * Math.PI * 2;
            }

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);

            // 鱼身
            ctx.beginPath();
            ctx.ellipse(0, 0, size, size * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();

            // 鱼尾
            ctx.beginPath();
            ctx.moveTo(-size * 0.8, 0);
            ctx.lineTo(-size * 1.5, -size * 0.5);
            ctx.lineTo(-size * 1.5, size * 0.5);
            ctx.closePath();
            ctx.fill();

            // 鱼眼 - 确保在正确的一侧
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(size * 0.5, -size * 0.2, size * 0.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(size * 0.6, -size * 0.2, size * 0.1, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        // 绘制鲨鱼 - 基于三角形的设计
        drawShark(ctx, x, y, size) {
            // 确保鲨鱼不会倒着游
            let angle = Math.atan2(this.velocity.y, this.velocity.x);

            // 如果速度几乎为零，使用随机角度
            if (Math.abs(this.velocity.x) < 0.01 && Math.abs(this.velocity.y) < 0.01) {
                angle = Math.random() * Math.PI * 2;
            }

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);

            // 鲨鱼身体 - 使用菱形/钻石形状
            ctx.beginPath();
            ctx.moveTo(size * 1.2, 0); // 前端
            ctx.lineTo(0, -size * 0.6); // 上侧
            ctx.lineTo(-size * 1.0, 0); // 后端
            ctx.lineTo(0, size * 0.6); // 下侧
            ctx.closePath();
            ctx.fill();

            // 鲨鱼尾巴 - 三角形
            ctx.beginPath();
            ctx.moveTo(-size * 1.0, 0);
            ctx.lineTo(-size * 1.8, -size * 0.5);
            ctx.lineTo(-size * 1.8, size * 0.5);
            ctx.closePath();
            ctx.fill();

            // 鲨鱼背鳍 - 三角形
            ctx.beginPath();
            ctx.moveTo(size * 0.3, -size * 0.6);
            ctx.lineTo(-size * 0.2, -size * 0.9);
            ctx.lineTo(-size * 0.1, -size * 0.6);
            ctx.closePath();
            ctx.fill();

            // 鲨鱼胸鳍 - 两个小三角形
            ctx.beginPath();
            ctx.moveTo(size * 0.2, size * 0.2);
            ctx.lineTo(-size * 0.2, size * 0.5);
            ctx.lineTo(-size * 0.1, size * 0.2);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(size * 0.2, -size * 0.2);
            ctx.lineTo(-size * 0.2, -size * 0.5);
            ctx.lineTo(-size * 0.1, -size * 0.2);
            ctx.closePath();
            ctx.fill();

            // 鲨鱼眼睛 - 圆形
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(size * 0.8, -size * 0.2, size * 0.15, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(size * 0.85, -size * 0.2, size * 0.08, 0, Math.PI * 2);
            ctx.fill();

            // 鲨鱼嘴巴 - 三角形开口
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(size * 1.0, size * 0.1);
            ctx.lineTo(size * 1.3, 0);
            ctx.lineTo(size * 1.0, -size * 0.1);
            ctx.stroke();

            // 简化的牙齿 - 只画几颗
            ctx.fillStyle = 'white';
            for (let i = 0; i < 3; i++) {
                const toothX = size * 1.05 + i * size * 0.1;
                ctx.beginPath();
                ctx.moveTo(toothX, size * 0.05);
                ctx.lineTo(toothX + size * 0.06, 0);
                ctx.lineTo(toothX, -size * 0.05);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
        }

        // 绘制感叹号
        drawExclamation(ctx) {
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('!', this.position.x, this.position.y - this.dna.size - 10);
        }

        // 繁殖后代
        reproduce() {
            // 只有能量充足且随机概率时繁殖
            if (this.energy > 120 && Math.random() < 0.003 && !this.combatTarget && !this.escapeTarget && !this.huntTarget) {
                this.energy -= 60; // 繁殖消耗能量

                const childDNA = { ...this.dna };
                childDNA.type = this.type; // 继承类型

                // 引入随机变异
                childDNA.baseSpeed *= (0.8 + Math.random() * 0.4);
                childDNA.size *= (0.8 + Math.random() * 0.4);
                childDNA.social += (Math.random() - 0.5) * 0.2;
                childDNA.curiosity += (Math.random() - 0.5) * 0.2;
                childDNA.alignment += (Math.random() - 0.5) * 0.2;
                childDNA.cohesion += (Math.random() - 0.5) * 0.2;
                childDNA.separation += (Math.random() - 0.5) * 0.2;
                childDNA.aggression += (Math.random() - 0.5) * 0.2;

                // 限制在合理范围内
                childDNA.baseSpeed = Math.max(0.5, Math.min(8, childDNA.baseSpeed));
                childDNA.size = Math.max(1, Math.min(15, childDNA.size));
                childDNA.social = Math.max(0, Math.min(1, childDNA.social));
                childDNA.curiosity = Math.max(0, Math.min(1, childDNA.curiosity));
                childDNA.alignment = Math.max(0, Math.min(1, childDNA.alignment));
                childDNA.cohesion = Math.max(0, Math.min(1, childDNA.cohesion));
                childDNA.separation = Math.max(0, Math.min(1, childDNA.separation));
                childDNA.aggression = Math.max(0, Math.min(1, childDNA.aggression));

                // 颜色变异（20%概率）
                if (Math.random() < 0.2) {
                    const currentHue = parseInt(childDNA.color.match(/\d+/)[0]);
                    const newHue = (currentHue + (Math.random() - 0.5) * 30 + 360) % 360;
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

        // =============================================
        // 捕食系统
        // =============================================

        // 寻找猎物（捕食者特有）- 优先捕食最大的鱼
        findPrey() {
            if (this.type !== 'predator') return null;

            let bestPrey = null;
            let largestSize = 0;
            const huntRadius = 250; // 捕食检测半径

            // 限制每帧检查的猎物数量，提高性能
            const maxChecks = Math.min(20, this.allMicrobes.length);
            let checks = 0;

            for (const other of this.allMicrobes) {
                if (other === this || other.type === 'predator' || other.dna.size >= this.dna.size) continue;

                checks++;
                if (checks > maxChecks) break;

                const dx = other.position.x - this.position.x;
                const dy = other.position.y - this.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // 只考虑在捕食半径内的鱼
                if (distance < huntRadius) {
                    // 优先选择最大的鱼
                    if (other.dna.size > largestSize) {
                        bestPrey = other;
                        largestSize = other.dna.size;
                    }
                    // 如果大小相同，选择更近的
                    else if (other.dna.size === largestSize && bestPrey) {
                        const currentDistance = Math.sqrt(
                            Math.pow(bestPrey.position.x - this.position.x, 2) +
                            Math.pow(bestPrey.position.y - this.position.y, 2)
                        );
                        if (distance < currentDistance) {
                            bestPrey = other;
                        }
                    }
                }
            }

            return bestPrey;
        }

        // 优化鲨鱼追逐逻辑
        huntPrey() {
            if (!this.huntTarget) return;

            const dx = this.huntTarget.position.x - this.position.x;
            const dy = this.huntTarget.position.y - this.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // 如果猎物太远或死亡，停止追捕
            if (distance > 300 || this.huntTarget.energy <= 0) {
                this.huntTarget = null;
                this.huntCooldown = 30;
                return;
            }

            // 计算追捕方向
            const huntAngle = Math.atan2(dy, dx);

            // 平滑转向 - 使用转向速率而不是直接设置方向
            const turnRate = 0.1; // 转向速率
            const currentAngle = Math.atan2(this.velocity.y, this.velocity.x);

            // 计算角度差（考虑圆周）
            let angleDiff = huntAngle - currentAngle;
            if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

            // 应用转向
            const newAngle = currentAngle + angleDiff * turnRate;
            this.velocity.x = Math.cos(newAngle);
            this.velocity.y = Math.sin(newAngle);

            // 如果距离很近，稍微减速以避免过度振荡
            if (distance < 50) {
                this.velocity.x *= 0.95;
                this.velocity.y *= 0.95;
            }
        }

        // =============================================
        // 鱼群系统
        // =============================================

        // 应用鱼群行为
        applyFlocking() {
            // 捕食者不参与鱼群
            if (this.type === 'predator') return;

            const neighbors = this.findNeighbors(80); // 寻找邻居
            if (neighbors.length === 0) return;

            // 计算分离、对齐和凝聚的力
            const separation = this.calculateSeparation(neighbors);
            const alignment = this.calculateAlignment(neighbors);
            const cohesion = this.calculateCohesion(neighbors);

            // 应用这些力（根据DNA权重）
            this.velocity.x += separation.x * this.dna.separation * 0.1;
            this.velocity.y += separation.y * this.dna.separation * 0.1;

            this.velocity.x += alignment.x * this.dna.alignment * 0.1;
            this.velocity.y += alignment.y * this.dna.alignment * 0.1;

            this.velocity.x += cohesion.x * this.dna.cohesion * 0.05;
            this.velocity.y += cohesion.y * this.dna.cohesion * 0.05;
        }

        // 寻找邻居
        findNeighbors(radius) {
            const neighbors = [];
            const maxChecks = Math.min(15, this.allMicrobes.length);
            let checks = 0;

            for (const other of this.allMicrobes) {
                if (other === this) continue;

                checks++;
                if (checks > maxChecks) break;

                const dx = other.position.x - this.position.x;
                const dy = other.position.y - this.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < radius) {
                    neighbors.push(other);
                }
            }

            return neighbors;
        }

        // 计算分离力（避免与邻居太近）
        calculateSeparation(neighbors) {
            const force = { x: 0, y: 0 };
            let count = 0;

            for (const other of neighbors) {
                const dx = this.position.x - other.position.x;
                const dy = this.position.y - other.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 0 && distance < 30) {
                    force.x += dx / distance;
                    force.y += dy / distance;
                    count++;
                }
            }

            if (count > 0) {
                force.x /= count;
                force.y /= count;
            }

            return force;
        }

        // 计算对齐力（与邻居平均方向对齐）
        calculateAlignment(neighbors) {
            const force = { x: 0, y: 0 };
            let count = 0;

            for (const other of neighbors) {
                force.x += other.velocity.x;
                force.y += other.velocity.y;
                count++;
            }

            if (count > 0) {
                force.x /= count;
                force.y /= count;

                // 归一化
                const magnitude = Math.sqrt(force.x * force.x + force.y * force.y);
                if (magnitude > 0) {
                    force.x /= magnitude;
                    force.y /= magnitude;
                }
            }

            return force;
        }

        // 计算凝聚力（向邻居平均位置移动）
        calculateCohesion(neighbors) {
            const force = { x: 0, y: 0 };
            let count = 0;

            for (const other of neighbors) {
                force.x += other.position.x;
                force.y += other.position.y;
                count++;
            }

            if (count > 0) {
                force.x /= count;
                force.y /= count;

                // 指向平均位置
                force.x -= this.position.x;
                force.y -= this.position.y;

                // 归一化
                const magnitude = Math.sqrt(force.x * force.x + force.y * force.y);
                if (magnitude > 0) {
                    force.x /= magnitude;
                    force.y /= magnitude;
                }
            }

            return force;
        }

        // =============================================
        // 逃避系统
        // =============================================

        // 寻找威胁（比自己大三倍的生物）
        findThreat() {
            let closestThreat = null;
            let closestDistance = Infinity;
            const threatRadius = 120; // 威胁检测半径

            // 限制每帧检查的威胁数量，提高性能
            const maxChecks = Math.min(10, this.allMicrobes.length);
            let checks = 0;

            for (const other of this.allMicrobes) {
                if (other === this || other.dna.size < this.dna.size * 3) continue;

                checks++;
                if (checks > maxChecks) break;

                const dx = other.position.x - this.position.x;
                const dy = other.position.y - this.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < threatRadius && distance < closestDistance) {
                    closestThreat = other;
                    closestDistance = distance;
                }
            }

            return closestThreat;
        }

        // 逃离威胁
        escapeFromThreat() {
            if (!this.escapeTarget) return;

            const dx = this.position.x - this.escapeTarget.position.x;
            const dy = this.position.y - this.escapeTarget.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // 如果威胁太远，停止逃避
            if (distance > 150) {
                this.escapeTarget = null;
                this.escapeTimer = 0;
                return;
            }

            // 计算逃离方向
            const escapeAngle = Math.atan2(dy, dx);

            // 加速逃离（速度增加50%）
            const escapeSpeed = this.speed * 1.5;
            this.velocity.x = Math.cos(escapeAngle);
            this.velocity.y = Math.sin(escapeAngle);

            // 设置逃避计时器
            this.escapeTimer = 60; // 逃避持续60帧

            // 更新统计数据
            if (this.escapeTimer === 60) { // 只在开始时计数
                window.lifePool.escapeEvents++;
            }
        }

        // =============================================
        // 吞噬系统
        // =============================================

        // 检查碰撞
        checkCollision(other) {
            const dx = this.position.x - other.position.x;
            const dy = this.position.y - other.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // 碰撞距离是两个生物半径之和
            const collisionDistance = this.dna.size + other.dna.size;
            return distance < collisionDistance;
        }

        // 吞噬其他生物
        eat(other) {
            // 捕食者可以吞噬比自己稍大的生物
            const sizeThreshold = this.type === 'predator' ? 1.1 : 1.2;

            if (this.dna.size > other.dna.size * sizeThreshold) { // 大小差异足够大才能吞噬
                // 计算大小增益
                let sizeGain = other.dna.size * 0.3;

                // 如果是鲨鱼，增长速度减半
                if (this.type === 'predator') {
                    sizeGain *= 0.5; // 鲨鱼的大小增长减半
                }

                // 增加自身大小和能量
                this.dna.size += sizeGain;
                this.energy += other.energy * 0.8;

                // 捕食者获得更多能量
                if (this.type === 'predator') {
                    this.energy += 20;
                }

                // 更新统计数据
                window.lifePool.eatEvents++;

                return true; // 吞噬成功
            }
            return false; // 无法吞噬
        }

        // 检测与所有其他生物的碰撞
        checkAllCollisions() {
            // 限制每帧检查的碰撞数量，提高性能
            const maxChecks = Math.min(20, this.allMicrobes.length);
            let checks = 0;

            for (let i = 0; i < this.allMicrobes.length && checks < maxChecks; i++) {
                const other = this.allMicrobes[i];
                if (other === this) continue;

                checks++;

                if (this.checkCollision(other)) {
                    // 尝试吞噬
                    if (this.eat(other)) {
                        // 标记被吞噬的生物为死亡
                        other.energy = -1;
                        // 如果这是捕食者的猎物，清除目标
                        if (this.huntTarget === other) {
                            this.huntTarget = null;
                            this.huntCooldown = 20;
                        }
                    }
                    // 触发争斗（大小相似且不在冷却期）
                    else if (this.canStartCombatWith(other)) {
                        this.startCombat(other);
                        other.startCombat(this);
                    }
                }
            }

            // 更新争斗行为
            if (this.combatTarget) {
                this.updateCombat();
            }
        }

        // =============================================
        // 伴随系统
        // =============================================

        // 寻找领主（附近的大生物）
        findLord() {
            // 捕食者不跟随其他生物
            if (this.type === 'predator') return null;

            let closestLord = null;
            let closestDistance = Infinity;
            const followRadius = 80; // 跟随半径

            // 限制每帧检查的领主数量，提高性能
            const maxChecks = Math.min(10, this.allMicrobes.length);
            let checks = 0;

            for (const other of this.allMicrobes) {
                if (other === this || other.dna.size <= this.dna.size) continue;

                checks++;
                if (checks > maxChecks) break;

                const dx = other.position.x - this.position.x;
                const dy = other.position.y - this.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < followRadius && distance < closestDistance) {
                    closestLord = other;
                    closestDistance = distance;
                }
            }

            return closestLord;
        }

        // 跟随领主移动
        followLord() {
            if (!this.lord) return;

            // 计算在三角形区域内的目标位置
            // 三角形区域在领主后方，角度为60度
            const angle = Math.atan2(this.lord.velocity.y, this.lord.velocity.x);
            const spread = Math.PI / 3; // 60度

            // 如果还没有偏移量，生成一个
            if (this.followOffset.x === 0 && this.followOffset.y === 0) {
                const offsetAngle = angle + Math.PI + (Math.random() - 0.5) * spread;
                const distance = 40 + Math.random() * 20; // 跟随距离
                this.followOffset = {
                    x: Math.cos(offsetAngle) * distance,
                    y: Math.sin(offsetAngle) * distance
                };
            }

            // 计算目标位置
            const targetX = this.lord.position.x + this.followOffset.x;
            const targetY = this.lord.position.y + this.followOffset.y;

            // 向目标位置移动
            const dx = targetX - this.position.x;
            const dy = targetY - this.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 5) {
                this.velocity.x += (dx / distance) * 0.1;
                this.velocity.y += (dy / distance) * 0.1;
            }

            // 检查是否有更大的生物可以跟随
            const biggerLord = this.findLord();
            if (biggerLord && biggerLord.dna.size > this.lord.dna.size) {
                this.lord = biggerLord;
                this.followOffset = { x: 0, y: 0 }; // 重置偏移量
            }
        }

        // =============================================
        // 争斗系统
        // =============================================

        // 判断是否可以开始争斗
        canStartCombatWith(other) {
            if (this.combatCooldown > 0 || other.combatCooldown > 0) return false;
            if (this.combatTarget || other.combatTarget) return false;
            if (this.escapeTarget || other.escapeTarget) return false; // 逃避状态下不争斗
            if (this.huntTarget || other.huntTarget) return false; // 捕食状态下不争斗

            // 大小相似（在20%范围内）
            const sizeRatio = this.dna.size / other.dna.size;
            return sizeRatio > 0.8 && sizeRatio < 1.2;
        }

        // 开始争斗
        startCombat(target) {
            if (this.combatCooldown > 0) return false;

            this.combatTarget = target;
            this.combatCooldown = 30; // 防止立即重复争斗

            // 更新统计数据
            window.lifePool.combatEvents++;

            // 吸引附近好奇心强的生物
            this.attractSpectators();

            return true;
        }

        // 争斗行为
        updateCombat() {
            if (!this.combatTarget) return;

            const target = this.combatTarget;

            // 向目标移动
            const dx = target.position.x - this.position.x;
            const dy = target.position.y - this.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 10) {
                // 向目标移动
                this.velocity.x = (dx / distance);
                this.velocity.y = (dy / distance);
            } else {
                // 发生碰撞
                this.resolveCombatCollision(target);
            }

            // 如果目标死亡，结束争斗
            if (target.energy <= 0) {
                this.combatTarget = null;
                this.energy += 20; // 获胜奖励
            }
        }

        // 处理争斗碰撞
        resolveCombatCollision(target) {
            // 反弹
            this.velocity.x = -this.velocity.x * 0.8;
            this.velocity.y = -this.velocity.y * 0.8;

            // 随机损失大小
            const sizeLoss = 0.1 + Math.random() * 0.4;
            this.dna.size -= sizeLoss;
            target.dna.size -= sizeLoss;

            // 能量损失
            this.energy -= 5;
            target.energy -= 5;

            // 检查是否死亡
            if (this.dna.size <= 1) {
                this.energy = -1;
            }
            if (target.dna.size <= 1) {
                target.energy = -1;
            }
        }

        // =============================================
        // 围观系统
        // =============================================

        // 吸引围观者
        attractSpectators() {
            const attractionRadius = 200; // 吸引范围

            // 限制每帧吸引的围观者数量，提高性能
            const maxAttractions = Math.min(5, this.allMicrobes.length);
            let attractions = 0;

            for (const other of this.allMicrobes) {
                if (other === this || other === this.combatTarget) continue;

                attractions++;
                if (attractions > maxAttractions) break;

                const dx = other.position.x - this.position.x;
                const dy = other.position.y - this.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // 只有好奇心强的生物会被吸引
                if (distance < attractionRadius && other.dna.curiosity > 0.7) {
                    other.showExclamation();

                    // 向争斗地点移动
                    if (distance > 80) {
                        const moveX = (dx / distance) * 0.5;
                        const moveY = (dy / distance) * 0.5;
                        other.velocity.x += moveX * 0.1;
                        other.velocity.y += moveY * 0.1;
                    }
                }
            }
        }

        // 显示感叹号
        showExclamation() {
            this.exclamationTimer = 30; // 显示30帧（约0.5秒）
        }
    }

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
            this.energyPoints = [];  // 所有能量点

            // 统计数据
            this.eatEvents = 0;
            this.combatEvents = 0;
            this.escapeEvents = 0;

            // 性能监控
            this.fps = 0;
            this.frameCount = 0;
            this.lastFpsUpdate = 0;

            // 性能优化
            this.maxMicrobes = 500; // 将最大生物数量提高到500
            this.lastMicrobeCleanup = 0;

            // 初始化
            this.resizeCanvas();
            this.setupEventListeners();
            this.setupUI();

            // 启动动画循环
            this.animate();
        }

        // 调整画布大小以适应窗口
        resizeCanvas() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        // 设置事件监听器
        setupEventListeners() {
            // 窗口大小变化
            window.addEventListener('resize', () => this.resizeCanvas());

            // 点击事件 - 用于捕杀生物
            this.canvas.addEventListener('click', (e) => this.handleClick(e));
        }

        // 设置UI交互
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

        // 处理点击事件 - 捕杀生物并生成能量点
        handleClick(e) {
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            // 查找被点击的生物
            for (let i = this.microbes.length - 1; i >= 0; i--) {
                const microbe = this.microbes[i];
                const dx = clickX - microbe.position.x;
                const dy = clickY - microbe.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // 如果点击在生物范围内
                if (distance < microbe.dna.size) {
                    // 移除生物
                    this.microbes.splice(i, 1);

                    // 创建能量点
                    this.createEnergyPoints(microbe.position.x, microbe.position.y, microbe.energy);
                    break;
                }
            }
        }

        // 创建能量点
        createEnergyPoints(x, y, energy) {
            // 创建3-6个随机大小的能量点
            const count = 3 + Math.floor(Math.random() * 4);
            const energyPerPoint = energy / count;

            for (let i = 0; i < count; i++) {
                // 随机偏移位置
                const offsetX = (Math.random() - 0.5) * 30;
                const offsetY = (Math.random() - 0.5) * 30;

                // 随机能量大小（在基础能量上有所浮动）
                const pointEnergy = energyPerPoint * (0.7 + Math.random() * 0.6);

                this.energyPoints.push(new EnergyPoint(x + offsetX, y + offsetY, pointEnergy));
            }
        }

        // =============================================
        // 添加不同类型生物的方法
        // =============================================

        // 添加普通鱼群
        addSchoolOfFish() {
            const count = Math.min(20, this.maxMicrobes - this.microbes.length);
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;

            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const radius = 50 + Math.random() * 30;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;

                const fishDNA = {
                    type: 'normal',
                    baseSpeed: 2.0, // 统一基础速度
                    size: 2 + Math.random() * 2,
                    social: 0.8 + Math.random() * 0.2,
                    curiosity: 0.3 + Math.random() * 0.3,
                    alignment: 0.7 + Math.random() * 0.3,
                    cohesion: 0.7 + Math.random() * 0.3,
                    separation: 0.5 + Math.random() * 0.3,
                    aggression: 0.2 + Math.random() * 0.3
                };

                this.microbes.push(new Microbe(x, y, fishDNA));
            }
        }

        // 添加鲨鱼 - 一次只添加一条
        addPredators() {
            // 每次只添加一条鲨鱼
            if (this.microbes.length < this.maxMicrobes) {
                // 随机位置，避免总是在中心
                const x = Math.random() * this.canvas.width;
                const y = Math.random() * this.canvas.height;

                const predatorDNA = {
                    type: 'predator',
                    baseSpeed: 2.0, // 统一基础速度
                    size: 6 + Math.random() * 3, // 增加鲨鱼大小
                    social: 0.1 + Math.random() * 0.2,
                    curiosity: 0.5 + Math.random() * 0.3,
                    alignment: 0.2 + Math.random() * 0.2,
                    cohesion: 0.2 + Math.random() * 0.2,
                    separation: 0.6 + Math.random() * 0.3,
                    aggression: 0.9 + Math.random() * 0.1 // 增加攻击性
                };

                this.microbes.push(new Microbe(x, y, predatorDNA));
            }
        }

        // =============================================
        // 动画循环和渲染
        // =============================================

        // 主动画循环
        animate() {
            // 计算FPS
            this.calculateFPS();

            // 完全清空画布（没有拖尾效果）
            this.ctx.fillStyle = '#0a1428';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // 更新和绘制所有能量点
            this.updateEnergyPoints();

            // 更新和绘制所有生物
            this.updateMicrobes();

            // 定期清理死亡生物引用
            if (Date.now() - this.lastMicrobeCleanup > 1000) {
                this.cleanupMicrobeReferences();
                this.lastMicrobeCleanup = Date.now();
            }

            // 更新UI
            this.updateUI();

            // 继续动画循环
            requestAnimationFrame(() => this.animate());
        }

        // 更新所有能量点
        updateEnergyPoints() {
            // 使用filter移除过期的能量点，同时更新存活的能量点
            this.energyPoints = this.energyPoints.filter(energyPoint => {
                const isAlive = energyPoint.update();
                if (isAlive) {
                    energyPoint.draw(this.ctx);
                    // 吸引附近的生物
                    energyPoint.attractMicrobes(this.microbes);
                }
                return isAlive;
            });
        }

        // 更新所有微生物
        updateMicrobes() {
            // 使用filter移除死亡的生物，同时更新存活的生物
            this.microbes = this.microbes.filter(microbe => {
                // 清理死亡生物的引用
                if (microbe.energy <= 0) {
                    return false;
                }

                const isAlive = microbe.update(this.canvas);
                if (isAlive) {
                    microbe.draw(this.ctx);

                    // 处理繁殖（只有不在争斗或逃避中的生物可以繁殖）
                    if (!microbe.combatTarget && !microbe.escapeTarget && !microbe.huntTarget &&
                        this.microbes.length < this.maxMicrobes) {
                        const child = microbe.reproduce();
                        if (child) {
                            this.microbes.push(child);
                        }
                    }
                }
                return isAlive;
            });
        }

        // 清理生物引用（防止内存泄漏）
        cleanupMicrobeReferences() {
            for (const microbe of this.microbes) {
                // 清理无效的领主引用
                if (microbe.lord && (microbe.lord.energy <= 0 || !this.microbes.includes(microbe.lord))) {
                    microbe.lord = null;
                    microbe.followOffset = { x: 0, y: 0 };
                }

                // 清理无效的争斗目标引用
                if (microbe.combatTarget && (microbe.combatTarget.energy <= 0 || !this.microbes.includes(microbe.combatTarget))) {
                    microbe.combatTarget = null;
                }

                // 清理无效的逃避目标引用
                if (microbe.escapeTarget && (microbe.escapeTarget.energy <= 0 || !this.microbes.includes(microbe.escapeTarget))) {
                    microbe.escapeTarget = null;
                    microbe.escapeTimer = 0;
                }

                // 清理无效的捕食目标引用
                if (microbe.huntTarget && (microbe.huntTarget.energy <= 0 || !this.microbes.includes(microbe.huntTarget))) {
                    microbe.huntTarget = null;
                }
            }
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
            document.getElementById('energyCount').textContent = this.energyPoints.length;
            document.getElementById('fps').textContent = this.fps;
            document.getElementById('eatCount').textContent = this.eatEvents;
            document.getElementById('combatCount').textContent = this.combatEvents;
            document.getElementById('escapeCount').textContent = this.escapeEvents;
        }
    }

    // =============================================
    // 应用启动
    // =============================================

    // 当页面加载完成后启动应用
    window.addEventListener('load', () => {
        const lifePool = new LifePool();

        // 将应用实例挂载到window以便调试
        window.lifePool = lifePool;
    });
