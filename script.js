// VibeWeb Studio - Advanced Interactions & Effects

'use strict';

// Modal Functionality
const serviceCards = document.querySelectorAll('.service-card');
const modals = document.querySelectorAll('.modal');
const modalCloses = document.querySelectorAll('.modal-close');
const modalOverlays = document.querySelectorAll('.modal-overlay');

// Open modal when clicking service details button
serviceCards.forEach(card => {
    const detailsBtn = card.querySelector('.service-details-btn');
    const serviceType = card.getAttribute('data-service');
    
    if (detailsBtn && serviceType) {
        detailsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const modal = document.getElementById(`modal-${serviceType}`);
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    }
});

// Close modal when clicking close button
modalCloses.forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        closeBtn.closest('.modal').classList.remove('active');
        document.body.style.overflow = '';
    });
});

// Close modal when clicking overlay
modalOverlays.forEach(overlay => {
    overlay.addEventListener('click', () => {
        overlay.closest('.modal').classList.remove('active');
        document.body.style.overflow = '';
    });
});

// Close modal with ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        modals.forEach(modal => {
            if (modal.classList.contains('active')) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
});

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Check saved theme
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'light') {
    body.classList.add('light-theme');
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('light-theme');
        const theme = body.classList.contains('light-theme') ? 'light' : 'dark';
        localStorage.setItem('theme', theme);
    });
}

// 3D Canvas Background with Particles
const canvas = document.getElementById('canvas3d');
if (canvas) {
    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const particles = [];
    const particleCount = 80;
    
    class Particle {
        constructor() {
            this.reset();
        }
        
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
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
            
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        
        draw() {
            const scale = 1500 / (1500 + this.z);
            const x2d = (this.x - canvas.width / 2) * scale + canvas.width / 2;
            const y2d = (this.y - canvas.height / 2) * scale + canvas.height / 2;
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
                const otherX = (other.x - canvas.width / 2) * otherScale + canvas.width / 2;
                const otherY = (other.y - canvas.height / 2) * otherScale + canvas.height / 2;
                
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
    
    const activeParticleCount = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 0
        : particleCount;

    for (let i = 0; i < activeParticleCount; i++) {
        particles.push(new Particle());
    }
    
    function animate() {
        ctx.fillStyle = body.classList.contains('light-theme') 
            ? 'rgba(255, 255, 255, 0.15)' 
            : 'rgba(10, 10, 10, 0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

// 3D Tilt Effect for Project Cards
const tiltCards = document.querySelectorAll('[data-tilt]');

tiltCards.forEach(card => {
    let bounds;
    
    card.addEventListener('mouseenter', () => {
        bounds = card.getBoundingClientRect();
    });
    
    card.addEventListener('mousemove', (e) => {
        if (!bounds) bounds = card.getBoundingClientRect();
        
        const x = e.clientX - bounds.left;
        const y = e.clientY - bounds.top;
        
        const centerX = bounds.width / 2;
        const centerY = bounds.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * 12;
        const rotateY = ((centerX - x) / centerX) * 12;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        bounds = null;
    });
});

// 3D Tilt for Service Cards
serviceCards.forEach(card => {
    let bounds;
    
    card.addEventListener('mouseenter', () => {
        bounds = card.getBoundingClientRect();
    });
    
    card.addEventListener('mousemove', (e) => {
        if (!bounds) bounds = card.getBoundingClientRect();
        
        const x = e.clientX - bounds.left;
        const y = e.clientY - bounds.top;
        
        const centerX = bounds.width / 2;
        const centerY = bounds.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * 8;
        const rotateY = ((centerX - x) / centerX) * 8;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0) scale(1)';
        bounds = null;
    });
});

// Parallax Cubes
const cubes = document.querySelectorAll('.cube');
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function animateCubes() {
    cubes.forEach((cube, index) => {
        const speed = (index + 1) * 0.02;
        const x = (mouseX - window.innerWidth / 2) * speed;
        const y = (mouseY - window.innerHeight / 2) * speed;
        
        cube.style.transform = `translate(${x}px, ${y}px) rotate(${x * 0.1}deg)`;
    });
    
    requestAnimationFrame(animateCubes);
}

if (cubes.length > 0) {
    animateCubes();
}

// Preloader
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function hidePreloader() {
    const preloader = document.querySelector('.preloader');
    if (preloader && !preloader.classList.contains('hidden')) {
        preloader.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

// Live percentage counter synced with the progress bar animation
const preloaderPercent = document.querySelector('.preloader-percent');
if (preloaderPercent && !prefersReducedMotion) {
    const duration = 1800;
    const start = performance.now();
    function tickPercent(now) {
        const progress = Math.min((now - start) / duration, 1);
        preloaderPercent.textContent = Math.round(progress * 100) + '%';
        if (progress < 1) requestAnimationFrame(tickPercent);
    }
    requestAnimationFrame(tickPercent);
} else if (preloaderPercent) {
    preloaderPercent.textContent = '100%';
}

window.addEventListener('load', () => {
    setTimeout(hidePreloader, prefersReducedMotion ? 300 : 2000);
});

// Safety net: never let the preloader trap the user if 'load' is slow/blocked
setTimeout(hidePreloader, 6000);

// Mobile Navigation
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Keyboard support since the hamburger is a <div role="button">
    hamburger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            hamburger.click();
        }
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        
        if (target) {
            const navbarHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Navbar Scroll Effect
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

const handleNavbarScroll = () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 50) {
        navbar.style.background = body.classList.contains('light-theme')
            ? 'rgba(255, 255, 255, 0.98)'
            : 'rgba(10, 10, 10, 0.98)';
        navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = body.classList.contains('light-theme')
            ? 'rgba(255, 255, 255, 0.95)'
            : 'rgba(10, 10, 10, 0.95)';
        navbar.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
};

window.addEventListener('scroll', handleNavbarScroll, { passive: true });

// Advanced Scroll Reveal with AOS-like functionality
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -80px 0px'
};

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

// Apply fade-in animation to elements
const fadeElements = document.querySelectorAll(
    '.project-card, .service-card, .advantage-card, .tech-item, .section-title, .section-subtitle'
);

fadeElements.forEach((el, index) => {
    el.classList.add('fade-in');
    
    // Add stagger delay
    const delay = el.hasAttribute('data-aos-delay') 
        ? parseInt(el.getAttribute('data-aos-delay'))
        : index * 50;
    
    el.style.transitionDelay = `${delay}ms`;
    revealObserver.observe(el);
});

// Form Handling
const contactForm = document.querySelector('.contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = contactForm.querySelector('.btn-submit');
        const originalHTML = submitBtn.innerHTML;
        
        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Надсилаємо...</span>';
        submitBtn.style.opacity = '0.7';
        
        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1800));
        
        // Success state
        submitBtn.innerHTML = '✓ Надіслано!';
        submitBtn.style.background = 'linear-gradient(135deg, #28c840, #11998e)';
        
        // Show success alert
        alert('🎉 Дякуємо! Ваша заявка надіслана.\n\nМи зв\'яжемося з вами протягом години!');
        
        // Reset form
        setTimeout(() => {
            contactForm.reset();
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHTML;
            submitBtn.style.opacity = '1';
            submitBtn.style.background = '';
        }, 2500);
    });
}

// Parallax Effect on Hero
const hero = document.querySelector('.hero');
if (hero) {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroContent = hero.querySelector('.hero-content');
        if (heroContent && scrolled < 800) {
            heroContent.style.transform = `translateY(${scrolled * 0.4}px)`;
            heroContent.style.opacity = Math.max(0, 1 - scrolled / 600);
        }
    }, { passive: true });
}

// Active Navigation Link
const sections = document.querySelectorAll('section[id]');

const highlightNav = () => {
    const scrollY = window.pageYOffset;
    
    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 150;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinks.forEach(link => link.classList.remove('active'));
            navLink?.classList.add('active');
        }
    });
};

window.addEventListener('scroll', highlightNav, { passive: true });

// Enhanced Cursor (Desktop, non-touch, motion-friendly only)
if (window.innerWidth > 768 && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !prefersReducedMotion) {
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
    
    let cursorX = 0;
    let cursorY = 0;
    let targetX = 0;
    let targetY = 0;
    
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
}

// Logo Animation on Load
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

// Animate project card glow effect
const projectCards = document.querySelectorAll('.project-card');

projectCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.boxShadow = `
            0 20px 60px rgba(123, 47, 247, 0.4),
            0 0 80px rgba(0, 212, 255, 0.2),
            inset 0 0 30px rgba(123, 47, 247, 0.1)
        `;
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.boxShadow = '';
    });
});

// Advantage cards pulse animation
const advantageCards = document.querySelectorAll('.advantage-card');

advantageCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.15}s`;
});

// Add smooth page transitions
document.addEventListener('DOMContentLoaded', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// Performance optimization: Throttle scroll events
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

const throttledHighlight = throttle(highlightNav, 200);
window.removeEventListener('scroll', highlightNav);
window.addEventListener('scroll', throttledHighlight, { passive: true });

// Mobile tap-to-flip for service cards (hover doesn't exist on touch)
const isTouchDevice = window.matchMedia('(hover: none)').matches;

if (isTouchDevice) {
    serviceCards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.service-details-btn')) return;
            const wasOpen = card.classList.contains('tapped');
            serviceCards.forEach(c => c.classList.remove('tapped'));
            if (!wasOpen) card.classList.add('tapped');
        });
    });
}

// Scroll Progress Bar
const scrollProgressBar = document.querySelector('.scroll-progress-bar');
if (scrollProgressBar) {
    const updateScrollProgress = () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        scrollProgressBar.style.width = progress + '%';
    };
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress();
}

// Back to Top Button
const backToTopBtn = document.querySelector('.back-to-top');
if (backToTopBtn) {
    window.addEventListener('scroll', () => {
        backToTopBtn.classList.toggle('visible', window.pageYOffset > 600);
    }, { passive: true });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
}

// Console Signature
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
