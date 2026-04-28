// Script para funcionalidades interactivas del header

document.addEventListener('DOMContentLoaded', function() {
    // Navegación activa
    setActiveNavigation();

    // Smooth scroll para enlaces internos
    setupSmoothScroll();

    // Mobile menu toggle (para futuras implementaciones)
    setupMobileMenu();

    // Actualizar badge del carrito usando cart.js
    if (window.ElRoperito && window.ElRoperito.Cart && window.ElRoperito.Cart.updateBadge) {
        window.ElRoperito.Cart.updateBadge();
    }
});

// Establecer navegación activa basada en la URL
function setActiveNavigation() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        // Remover clase activa
        link.classList.remove('active');
        
        // Añadir clase activa si coincide con la página actual
        const href = link.getAttribute('href');
        if (href === currentPath || 
            (currentPath === '/' && href === '#novedades') ||
            (currentPath.includes('tienda') && href === '#tienda') ||
            (currentPath.includes('acerca') && href === '#acerca-de-nosotros')) {
            link.classList.add('active');
        }
    });
}

// Smooth scroll para enlaces ancla
function setupSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Solo procesar si es un enlace ancla válido
            if (href !== '#' && document.querySelector(href)) {
                e.preventDefault();
                
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}

// Preparar menú móvil (para futuras implementaciones)
function setupMobileMenu() {
    // Esto se implementará cuando necesitemos un menú hamburguesa
    // Por ahora, el header es responsive sin necesidad de toggle
}


// Notificación simple
function showNotification(message) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Mostrar notificación
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Manejo de header fijo en modo blanco/negro
window.checkHeaderScroll = function() {
    const header = document.querySelector('.main-header');
    if (!header) return;

    // No agregar 'scrolled' en páginas internas (login, registro, etc.)
    if (document.body.classList.contains('page-body')) return;

    header.classList.add('scrolled');
};

document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('.main-header');
    if (!header) {
        console.log('Header NOT found');
        return;
    }

    console.log('Header found, initializing scroll listener');
    
    // En páginas internas (login, registro, etc.), mantener header sin 'scrolled'
    if (document.body.classList.contains('page-body')) {
        header.classList.remove('scrolled');
        console.log('Page-body detected, keeping header without scrolled class');
    } else {
        window.checkHeaderScroll();
    }

    // Mantener estado fijo incluso si otras rutinas intentan cambiarlo
    window.addEventListener('scroll', window.checkHeaderScroll, { passive: true });
    window.addEventListener('wheel', window.checkHeaderScroll, { passive: true });
    window.addEventListener('touchmove', window.checkHeaderScroll, { passive: true });

    // Inicializar carrusel de testimonios
    initTestimonialCarousel();
});

// Función para el carrusel de testimonios en el hero
function initTestimonialCarousel() {
    const carousel = document.getElementById('testimonialCarousel');
    if (!carousel) return;

    const slides = carousel.querySelectorAll('.testimonial-slide');
    if (slides.length <= 1) return;

    let currentIndex = 0;

    // Cambiar cada 6 segundos
    setInterval(() => {
        // Remover clase active del actual
        slides[currentIndex].classList.remove('active');
        
        // Incrementar indice
        currentIndex = (currentIndex + 1) % slides.length;
        
        // Añadir clase active al nuevo
        slides[currentIndex].classList.add('active');
    }, 6000);
}

// Exportar funciones para uso global
window.ELROPERTITO = {
    showNotification
};
