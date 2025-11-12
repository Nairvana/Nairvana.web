// html/lan-detector.js

// 局域网IP范围配置 - 根据您的网络调整
const LAN_RANGES = [
    { start: '10.111.0.0', end: '10.111.255.255' }, // 您的特定局域网
];

// 检测用户是否在局域网内
async function checkLanAccess() {
    try {
        // 获取用户IP
        const userIP = await getUserIP();
        
        // 检查是否在局域网范围内
        const isInLan = isIPInLanRange(userIP);
        
        // 保存检测结果到sessionStorage
        sessionStorage.setItem('isLanUser', isInLan);
        sessionStorage.setItem('userIP', userIP);
        
        return isInLan;
    } catch (error) {
        console.error('局域网检测失败:', error);
        // 如果检测失败，默认按非局域网处理
        sessionStorage.setItem('isLanUser', 'false');
        return false;
    }
}

// 获取用户IP地址
function getUserIP() {
    return new Promise((resolve, reject) => {
        // 尝试使用多个IP查询服务
        const services = [
            'https://api.ipify.org?format=json',
            'https://api64.ipify.org?format=json'
        ];
        
        let currentService = 0;
        
        function tryNextService() {
            if (currentService >= services.length) {
                reject(new Error('所有IP查询服务都失败了'));
                return;
            }
            
            fetch(services[currentService])
                .then(response => response.json())
                .then(data => {
                    const ip = data.ip;
                    if (ip) {
                        resolve(ip);
                    } else {
                        currentService++;
                        tryNextService();
                    }
                })
                .catch(() => {
                    currentService++;
                    tryNextService();
                });
        }
        
        tryNextService();
    });
}

// 检查IP是否在局域网范围内
function isIPInLanRange(ip) {
    // 将IP转换为数值
    function ipToNumber(ip) {
        return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
    }
    
    const ipNum = ipToNumber(ip);
    
    // 检查是否在任何一个局域网范围内
    return LAN_RANGES.some(range => {
        const startNum = ipToNumber(range.start);
        const endNum = ipToNumber(range.end);
        return ipNum >= startNum && ipNum <= endNum;
    });
}

// 初始化检测并设置页面行为
function initLanAccessControl() {
    // 检查是否已经检测过
    const isLanUser = sessionStorage.getItem('isLanUser');
    
    if (isLanUser === null) {
        // 首次访问，进行检测
        checkLanAccess().then(isLan => {
            applyAccessControl(isLan);
        });
    } else {
        // 使用之前的结果
        applyAccessControl(isLanUser === 'true');
    }
}

// 根据检测结果应用访问控制
function applyAccessControl(isLanUser) {
    if (!isLanUser) {
        // 非局域网用户
        
        // 1. 显示警告提示
        showWarningMessage();
        
        // 2. 拦截页面跳转
        interceptNavigation();
        
        // 3. 隐藏或禁用受限内容
        hideRestrictedContent();
        
        // 4. 如果是其他页面，重定向到首页
        redirectToHomeIfNeeded();
    } else {
        // 局域网用户 - 允许所有操作
        enableAllFeatures();
    }
}

// 显示警告信息
function showWarningMessage() {
    // 创建警告横幅
    const warningBanner = document.createElement('div');
    warningBanner.id = 'lan-warning-banner';
    warningBanner.innerHTML = `
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; 
                    padding: 15px; margin: 10px; text-align: center; color: #856404;">
            <strong>⚠️ 访问受限提示</strong>
            <p>您当前不在可访问的局域网内，部分功能将受到限制。如需完整访问，请连接到正确的局域网环境。</p >
        </div>
    `;
    
    // 插入到页面顶部
    document.body.insertBefore(warningBanner, document.body.firstChild);
}

// 拦截页面跳转
function interceptNavigation() {
    // 拦截所有内部链接点击
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && isInternalLink(link.href)) {
            e.preventDefault();
            alert('您不在可访问的局域网内，无法访问此页面。');
        }
    });
    
    // 拦截浏览器前进后退
    window.addEventListener('popstate', function() {
        if (sessionStorage.getItem('isLanUser') !== 'true') {
            history.replaceState(null, '', window.location.origin + window.location.pathname);
        }
    });
}

// 判断是否为内部链接
function isInternalLink(url) {
    // 排除首页
    const currentOrigin = window.location.origin;
    const currentPath = window.location.pathname;
    
    // 首页URL
    const homeUrls = [
        currentOrigin + '/',
        currentOrigin + '/index.html',
        currentOrigin + currentPath.replace(/[^\/]*$/, '') // 当前目录的根
    ];
    
    if (homeUrls.includes(url) || url.endsWith('/')) {
        return false;
    }
    
    // 判断是否为同域链接
    try {
        const urlObj = new URL(url, window.location.origin);
        return urlObj.origin === window.location.origin && 
               !homeUrls.includes(urlObj.href) &&
               urlObj.pathname !== '/index.html';
    } catch (e) {
        return false;
    }
}

// 隐藏或禁用受限内容
function hideRestrictedContent() {
    // 查找所有标记为受限的内容
    const restrictedElements = document.querySelectorAll('[data-lan-only]');
    restrictedElements.forEach(el => {
        el.style.display = 'none';
    });
    
    // 禁用受限的表单元素
    const restrictedInputs = document.querySelectorAll('input[data-lan-only], button[data-lan-only]');
    restrictedInputs.forEach(input => {
        input.disabled = true;
        input.title = '此功能需要局域网访问权限';
    });
}

// 如果需要，重定向到首页
function redirectToHomeIfNeeded() {
    // 如果不是首页，重定向到首页
    const currentPath = window.location.pathname;
    if (currentPath !== '/' && !currentPath.endsWith('/index.html')) {
        // 添加一个小延迟，让用户看到警告信息
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    }
}

// 为局域网用户启用所有功能
function enableAllFeatures() {
    // 移除任何可能存在的警告
    const warningBanner = document.getElementById('lan-warning-banner');
    if (warningBanner) {
        warningBanner.remove();
    }
    
    // 启用所有受限内容
    const restrictedElements = document.querySelectorAll('[data-lan-only]');
    restrictedElements.forEach(el => {
        el.style.display = '';
    });
    
    const restrictedInputs = document.querySelectorAll('input[data-lan-only], button[data-lan-only]');
    restrictedInputs.forEach(input => {
        input.disabled = false;
        input.title = '';
    });
}

// 导出函数供全局使用
window.LanAccessControl = {
    init: initLanAccessControl,
    recheck: checkLanAccess,
    isLanUser: () => sessionStorage.getItem('isLanUser') === 'true'
};