
let currentLanguage = 'sv';
let menuOpen = false;

function toggleMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    menuOpen = !menuOpen;
    menuToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = menuOpen ? 'hidden' : 'auto';
}

function showHome() {
    document.getElementById('home-page').style.display = 'block';
    document.getElementById('about-page').classList.remove('active');
    toggleMenu(); // Close menu
}

function showAbout() {
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('about-page').classList.add('active');
    toggleMenu(); // Close menu
}

function toggleLanguage() {
    const newLanguage = currentLanguage === 'sv' ? 'en' : 'sv';
    currentLanguage = newLanguage;
    
    const button = document.querySelector('.language-toggle');
    button.textContent = newLanguage === 'sv' ? 'EN' : 'SV';
    
    // Update all elements with language data
    const elements = document.querySelectorAll('[data-en][data-sv]');
    elements.forEach(element => {
        const text = element.getAttribute(`data-${newLanguage}`);
        if (text) {
            element.textContent = text;
        }
    });
    
    // Update placeholders
    const placeholders = document.querySelectorAll('[data-en-placeholder][data-sv-placeholder]');
    placeholders.forEach(element => {
        const placeholder = element.getAttribute(`data-${newLanguage}-placeholder`);
        if (placeholder) {
            element.placeholder = placeholder;
        }
    });
    
    // Update document language
    document.documentElement.lang = newLanguage;
}


// Close menu when clicking outside
document.addEventListener('click', (e) => {
    const navMenu = document.querySelector('.nav-menu');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (menuOpen && !navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        toggleMenu();
    }
});

// Handle newsletter form submission
document.addEventListener('DOMContentLoaded', () => {
    const newsletterForm = document.querySelector('.newsletter-form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = newsletterForm.querySelector('.newsletter-input');
            const email = emailInput.value.trim();
            
            if (email && isValidEmail(email)) {
                // Simulate form submission
                const button = newsletterForm.querySelector('.newsletter-button');
                const originalText = button.textContent;
                
                button.textContent = currentLanguage === 'sv' ? 'Tack!' : 'Thanks!';
                button.style.background = '#28a745';
                
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = 'linear-gradient(135deg, #ff6b35, #f7931e)';
                    emailInput.value = '';
                }, 2000);
            } else {
                // Show error
                emailInput.style.borderColor = '#dc3545';
                setTimeout(() => {
                    emailInput.style.borderColor = '#333';
                }, 2000);
            }
        });
    }
});

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Grid animation setup
document.addEventListener('DOMContentLoaded', () => {
    // Style grid items for bottom-to-top animation
    const gridItems = document.querySelectorAll('.grid-item');
    gridItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(80px)';
        item.style.transition = `opacity 0.8s ease ${index * 0.1}s, transform 0.8s ease ${index * 0.1}s`;
        observer.observe(item);
    });
    
    // Style other elements for fade-in animation
    const otherElements = document.querySelectorAll('.service-item, .about-text');
    otherElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(el);
    });
    
    // Add CSS for grid animation class
    const style = document.createElement('style');
    style.textContent = `
        .grid-item.animate-in {
            animation: slideUpFade 0.8s ease forwards;
        }
        
        @keyframes slideUpFade {
            0% {
                opacity: 0;
                transform: translateY(80px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .grid-item:hover {
            transform: scale(1.02) !important;
        }
    `;
    document.head.appendChild(style);
});

// Video error handling
document.addEventListener('DOMContentLoaded', () => {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        video.addEventListener('error', function() {
            console.warn('Video failed to load:', this.src);
            // You could add fallback behavior here
        });
    });
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) {
        toggleMenu();
    }
});

// Handle resize events
window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && menuOpen) {
        toggleMenu();
    }
});