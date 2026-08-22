// VibeWeb Studio - Advanced Interactions & Effects
// Optimized version without code duplication

'use strict';

// ============================================
// UTILITY FUNCTIONS
// ============================================

function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        if (!timeout) {
            func(...args);
            timeout = setTimeout(() => {
                timeout = null;
            }, wait);
        }
    };
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// ============================================
// THEME TOGGLE
// ============================================

const ThemeManager = {
    init() {
        this.themeToggle = document.getElementById('themeToggle');
        this.body = document.body;
        
        // Check saved theme
        const savedTheme = localStorage.getItem('theme') || 'dark';
        if (savedTheme === 'light') {
            this.body.classList.add('light-theme');
        }
        
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggle());
        }
    },
    
    toggle() {
        this.body.classList.toggle('light-theme');
        const theme = this.body.classList.contains('light-theme') ? 'light' : 'dark';
        localStorage.setItem('theme', theme);
    }
};

// ============================================
// 3D CANVAS BACKGROUND
// ============================================

const CanvasManager = {
    init() {
        // ВІДКЛЮЧЕНО на mobile для production
        if (window.innerWidth < 768) return;
        
        this.canvas = document.getElementById('canvas3d');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d', { 
            alpha: true,
            desynchronized: true,
            willReadFrequently: false
        });
        this.particles = [];
        this.particleCount = 30; // Тільки для desktop
        this.animationId = null;
        
        this.setupCanvas();
        this.createParticles();
        this.animate();
        
        // Cleanup на resize
        window.addEventListener('resize', debounce(() => {
            if (window.innerWidth < 768) {
                this.destroy();
                if (this.canvas) this.canvas.style.display = 'none';
            } else {
                this.setupCanvas();
            }
        }, 200));
        
        // КРИТИЧНО: Cleanup при page leave
        window.addEventListener('beforeunload', () => {
            this.destroy();
        });
        
        // КРИТИЧНО: Cleanup при visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.destroy();
            }
        });
    },
    
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },
    
    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new Particle(this.canvas));
        }
    },
    
    animate() {
        // Перевірка чи не destroyed
        if (!this.canvas || !this.ctx) return;
        
        const isLight = document.body.classList.contains('light-theme');
        this.ctx.fillStyle = isLight 
            ? 'rgba(255, 255, 255, 0.15)' 
            : 'rgba(10, 10, 10, 0.15)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            particle.update();
            particle.draw(this.ctx, this.particles);
        });
        
        this.animationId = requestAnimationFrame(() => this.animate());
    },
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
};

class Particle {
    constructor(canvas) {
        this.canvas = canvas;
        this.reset();
    }
    
    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height;
        this.z = Math.random() * 1500;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        this.vz = Math.random() * 3 + 1;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.z -= this.vz;
        
        if (this.z < 1) {
            this.reset();
            this.z = 1500;
        }
        
        if (this.x < 0 || this.x > this.canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > this.canvas.height) this.vy *= -1;
    }
    
    draw(ctx, particles) {
        const scale = 1500 / (1500 + this.z);
        const x2d = (this.x - this.canvas.width / 2) * scale + this.canvas.width / 2;
        const y2d = (this.y - this.canvas.height / 2) * scale + this.canvas.height / 2;
        const size = scale * 4;
        const opacity = (1 - this.z / 1500) * 0.8;
        
        const gradient = ctx.createRadialGradient(x2d, y2d, 0, x2d, y2d, size * 2);
        gradient.addColorStop(0, `rgba(0, 212, 255, ${opacity})`);
        gradient.addColorStop(0.5, `rgba(123, 47, 247, ${opacity * 0.7})`);
        gradient.addColorStop(1, `rgba(123, 47, 247, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Connect nearby particles
        particles.forEach(other => {
            if (other === this) return;
            const otherScale = 1500 / (1500 + other.z);
            const otherX = (other.x - this.canvas.width / 2) * otherScale + this.canvas.width / 2;
            const otherY = (other.y - this.canvas.height / 2) * otherScale + this.canvas.height / 2;
            
            const distance = Math.hypot(x2d - otherX, y2d - otherY);
            if (distance < 150) {
                const lineOpacity = ((1 - distance / 150) * opacity * 0.3);
                ctx.strokeStyle = `rgba(123, 47, 247, ${lineOpacity})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x2d, y2d);
                ctx.lineTo(otherX, otherY);
                ctx.stroke();
            }
        });
    }
}

// ============================================
// 3D TILT EFFECTS
// ============================================

const TiltManager = {
    init() {
        // Ініціалізація в правильному порядку
        this.initMobileTapCards(); // Спочатку mobile
        this.initTiltCards();
        this.initServiceCards();
    },
    
    initTiltCards() {
        if (window.innerWidth < 768) return; // ВИМКНЕНО на мобільних для performance
        const tiltCards = document.querySelectorAll('[data-tilt]');
        tiltCards.forEach(card => this.addTiltEffect(card, 8, 12));
    },
    
    initServiceCards() {
        if (window.innerWidth < 768) return; // ВИМКНЕНО на мобільних для performance
        const serviceCards = document.querySelectorAll('.service-card');
        serviceCards.forEach(card => this.addTiltEffect(card, 5, 5));
    },
    
    addTiltEffect(element, rotationStrength, translateZ) {
        let bounds;
        
        const throttledMove = throttle((e) => {
            if (!bounds) bounds = element.getBoundingClientRect();
            
            const x = e.clientX - bounds.left;
            const y = e.clientY - bounds.top;
            const centerX = bounds.width / 2;
            const centerY = bounds.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * rotationStrength;
            const rotateY = ((centerX - x) / centerX) * rotationStrength;
            
            element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`;
        }, 16); // Throttle до 60fps
        
        element.addEventListener('mouseenter', () => {
            bounds = element.getBoundingClientRect();
        });
        
        element.addEventListener('mousemove', throttledMove);
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
            bounds = null;
        });
    },
    
    initMobileTapCards() {
        if (window.innerWidth >= 768) return;
        
        const serviceCards = document.querySelectorAll('.service-card');
        
        serviceCards.forEach(card => {
            // Touch/click handler
            card.addEventListener('click', function(e) {
                // Якщо клік на кнопку "Детальніше" - не обробляємо
                if (e.target.closest('.service-cta-primary')) {
                    return;
                }
                
                e.preventDefault();
                e.stopPropagation();
                
                // Toggle tapped state
                const wasTapped = this.classList.contains('tapped');
                
                // Закрити всі інші картки
                serviceCards.forEach(c => {
                    if (c !== this) c.classList.remove('tapped');
                });
                
                // Toggle поточну
                if (!wasTapped) {
                    this.classList.add('tapped');
                } else {
                    this.classList.remove('tapped');
                }
            });
        });
        
        // Закрити картки при кліку поза ними
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.service-card')) {
                serviceCards.forEach(c => c.classList.remove('tapped'));
            }
        });
        
        // Touch feedback
        serviceCards.forEach(card => {
            card.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.98)';
            }, { passive: true });
            
            card.addEventListener('touchend', function() {
                this.style.transform = '';
            }, { passive: true });
        });
    }
};

// ============================================
// MODAL FUNCTIONALITY
// ============================================

const ModalManager = {
    init() {
        this.modals = document.querySelectorAll('.modal');
        this.setupModalTriggers();
        this.setupCloseButtons();
        this.setupEscapeKey();
    },
    
    setupModalTriggers() {
        // Кнопки з service-card-back
        const serviceButtons = document.querySelectorAll('.service-cta-primary');
        serviceButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const serviceType = btn.getAttribute('data-service');
                if (serviceType) {
                    this.openModal(serviceType);
                }
            });
        });
    },
    
    setupCloseButtons() {
        const modalCloses = document.querySelectorAll('.modal-close, .modal-close-btn');
        modalCloses.forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                const modal = closeBtn.closest('.modal');
                this.closeModal(modal);
            });
        });
        
        const modalOverlays = document.querySelectorAll('.modal-overlay');
        modalOverlays.forEach(overlay => {
            overlay.addEventListener('click', () => {
                const modal = overlay.closest('.modal');
                this.closeModal(modal);
            });
        });
    },
    
    setupEscapeKey() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.modals.forEach(modal => {
                    if (modal.classList.contains('active')) {
                        this.closeModal(modal);
                    }
                });
            }
        });
    },
    
    openModal(serviceType) {
        const modal = document.getElementById(`modal-${serviceType}`);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },
    
    closeModal(modal) {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
};

// ============================================
// SERVICE PANEL (NEW SLIDE-IN)
// ============================================

const ServicePanelManager = {
    services: {
        'qr-menu': {
            title: 'Меню по QR-коду',
            price: 'Від 2 000 грн',
            icon: `<svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <rect x="15" y="15" width="30" height="30" rx="4" stroke="url(#panel-sg1)" stroke-width="2"/>
                <path d="M25 25H35M25 30H32" stroke="url(#panel-sg1)" stroke-width="2" stroke-linecap="round"/>
                <circle cx="27" cy="37" r="2" fill="url(#panel-sg1)"/>
                <defs><linearGradient id="panel-sg1" x1="15" y1="15" x2="45" y2="45"><stop offset="0%" stop-color="#00D4FF"/><stop offset="100%" stop-color="#7B2FF7"/></linearGradient></defs>
            </svg>`,
            goals: [
                'Економія бюджету на друк паперових меню',
                'Миттєве оновлення цін та позицій без витрат',
                'Збільшення середнього чека через візуальну подачу страв',
                'Збір відгуків клієнтів безпосередньо через меню',
                'Детальна аналітика популярності страв та категорій'
            ],
            includes: [
                'Унікальний дизайн цифрового меню',
                'Адаптивна верстка для всіх мобільних пристроїв',
                'Генерація QR-кодів для кожного столика',
                'Адміністративна панель для самостійного редагування',
                'Інтеграція фотографій страв високої якості',
                'Система категорій та фільтрів',
                'Хостинг на 1 рік',
                'Інструкція користувача'
            ],
            tech: ['HTML5', 'CSS3', 'JavaScript', 'Responsive Design', 'QR API'],
            timeline: '3-5 робочих днів'
        },
        'landing': {
            title: 'Landing Page',
            price: 'Від 4 990 грн',
            icon: `<svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <rect x="10" y="10" width="40" height="40" rx="4" stroke="url(#panel-sg2)" stroke-width="2"/>
                <path d="M20 25H40M20 30H35M20 35H30" stroke="url(#panel-sg2)" stroke-width="2" stroke-linecap="round"/>
                <defs><linearGradient id="panel-sg2" x1="10" y1="10" x2="50" y2="50"><stop offset="0%" stop-color="#7B2FF7"/><stop offset="100%" stop-color="#FF6B9D"/></linearGradient></defs>
            </svg>`,
            goals: [
                'Підвищення конверсії заявок до 40%',
                'Автоматизація збору лідів 24/7 без менеджерів',
                'Швидкий запуск рекламних кампаній в Google Ads та Meta',
                'Органічне залучення клієнтів через SEO-оптимізацію',
                'Детальна аналітика поведінки кожного відвідувача'
            ],
            includes: [
                'Унікальний дизайн-макет у Figma з 2-3 варіантами',
                'Повна адаптація під Mobile, Tablet, Desktop',
                'Професійні анімації та мікроінтеракції',
                'Інтеграція форм зворотного зв\'язку з валідацією',
                'Підключення Google Analytics 4 та Facebook Pixel',
                'Технічне SEO: meta-теги, Open Graph, структурована розмітка',
                'Хостинг на 1 рік',
                'Навчання роботі з адмін-панеллю'
            ],
            tech: ['React/Vue.js', 'GSAP Animations', 'Google Analytics', 'Facebook Pixel', 'SEO'],
            timeline: '7-10 робочих днів'
        },
        'business': {
            title: 'Бізнес-сайт',
            price: 'Від 9 990 грн',
            icon: `<svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <rect x="15" y="15" width="30" height="30" rx="3" stroke="url(#panel-sg3)" stroke-width="2"/>
                <path d="M23 23H37M23 28H37M23 33H33" stroke="url(#panel-sg3)" stroke-width="2" stroke-linecap="round"/>
                <defs><linearGradient id="panel-sg3" x1="15" y1="15" x2="45" y2="45"><stop offset="0%" stop-color="#FF6B9D"/><stop offset="100%" stop-color="#00D4FF"/></linearGradient></defs>
            </svg>`,
            goals: [
                'Формування професійного іміджу та репутації компанії',
                'Залучення органічного трафіку через пошукові системи',
                'Комплексний захист від хакерських атак та DDoS',
                'Максимальна швидкість завантаження (100/100 в PageSpeed)',
                'Масштабування бізнесу через онлайн-присутність'
            ],
            includes: [
                'Розробка до 10 унікальних сторінок з індивідуальним дизайном',
                'Функціональний блог, портфоліо та галерея',
                'Адміністративна панель на базі CMS (WordPress/Custom)',
                'Комплексне SEO: оптимізація всіх сторінок, sitemap.xml',
                'Інтеграція Google Maps та контактних форм',
                'Базові налаштування безпеки',
                'Хостинг преміум-класу на 1 рік',
                'Повна документація проєкту'
            ],
            tech: ['WordPress/Custom CMS', 'PHP', 'MySQL', 'SEO Tools', 'Security Suite'],
            timeline: '14-21 робочий день'
        },
        'ecommerce': {
            title: 'Інтернет-магазин',
            price: 'Від 15 999 грн',
            icon: `<svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <path d="M20 35L30 25L40 35M30 40V25" stroke="url(#panel-sg4)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <rect x="12" y="12" width="36" height="36" rx="4" stroke="url(#panel-sg4)" stroke-width="2"/>
                <defs><linearGradient id="panel-sg4" x1="12" y1="12" x2="48" y2="48"><stop offset="0%" stop-color="#00D4FF"/><stop offset="100%" stop-color="#7B2FF7"/></linearGradient></defs>
            </svg>`,
            goals: [
                'Автоматизація продажів 24/7 без вихідних',
                'Збільшення обороту до 200% через онлайн-канал',
                'Розширення географії клієнтів по всій Україні та за кордоном',
                'Аналітика продажів у реальному часі з детальними звітами',
                'Програми лояльності для стимулювання повторних покупок'
            ],
            includes: [
                'Повнофункціональний каталог з категоріями та підкатегоріями',
                'Кошик з можливістю швидкого оформлення замовлення',
                'Інтеграція платіжних систем: LiqPay, WayForPay, Portmone',
                'Інтеграція Нової Пошти: розрахунок доставки та ТТН',
                'Система відгуків, рейтингів, розширених фільтрів та пошуку',
                'Особистий кабінет клієнта з історією замовлень',
                'Адміністративна панель з імпортом/експортом товарів (Excel)',
                'Система знижок, промокодів та акційних пропозицій',
                'Хостинг на 1 рік з розширеними ресурсами',
                'Повна документація та інструкція з керування магазином'
            ],
            tech: ['WooCommerce/Custom', 'Payment Gateway API', 'Nova Poshta API', 'Analytics'],
            timeline: '21-30 робочих днів'
        },
        'nfc': {
            title: 'NFC картки',
            price: 'Від 450 грн',
            icon: `<svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <rect x="18" y="10" width="24" height="40" rx="3" stroke="url(#panel-sg5)" stroke-width="2"/>
                <circle cx="30" cy="30" r="8" stroke="url(#panel-sg5)" stroke-width="2"/>
                <path d="M30 26V30L32 32" stroke="url(#panel-sg5)" stroke-width="2" stroke-linecap="round"/>
                <defs><linearGradient id="panel-sg5" x1="18" y1="10" x2="42" y2="50"><stop offset="0%" stop-color="#FF6B9D"/><stop offset="100%" stop-color="#7B2FF7"/></linearGradient></defs>
            </svg>`,
            goals: [
                'Створення WOW-ефекту при знайомстві з клієнтами',
                'Автоматизація збору відгуків на Google одним дотиком',
                'Органічне зростання рейтингу компанії',
                'Екологічність: відмова від паперових візиток',
                'Детальна статистика переглядів та взаємодій'
            ],
            includes: [
                'NFC-картка преміум-якості з чіпом високої частоти',
                'Розробка дизайну картки (2 варіанти на вибір)',
                'Створення особистої цифрової сторінки-профілю',
                'Налаштування прямих посилань на Google Reviews',
                'Додавання всіх соціальних мереж та контактів',
                'Резервний QR-код для пристроїв без NFC',
                'Програмування NFC-чіпа під ваші потреби',
                'Можливість самостійно редагувати дані профілю',
                'Панель аналітики з статистикою переглядів'
            ],
            tech: ['NFC Technology', 'Digital Profile', 'QR Code', 'Analytics Dashboard'],
            timeline: '3-5 робочих днів'
        },
        'ddos': {
            title: 'DDoS-захист',
            price: 'Від 2 500 грн',
            icon: `<svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <circle cx="30" cy="30" r="18" stroke="url(#panel-sg6)" stroke-width="2"/>
                <path d="M30 20V30M30 30L35 35M30 30L25 35" stroke="url(#panel-sg6)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M22 15C22 15 18 20 18 25C18 30 22 35 22 35" stroke="url(#panel-sg6)" stroke-width="2" stroke-linecap="round"/>
                <path d="M38 15C38 15 42 20 42 25C42 30 38 35 38 35" stroke="url(#panel-sg6)" stroke-width="2" stroke-linecap="round"/>
                <defs><linearGradient id="panel-sg6" x1="12" y1="12" x2="48" y2="48"><stop offset="0%" stop-color="#00D4FF"/><stop offset="100%" stop-color="#FF6B9D"/></linearGradient></defs>
            </svg>`,
            goals: [
                'Захист від масованих атак та перевантажень сервера',
                'Фільтрація шкідливого трафіку на рівні мережі',
                'Підтримка стабільної роботи сайту під навантаженням',
                'Моніторинг доступності та швидке реагування на загрози',
                'Зменшення ризиків простою та втрати клієнтів'
            ],
            includes: [
                'Налаштування Rate Limiting на рівні сервера',
                'Конфігурація базового firewall та правил безпеки',
                'Підключення CDN для розподілу навантаження',
                'Налаштування Reverse Proxy (Cloudflare/Nginx)',
                'Впровадження системи виявлення підозрілої активності',
                'Налаштування блокування IP після порушень',
                'Моніторинг доступності сайту 24/7',
                'Інструкції з подальшого обслуговування',
                'Консультації з кібербезпеки'
            ],
            tech: ['Rate Limiting', 'CDN', 'Firewall', 'Cloudflare', 'Nginx', 'Monitoring'],
            timeline: '2-4 робочих дні'
        }
    },
    
    init() {
        // ServicePanelManager currently disabled - using ModalManager instead
        // TODO: Implement slide-in panel if needed in future
        console.log('ServicePanelManager: Panel system ready');
    }
};

// ============================================
// PARALLAX EFFECTS
// ============================================

const ParallaxManager = {
    init() {
        // ПОВНІСТЮ ВИМКНЕНО на мобільних для battery saving
        if (window.innerWidth < 768) {
            // Приховуємо parallax елементи
            const cubes = document.querySelectorAll('.cube');
            cubes.forEach(cube => cube.style.display = 'none');
            return;
        }
        
        this.mouseX = 0;
        this.mouseY = 0;
        this.cubes = document.querySelectorAll('.cube');
        this.hero = document.querySelector('.hero');
        
        if (this.cubes.length > 0) {
            const throttledMouseMove = throttle((e) => {
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
            }, 50);
            
            document.addEventListener('mousemove', throttledMouseMove);
            this.animateCubes();
        }
        
        if (this.hero) {
            window.addEventListener('scroll', throttle(() => this.animateHero(), 32), { passive: true });
        }
    },
    
    animateCubes() {
        this.cubes.forEach((cube, index) => {
            const speed = (index + 1) * 0.02;
            const x = (this.mouseX - window.innerWidth / 2) * speed;
            const y = (this.mouseY - window.innerHeight / 2) * speed;
            
            cube.style.transform = `translate(${x}px, ${y}px) rotate(${x * 0.1}deg)`;
        });
        
        requestAnimationFrame(() => this.animateCubes());
    },
    
    animateHero() {
        const scrolled = window.pageYOffset;
        const heroContent = this.hero.querySelector('.hero-content');
        if (heroContent && scrolled < 800) {
            heroContent.style.transform = `translateY(${scrolled * 0.4}px)`;
            heroContent.style.opacity = Math.max(0, 1 - scrolled / 600);
        }
    }
};

// ============================================
// NAVIGATION
// ============================================

const NavigationManager = {
    init() {
        this.navbar = document.querySelector('.navbar');
        this.hamburger = document.querySelector('.hamburger');
        this.navMenu = document.querySelector('.nav-menu');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.sections = document.querySelectorAll('section[id]');
        
        this.setupMobileNav();
        this.setupSmoothScroll();
        this.setupNavbarScroll();
        this.setupActiveLinks();
    },
    
    setupMobileNav() {
        if (this.hamburger && this.navMenu) {
            // Відкриття/закриття через hamburger
            this.hamburger.addEventListener('click', () => {
                this.hamburger.classList.toggle('active');
                this.navMenu.classList.toggle('active');
                document.body.style.overflow = this.navMenu.classList.contains('active') ? 'hidden' : '';
            });

            // Закриття при кліку на link
            this.navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    this.hamburger.classList.remove('active');
                    this.navMenu.classList.remove('active');
                    document.body.style.overflow = '';
                });
            });
            
            // НОВЕ: Закриття при кліку поза меню
            this.navMenu.addEventListener('click', (e) => {
                if (e.target === this.navMenu) {
                    this.hamburger.classList.remove('active');
                    this.navMenu.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
            
            // НОВЕ: Закриття через ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.navMenu.classList.contains('active')) {
                    this.hamburger.classList.remove('active');
                    this.navMenu.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }
    },
    
    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                if (href === '#') return;
                
                e.preventDefault();
                const target = document.querySelector(href);
                
                if (target) {
                    const navbarHeight = this.navbar.offsetHeight;
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    },
    
    setupNavbarScroll() {
        const handleScroll = () => {
            const currentScroll = window.pageYOffset;
            const isLight = document.body.classList.contains('light-theme');
            
            if (currentScroll > 50) {
                this.navbar.style.background = isLight
                    ? 'rgba(255, 255, 255, 0.98)'
                    : 'rgba(10, 10, 10, 0.98)';
                this.navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
            } else {
                this.navbar.style.background = isLight
                    ? 'rgba(255, 255, 255, 0.95)'
                    : 'rgba(10, 10, 10, 0.95)';
                this.navbar.style.boxShadow = 'none';
            }
        };
        
        window.addEventListener('scroll', throttle(handleScroll, 100), { passive: true });
    },
    
    setupActiveLinks() {
        const highlightNav = () => {
            const scrollY = window.pageYOffset;
            
            this.sections.forEach(section => {
                const sectionHeight = section.offsetHeight;
                const sectionTop = section.offsetTop - 150;
                const sectionId = section.getAttribute('id');
                const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
                
                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    this.navLinks.forEach(link => link.classList.remove('active'));
                    navLink?.classList.add('active');
                }
            });
        };
        
        window.addEventListener('scroll', throttle(highlightNav, 200), { passive: true });
    }
};

// ============================================
// SCROLL REVEAL
// ============================================

const ScrollReveal = {
    init() {
        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -80px 0px'
        };
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    this.observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        const fadeElements = document.querySelectorAll(
            '.project-card, .service-card, .advantage-card, .tech-item, .section-title, .section-subtitle'
        );
        
        fadeElements.forEach((el, index) => {
            el.classList.add('fade-in');
            const delay = el.hasAttribute('data-aos-delay') 
                ? parseInt(el.getAttribute('data-aos-delay'))
                : index * 50;
            el.style.transitionDelay = `${delay}ms`;
            this.observer.observe(el);
        });
    }
};

// ============================================
// FORM HANDLING
// ============================================

const FormManager = {
    init() {
        this.form = document.getElementById('contactForm');
        if (!this.form) return;
        
        this.setupValidation();
        this.setupSubmission();
    },
    
    setupValidation() {
        const inputs = this.form.querySelectorAll('input[required], textarea[required]');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => {
                if (input.classList.contains('invalid')) {
                    this.validateField(input);
                }
            });
        });
    },
    
    validateField(field) {
        const errorSpan = document.getElementById(`${field.id}-error`);
        let isValid = true;
        let errorMessage = '';
        
        if (field.hasAttribute('required') && !field.value.trim()) {
            isValid = false;
            errorMessage = 'Це поле обов\'язкове';
        } else if (field.type === 'email' && field.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value)) {
                isValid = false;
                errorMessage = 'Введіть коректний email';
            }
        } else if (field.type === 'tel' && field.value) {
            // Видалити всі пробіли, дефіси та дужки
            const cleanPhone = field.value.replace(/[\s\-\(\)]/g, '');
            const phoneRegex = /^[\+]?[0-9]{10,13}$/;
            if (!phoneRegex.test(cleanPhone)) {
                isValid = false;
                errorMessage = 'Введіть коректний номер телефону';
            }
        }
        
        if (errorSpan) {
            errorSpan.textContent = errorMessage;
        }
        
        field.classList.toggle('invalid', !isValid);
        field.setAttribute('aria-invalid', !isValid);
        
        return isValid;
    },
    
    setupSubmission() {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Validate all fields
            const inputs = this.form.querySelectorAll('input[required], textarea[required]');
            let isFormValid = true;
            
            inputs.forEach(input => {
                if (!this.validateField(input)) {
                    isFormValid = false;
                }
            });
            
            if (!isFormValid) {
                return;
            }
            
            const submitBtn = this.form.querySelector('.btn-submit');
            const originalHTML = submitBtn.innerHTML;
            
            // Disable button and show loading
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Надсилаємо...</span>';
            submitBtn.style.opacity = '0.7';
            
            try {
                // Send form data to backend
                // Отримати правильні значення з форми
                const formData = new FormData(this.form);
                const data = {
                    name: formData.get('name'),
                    phone: formData.get('phone'),
                    email: formData.get('email'),
                    message: formData.get('message') || ''
                };
                
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Success state
                    submitBtn.innerHTML = '✓ Надіслано!';
                    submitBtn.style.background = 'linear-gradient(135deg, #28c840, #11998e)';
                    
                    // Show success alert
                    alert('🎉 Дякуємо! Ваша заявка надіслана.\n\nМи зв\'яжемося з вами найближчим часом!');
                    
                    // Reset form
                    setTimeout(() => {
                        this.form.reset();
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalHTML;
                        submitBtn.style.opacity = '1';
                        submitBtn.style.background = '';
                        
                        // Clear error messages
                        inputs.forEach(input => {
                            input.classList.remove('invalid');
                            const errorSpan = document.getElementById(`${input.id}-error`);
                            if (errorSpan) errorSpan.textContent = '';
                        });
                    }, 2500);
                } else {
                    throw new Error(result.message || 'Помилка відправки');
                }
            } catch (error) {
                console.error('Form submission error:', error);
                submitBtn.innerHTML = '⚠ Помилка';
                submitBtn.style.background = 'linear-gradient(135deg, #ff6b6b, #ff5252)';
                alert('Помилка відправки. Спробуйте пізніше або зв\'яжіться з нами напряму.');
                
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalHTML;
                    submitBtn.style.opacity = '1';
                    submitBtn.style.background = '';
                }, 2500);
            }
        });
    }
};

// ============================================
// ENHANCED EFFECTS
// ============================================

const EnhancedEffects = {
    init() {
        this.setupProjectCardGlow();
        
        // Custom cursor ТІЛЬКИ на desktop
        if (window.innerWidth > 1024) {
            this.setupCustomCursor();
        }
        
        this.setupLogoAnimation();
        
        // Ripple effect - легкий, працює всюди
        this.setupSimpleRippleEffect();
    },
    
    setupProjectCardGlow() {
        const projectCards = document.querySelectorAll('.project-card');
        projectCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.boxShadow = '0 15px 40px rgba(123, 47, 247, 0.25)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.boxShadow = '';
            });
        });
    },
    
    setupCustomCursor() {
        if (window.innerWidth <= 1024) return; // Тільки для великих екранів
        
        const cursor = document.createElement('div');
        cursor.style.cssText = `
            position: fixed;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: linear-gradient(135deg, rgba(0, 212, 255, 0.8), rgba(123, 47, 247, 0.8));
            pointer-events: none;
            z-index: 10000;
            mix-blend-mode: screen;
            transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 0 20px rgba(123, 47, 247, 0.6);
        `;
        document.body.appendChild(cursor);
        
        let cursorX = 0, cursorY = 0, targetX = 0, targetY = 0;
        
        document.addEventListener('mousemove', (e) => {
            targetX = e.clientX;
            targetY = e.clientY;
        });
        
        function animateCursor() {
            const dx = targetX - cursorX;
            const dy = targetY - cursorY;
            
            cursorX += dx * 0.15;
            cursorY += dy * 0.15;
            
            cursor.style.left = cursorX - 6 + 'px';
            cursor.style.top = cursorY - 6 + 'px';
            
            requestAnimationFrame(animateCursor);
        }
        
        animateCursor();
        
        // Scale cursor on hover
        const interactiveElements = document.querySelectorAll(
            'a, button, .project-card, .service-card, .advantage-card, input, textarea'
        );
        
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.style.transform = 'scale(2.5)';
                cursor.style.background = 'linear-gradient(135deg, rgba(255, 107, 157, 0.8), rgba(123, 47, 247, 0.8))';
            });
            
            el.addEventListener('mouseleave', () => {
                cursor.style.transform = 'scale(1)';
                cursor.style.background = 'linear-gradient(135deg, rgba(0, 212, 255, 0.8), rgba(123, 47, 247, 0.8))';
            });
        });
    },
    
    setupLogoAnimation() {
        const logo = document.querySelector('.logo');
        if (logo) {
            setTimeout(() => {
                logo.style.opacity = '0';
                logo.style.transform = 'scale(0.8)';
                
                setTimeout(() => {
                    logo.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                    logo.style.opacity = '1';
                    logo.style.transform = 'scale(1)';
                }, 2600);
            }, 100);
        }
    },
    
    setupSimpleRippleEffect() {
        // Простий ripple effect - набагато легший
        const clickableElements = document.querySelectorAll('button, .btn-nav, .btn-phone, .service-cta-primary');
        
        clickableElements.forEach(element => {
            element.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(0);
                    animation: rippleEffect 0.5s ease-out;
                    pointer-events: none;
                    left: ${x}px;
                    top: ${y}px;
                `;
                
                this.style.position = 'relative';
                this.style.overflow = 'hidden';
                this.appendChild(ripple);
                
                setTimeout(() => ripple.remove(), 500);
            });
        });
        
        if (!document.getElementById('ripple-animation-style')) {
            const style = document.createElement('style');
            style.id = 'ripple-animation-style';
            style.textContent = `
                @keyframes rippleEffect {
                    to {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
};

// ============================================
// PRELOADER
// ============================================

const PreloaderManager = {
    init() {
        window.addEventListener('load', () => {
            const preloader = document.querySelector('.preloader');
            setTimeout(() => {
                preloader.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }, 2500);
        });
    }
};

// ============================================
// PAGE TRANSITIONS
// ============================================

const PageTransitions = {
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.style.opacity = '0';
            setTimeout(() => {
                document.body.style.transition = 'opacity 0.5s ease';
                document.body.style.opacity = '1';
            }, 100);
        });
    }
};

// ============================================
// CONSOLE SIGNATURE
// ============================================

const ConsoleSignature = {
    init() {
        const styles = [
            'font-family: Montserrat, sans-serif',
            'font-size: 32px',
            'font-weight: 800',
            'background: linear-gradient(135deg, #00D4FF, #7B2FF7, #FF6B9D)',
            '-webkit-background-clip: text',
            '-webkit-text-fill-color: transparent',
            'padding: 20px',
            'text-shadow: 0 2px 10px rgba(123, 47, 247, 0.3)'
        ].join(';');
        
        console.log('%cVibeWeb Studio', styles);
        console.log(
            '%c🚀 Студія розробки вебсайтів — Вінниця',
            'font-family: Montserrat; font-size: 16px; color: #8a8a8a; padding: 10px;'
        );
        console.log(
            '%c📞 +380 96 832 40 80 | ✉️ vibewebstudio8@gmail.com | 💬 @Nexussiko',
            'font-family: Montserrat; font-size: 14px; color: #c4c4c4; padding: 10px;'
        );
        console.log(
            '%c💙💛 Made with Love in Ukraine',
            'font-family: Montserrat; font-size: 14px; color: #00D4FF; font-weight: 700; padding: 10px;'
        );
    }
};

// ============================================
// INITIALIZE ALL MODULES
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    CanvasManager.init();
    TiltManager.init();
    ModalManager.init();
    // ServicePanelManager.init();  // Видалено
    ParallaxManager.init();
    NavigationManager.init();
    ScrollReveal.init();
    FormManager.init();
    EnhancedEffects.init();
    PreloaderManager.init();
    PageTransitions.init();
    ConsoleSignature.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    CanvasManager.destroy();
});
