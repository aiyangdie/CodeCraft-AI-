// 性能优化和错误处理
'use strict';

// 检查浏览器支持
const isModernBrowser = () => {
    return 'IntersectionObserver' in window && 
           'ResizeObserver' in window && 
           'requestAnimationFrame' in window;
};

// 错误处理
window.addEventListener('error', (e) => {
    console.error('页面错误:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('未处理的Promise拒绝:', e.reason);
});

// 初始化AOS动画库
if (typeof AOS !== 'undefined') {
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        offset: 100,
        disable: 'mobile' // 在移动端禁用AOS以提高性能
    });
}

// 性能监控
const performanceObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
            console.log('页面加载时间:', entry.loadEventEnd - entry.loadEventStart, 'ms');
        }
    }
});

if ('PerformanceObserver' in window) {
    performanceObserver.observe({ entryTypes: ['navigation'] });
}

// 移动端导航菜单切换
function toggleMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        
        // 防止背景滚动
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        
        // 添加动画类
        if (navMenu.classList.contains('active')) {
            navMenu.style.animation = 'slideIn 0.3s ease-out';
        } else {
            navMenu.style.animation = 'slideOut 0.3s ease-in';
        }
    }
}

// 关闭移动端菜单
function closeMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// 平滑滚动功能
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        // 关闭移动端菜单
        closeMobileMenu();
        
        // 计算偏移量（考虑固定导航栏）
        const navbarHeight = document.querySelector('.navbar').offsetHeight;
        const targetPosition = section.offsetTop - navbarHeight;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// 复制提示词功能
async function copyPrompt(element) {
    const promptText = element.querySelector('.prompt-text').textContent;
    
    try {
        // 使用现代浏览器的 Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(promptText);
            showCopyNotification();
            
            // 添加复制成功的视觉反馈
            element.style.transform = 'scale(0.95)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 150);
        } else {
            // 降级方案
            fallbackCopyTextToClipboard(promptText);
        }
    } catch (err) {
        console.error('复制失败:', err);
        fallbackCopyTextToClipboard(promptText);
    }
}

// 降级复制方案
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    textArea.style.pointerEvents = "none";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showCopyNotification();
        } else {
            throw new Error('复制命令执行失败');
        }
    } catch (err) {
        console.error('复制失败:', err);
        showErrorNotification('复制失败，请手动复制');
    } finally {
        document.body.removeChild(textArea);
    }
}

// 显示复制成功通知
function showCopyNotification() {
    const notification = document.getElementById('copy-notification');
    if (notification) {
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    }
}

// 显示错误通知
function showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'copy-notification error';
    notification.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <span>${message}</span>
    `;
    notification.style.background = 'var(--color-error)';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 导航栏滚动效果（使用节流优化）
let scrollTimeout;
function handleNavbarScroll() {
    if (scrollTimeout) return;
    
    scrollTimeout = setTimeout(() => {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.scrollY > 100) {
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                navbar.style.boxShadow = '0 2px 30px rgba(0, 0, 0, 0.15)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            }
        }
        scrollTimeout = null;
    }, 10);
}

// 回到顶部按钮控制
function handleBackToTop() {
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        if (window.scrollY > 300) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    }
}

// 回到顶部功能
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// 使用 Intersection Observer 优化滚动动画
let observer;
function setupScrollAnimations() {
    if (!isModernBrowser()) {
        // 降级方案
        handleScrollAnimations();
        return;
    }
    
    const elements = document.querySelectorAll('.capability-card, .stat-card, .prompt-category, .agent-card');
    
    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    elements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

// 降级滚动动画方案
function handleScrollAnimations() {
    const elements = document.querySelectorAll('.capability-card, .stat-card, .prompt-category, .agent-card');
    
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < window.innerHeight - elementVisible) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
}

// 初始化页面
function initPage() {
    // 初始化导航菜单
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle) {
        navToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // 关闭移动端菜单的点击事件
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-toggle') && !e.target.closest('.nav-menu')) {
            closeMobileMenu();
        }
    });
    
    // 导航链接点击事件
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('href').substring(1);
            scrollToSection(sectionId);
        });
    });
    
    // 按钮点击事件
    const buttons = document.querySelectorAll('.btn[data-section]');
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = button.getAttribute('data-section');
            scrollToSection(sectionId);
            
            // 添加按钮涟漪效果
            const ripple = document.createElement('div');
            ripple.className = 'btn-ripple';
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            button.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // 滚动事件监听
    window.addEventListener('scroll', () => {
        handleNavbarScroll();
        handleBackToTop();
        handleScrollAnimations();
    });
    
    // 回到顶部按钮
    const backToTopBtn = document.querySelector('.back-to-top');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', scrollToTop);
    }
    
    // 滚动指示器点击事件
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            scrollToSection('about');
        });
    }
    
    // 初始化粒子效果
    createParticles();
    
    // 初始化代码打字效果
    initCodeTyping();
    
    // 初始化数字动画
    initNumberAnimations();
    
    // 初始化浮动元素动画
    initFloatingElements();
    
    // 初始化所有模块
    initAllModules();
    
    // 初始化提示词复制功能
    initPrompts();
    
    // 初始化技术项动画
    initTechItems();
    
    // 初始化关于页面统计
    initAboutStats();
    
    // 初始化能力展示
    initCapabilities();
    
    // 初始化智能体展示
    initAgents();
    
    // 初始化案例展示
    initExamples();
    
    // 初始化时间轴动画
    initTimeline();
    
    // 初始化特性网格动画
    initFeaturesGrid();
    
    // 性能优化：使用 Intersection Observer 优化滚动动画
    if ('IntersectionObserver' in window) {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
        
        // 观察所有需要动画的元素
        const animatedElements = document.querySelectorAll('.stat-item, .feature-item, .tech-item, .timeline-item');
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }
}

// 创建粒子效果
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    const particleCount = 50;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 2}px;
            height: ${Math.random() * 4 + 2}px;
            background: rgba(59, 130, 246, ${Math.random() * 0.3 + 0.1});
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: floatParticle ${Math.random() * 10 + 10}s linear infinite;
            animation-delay: ${Math.random() * 5}s;
        `;
        
        particlesContainer.appendChild(particle);
        particles.push(particle);
    }
    
    // 添加粒子浮动动画
    const style = document.createElement('style');
    style.textContent = `
        @keyframes floatParticle {
            0% {
                transform: translateY(0px) translateX(0px);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateY(-100vh) translateX(${Math.random() * 200 - 100}px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// 初始化代码打字效果
function initCodeTyping() {
    const codeLines = document.querySelectorAll('.code-line.typing');
    if (codeLines.length === 0) return;
    
    let currentLine = 0;
    const typeSpeed = 40; // 打字速度（毫秒），原为100
    
    function typeNextLine() {
        if (currentLine >= codeLines.length) {
            // 重新开始
            currentLine = 0;
            setTimeout(typeNextLine, 2000);
            return;
        }
        
        const line = codeLines[currentLine];
        const text = line.innerHTML;
        line.innerHTML = '';
        line.style.opacity = '1';
        
        let charIndex = 0;
        const typeChar = () => {
            if (charIndex < text.length) {
                line.innerHTML += text[charIndex];
                charIndex++;
                setTimeout(typeChar, typeSpeed);
            } else {
                currentLine++;
                setTimeout(typeNextLine, 300);
            }
        };
        
        typeChar();
    }
    
    // 延迟开始打字效果
    setTimeout(typeNextLine, 500);
}

// 初始化数字动画
function initNumberAnimations() {
    const numberElements = document.querySelectorAll('[data-target]');
    
    const animateNumber = (element, target) => {
        const duration = 2000; // 动画持续时间
        const start = 0;
        const increment = target / (duration / 16); // 60fps
        let current = start;
        
        const updateNumber = () => {
            current += increment;
            if (current < target) {
                element.textContent = Math.floor(current);
                requestAnimationFrame(updateNumber);
            } else {
                element.textContent = target;
            }
        };
        
        updateNumber();
    };
    
    // 使用 Intersection Observer 触发动画
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                animateNumber(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    numberElements.forEach(element => {
        observer.observe(element);
    });
}

// 初始化浮动元素动画
function initFloatingElements() {
    const floatElements = document.querySelectorAll('.float-element');
    
    floatElements.forEach((element, index) => {
        // 添加鼠标悬停效果
        element.addEventListener('mouseenter', () => {
            element.style.transform = 'scale(1.2) rotate(10deg)';
            element.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = '';
            element.style.background = '';
        });
        
        // 添加点击效果
        element.addEventListener('click', () => {
            element.style.animation = 'none';
            element.style.transform = 'scale(1.5) rotate(360deg)';
            
            setTimeout(() => {
                element.style.animation = '';
                element.style.transform = '';
            }, 600);
        });
    });
}

// 初始化关于页面统计
function initAboutStats() {
    const aboutStats = document.querySelectorAll('.about-stats .stat-number[data-target]');
    
    const animateAboutNumber = (element, target) => {
        const duration = 2500;
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;
        
        const updateNumber = () => {
            current += increment;
            if (current < target) {
                if (target >= 1000000) {
                    element.textContent = (current / 10000).toFixed(1) + '万+';
                } else if (target >= 1000) {
                    element.textContent = Math.floor(current / 1000) + 'K+';
                } else {
                    element.textContent = Math.floor(current);
                }
                requestAnimationFrame(updateNumber);
            } else {
                if (target >= 1000000) {
                    element.textContent = (target / 10000).toFixed(1) + '万+';
                } else if (target >= 1000) {
                    element.textContent = Math.floor(target / 1000) + 'K+';
                } else {
                    element.textContent = target;
                }
            }
        };
        
        updateNumber();
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                animateAboutNumber(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    aboutStats.forEach(element => {
        observer.observe(element);
    });
}

// 初始化技术项动画
function initTechItems() {
    const techItems = document.querySelectorAll('.tech-item');
    
    techItems.forEach((item, index) => {
        // 添加延迟动画
        item.style.animationDelay = `${index * 0.1}s`;
        
        // 添加鼠标悬停效果
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateY(-5px) scale(1.05)';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.transform = '';
        });
    });
}

// 初始化时间轴动画
function initTimeline() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateX(0)';
            }
        });
    }, { threshold: 0.3 });
    
    timelineItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = index % 2 === 0 ? 'translateX(-50px)' : 'translateX(50px)';
        item.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        item.style.transitionDelay = `${index * 0.2}s`;
        
        observer.observe(item);
    });
}

// 初始化特性网格动画
function initFeaturesGrid() {
    const featureItems = document.querySelectorAll('.feature-item');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    }, { threshold: 0.1 });
    
    featureItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px)';
        item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(item);
    });
}

// 添加键盘快捷键
document.addEventListener('keydown', function(e) {
    // 防止在输入框中触发快捷键
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    
    // Ctrl/Cmd + K 快速滚动到提示词区域
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        scrollToSection('prompts');
    }
    
    // Ctrl/Cmd + H 回到顶部
    if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        scrollToTop();
    }
    
    // Ctrl/Cmd + A 滚动到智能体区域
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        scrollToSection('agents');
    }
    
    // ESC 关闭移动端菜单
    if (e.key === 'Escape') {
        closeMobileMenu();
    }
});

// 添加页面可见性API支持
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        document.title = '👋 记得回来看看我！ - AI智能助手';
    } else {
        document.title = 'AI智能助手 - 你的智能编程伙伴';
    }
});

// 添加智能体卡片点击效果（移除重复绑定）
document.addEventListener('DOMContentLoaded', function() {
    // 防止重复执行
    if (window.agentEffectsInitialized) return;
    window.agentEffectsInitialized = true;
    
    // 添加智能体波纹动画CSS
    if (!document.getElementById('agent-ripple-styles')) {
        const agentRippleStyle = document.createElement('style');
        agentRippleStyle.id = 'agent-ripple-styles';
        agentRippleStyle.textContent = `
            @keyframes agent-ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(agentRippleStyle);
    }
    
    // 使用事件委托处理智能体卡片点击
    document.addEventListener('click', function(e) {
        if (e.target.closest('.agent-card')) {
            const card = e.target.closest('.agent-card');
            
            // 添加点击波纹效果
            const ripple = document.createElement('div');
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(102, 126, 234, 0.3);
                transform: scale(0);
                animation: agent-ripple 0.6s linear;
                pointer-events: none;
                width: 100px;
                height: 100px;
                top: 50%;
                left: 50%;
                margin-top: -50px;
                margin-left: -50px;
            `;
            
            card.appendChild(ripple);
            
            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.remove();
                }
            }, 600);
        }
    });
});

// 添加减少动画的CSS
const reduceMotionStyle = document.createElement('style');
reduceMotionStyle.textContent = `
    .reduce-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
`;
document.head.appendChild(reduceMotionStyle);

// 成功案例交互效果
function initExamples() {
    const exampleCards = document.querySelectorAll('.example-card');
    
    exampleCards.forEach(card => {
        // 添加点击效果
        card.addEventListener('click', function() {
            // 添加点击动画
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            // 可以在这里添加更多交互，比如显示详情弹窗
            console.log('点击了案例:', this.querySelector('h3').textContent);
        });
        
        // 添加键盘导航支持
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
        
        // 设置tabindex使其可聚焦
        card.setAttribute('tabindex', '0');
        
        // 添加焦点样式
        card.addEventListener('focus', function() {
            this.style.outline = '2px solid var(--color-primary)';
            this.style.outlineOffset = '2px';
        });
        
        card.addEventListener('blur', function() {
            this.style.outline = 'none';
        });
    });
    
    // 数字动画效果
    const statNumbers = document.querySelectorAll('.example-stat-number');
    
    const animateNumber = (element, target) => {
        const duration = 2000;
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            // 处理特殊格式的数字
            if (typeof target === 'string' && target.includes('%')) {
                element.textContent = Math.floor(current) + '%';
            } else if (typeof target === 'string' && target.includes('+')) {
                element.textContent = Math.floor(current) + '+';
            } else if (typeof target === 'string' && target.includes('★')) {
                element.textContent = current.toFixed(1) + '★';
            } else if (typeof target === 'string' && target.includes('万')) {
                element.textContent = Math.floor(current) + '万+';
            } else if (typeof target === 'string') {
                element.textContent = target; // 保持原文本
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    };
    
    // 使用Intersection Observer触发数字动画
    const numberObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const numberElement = entry.target;
                const targetText = numberElement.textContent;
                
                // 解析数字
                let targetNumber = 0;
                if (targetText.includes('%')) {
                    targetNumber = parseInt(targetText);
                } else if (targetText.includes('+')) {
                    targetNumber = parseInt(targetText);
                } else if (targetText.includes('万')) {
                    targetNumber = parseInt(targetText);
                } else if (targetText.includes('★')) {
                    targetNumber = parseFloat(targetText);
                } else if (!isNaN(targetText)) {
                    targetNumber = parseInt(targetText);
                }
                
                if (targetNumber > 0) {
                    numberElement.textContent = '0';
                    animateNumber(numberElement, targetText);
                }
                
                numberObserver.unobserve(numberElement);
            }
        });
    }, {
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px'
    });
    
    statNumbers.forEach(number => {
        numberObserver.observe(number);
    });
}

// 初始化所有模块的交互效果
function initAllModules() {
    initExamples();
    initAboutStats();
    initCapabilities();
    initAgents();
    initPrompts();
}

// 能力展示模块交互
function initCapabilities() {
    const capabilityCards = document.querySelectorAll('.capability-card');
    
    capabilityCards.forEach(card => {
        // 添加点击效果
        card.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            console.log('点击了能力:', this.querySelector('h3').textContent);
        });
        
        // 添加键盘导航支持
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
        
        card.setAttribute('tabindex', '0');
        
        // 添加焦点样式
        card.addEventListener('focus', function() {
            this.style.outline = '2px solid var(--color-primary)';
            this.style.outlineOffset = '2px';
        });
        
        card.addEventListener('blur', function() {
            this.style.outline = 'none';
        });
    });
}

// 智能体模块交互
function initAgents() {
    const agentCards = document.querySelectorAll('.agent-card');
    
    agentCards.forEach(card => {
        // 添加点击效果
        card.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            console.log('点击了智能体:', this.querySelector('h3').textContent);
        });
        
        // 添加键盘导航支持
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
        
        card.setAttribute('tabindex', '0');
        
        // 添加焦点样式
        card.addEventListener('focus', function() {
            this.style.outline = '2px solid var(--color-secondary)';
            this.style.outlineOffset = '2px';
        });
        
        card.addEventListener('blur', function() {
            this.style.outline = 'none';
        });
    });
}

// 提示词模块交互优化
function initPrompts() {
    const promptItems = document.querySelectorAll('.prompt-item[data-action="copy"]');
    
    promptItems.forEach(item => {
        // 添加复制成功动画
        item.addEventListener('click', function() {
            copyPrompt(this);
            
            // 添加复制成功动画
            this.classList.add('copied');
            setTimeout(() => {
                this.classList.remove('copied');
            }, 1000);
        });
        
        // 键盘支持
        item.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
        
        item.setAttribute('tabindex', '0');
    });
    
    // 提示词分类卡片交互
    const promptCategories = document.querySelectorAll('.prompt-category');
    
    promptCategories.forEach(category => {
        category.addEventListener('click', function() {
            console.log('点击了提示词分类:', this.querySelector('h3').textContent);
        });
        
        category.setAttribute('tabindex', '0');
        
        category.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initPage);

// 添加一些额外的交互效果
document.addEventListener('DOMContentLoaded', function() {
    // 防止重复执行
    if (window.effectsInitialized) return;
    window.effectsInitialized = true;
    
    // 添加打字机效果到代码动画
    const codeLines = document.querySelectorAll('.code-line');
    codeLines.forEach((line, index) => {
        const text = line.textContent;
        line.textContent = '';
        line.style.opacity = '1';
        
        setTimeout(() => {
            let i = 0;
            const typeWriter = () => {
                if (i < text.length) {
                    line.textContent += text.charAt(i);
                    i++;
                    setTimeout(typeWriter, 100);
                }
            };
            typeWriter();
        }, index * 800);
    });
    
    // 添加数字计数动画
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const target = stat.textContent;
        const isInfinity = target === '∞';
        
        if (!isInfinity) {
            const targetNum = parseInt(target);
            let current = 0;
            const increment = targetNum / 50;
            
            const updateCounter = () => {
                if (current < targetNum) {
                    current += increment;
                    stat.textContent = Math.floor(current) + (target.includes('+') ? '+' : '');
                    requestAnimationFrame(updateCounter);
                } else {
                    stat.textContent = target;
                }
            };
            
            // 当元素进入视口时开始动画
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        updateCounter();
                        observer.unobserve(entry.target);
                    }
                });
            });
            
            observer.observe(stat);
        }
    });
    
    // 添加鼠标跟随效果（性能优化版本）
    let cursorTrail = [];
    const maxTrailLength = 5; // 减少粒子数量
    let isMouseMoving = false;
    let mouseMoveTimeout;
    
    document.addEventListener('mousemove', function(e) {
        if (!isMouseMoving) {
            isMouseMoving = true;
        }
        
        clearTimeout(mouseMoveTimeout);
        mouseMoveTimeout = setTimeout(() => {
            isMouseMoving = false;
        }, 100);
        
        if (isMouseMoving && cursorTrail.length < maxTrailLength) {
            const cursor = document.createElement('div');
            cursor.className = 'custom-cursor';
            cursor.style.cssText = `
                position: fixed;
                width: 6px;
                height: 6px;
                background: rgba(102, 126, 234, 0.4);
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
                left: ${e.clientX - 3}px;
                top: ${e.clientY - 3}px;
                transition: all 0.2s ease;
            `;
            
            document.body.appendChild(cursor);
            cursorTrail.push(cursor);
            
            setTimeout(() => {
                if (cursor.parentNode) {
                    cursor.remove();
                }
                cursorTrail = cursorTrail.filter(c => c !== cursor);
            }, 200);
        }
    });
    
    // 页面卸载时清理
    window.addEventListener('beforeunload', function() {
        cursorTrail.forEach(cursor => {
            if (cursor.parentNode) {
                cursor.remove();
            }
        });
        cursorTrail = [];
    });
    
    // 添加粒子效果（性能优化版本）
    if (window.innerWidth > 768) { // 只在桌面端显示粒子
        createParticles();
    }
});

// 刷新logo点击事件
const navLogo = document.getElementById('nav-logo');
if (navLogo) {
    navLogo.addEventListener('click', function() {
        window.location.reload();
    });
} 