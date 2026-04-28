// ============================================================================
// Components — Header y Footer compartidos entre todas las páginas
// ============================================================================
window.ElRoperito = window.ElRoperito || {};

(function() {

    function getHeader() {
        return `
        <header class="main-header">
            <div class="header-container">
                <div class="header-brand">
                    <a href="index.html" class="brand-logo">
                        <span class="logo-letter logo-el" data-letter="E">E</span>
                        <span class="logo-letter logo-el" data-letter="l">l</span>
                        <span class="logo-space"></span>
                        <span class="logo-letter logo-rop" data-letter="R">R</span>
                        <span class="logo-letter logo-rop" data-letter="o">o</span>
                        <span class="logo-letter logo-rop" data-letter="p">p</span>
                        <span class="logo-letter logo-er" data-letter="e">e</span>
                        <span class="logo-letter logo-er" data-letter="r">r</span>
                        <span class="logo-letter logo-ito" data-letter="i">i</span>
                        <span class="logo-letter logo-ito" data-letter="t">t</span>
                        <span class="logo-letter logo-ito" data-letter="o">o</span>
                    </a>
                </div>

                <nav class="header-nav">
                    <ul class="nav-menu">
                        <li><a href="tienda.html" class="nav-link">Tienda</a></li>
                        <li><a href="index.html#faq" class="nav-link">Preguntas</a></li>
                        <li><a href="index.html#nosotros" class="nav-link">Nosotros</a></li>
                    </ul>
                </nav>

                <div class="header-actions">
                    <a href="index.html#como-funciona" class="header-sell-btn">Vendé tu ropa</a>
                    <div class="header-icons">
                        <a href="login.html" class="header-icon" data-auth="login" aria-label="Ingresar">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </a>
                        <a href="perfil.html" class="header-icon" data-auth="user-icon" aria-label="Mi cuenta" style="display:none;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </a>
                        <a href="checkout.html" class="header-icon buyer-cart-btn" title="Carrito">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                            <span class="cart-count buyer-cart-count" id="buyer-cart-count" style="display:none;">0</span>
                        </a>
                        <a href="https://instagram.com/elroperitochivilcoy" class="header-icon" aria-label="Instagram" target="_blank" rel="noopener">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        </a>
                    </div>
                </div>

                <button class="nav-hamburger" id="nav-hamburger" aria-label="Abrir menú" aria-expanded="false">
                    <span></span><span></span><span></span>
                </button>
            </div>

            <div class="nav-mobile-overlay" id="nav-mobile-overlay">
                <nav class="nav-mobile-drawer">
                    <div class="nav-mobile-header">
                        <a href="index.html" class="nav-mobile-brand">
                            <span class="logo-letter logo-el" data-letter="E">E</span>
                            <span class="logo-letter logo-el" data-letter="l">l</span>
                            <span class="logo-space"></span>
                            <span class="logo-letter logo-rop" data-letter="R">R</span>
                            <span class="logo-letter logo-rop" data-letter="o">o</span>
                            <span class="logo-letter logo-rop" data-letter="p">p</span>
                            <span class="logo-letter logo-er" data-letter="e">e</span>
                            <span class="logo-letter logo-er" data-letter="r">r</span>
                            <span class="logo-letter logo-ito" data-letter="i">i</span>
                            <span class="logo-letter logo-ito" data-letter="t">t</span>
                            <span class="logo-letter logo-ito" data-letter="o">o</span>
                        </a>
                    </div>
                    <ul class="nav-mobile-list">
                        <li><a href="tienda.html">Tienda</a></li>
                        <li><a href="index.html#faq">Preguntas</a></li>
                        <li><a href="index.html#nosotros">Nosotros</a></li>
                        <li><a href="index.html#como-funciona" style="font-weight:600;color:#95E1A8;">Vendé tu ropa</a></li>
                        <li class="nav-mobile-divider-li"></li>
                        <li data-auth="mobile-login"><a href="login.html">Ingresar</a></li>
                        <li data-auth="mobile-user" style="display:none;"><a href="perfil.html" data-auth="mobile-user-name">Mi cuenta</a></li>
                        <li data-auth="mobile-logout" style="display:none;"><button class="nav-mobile-logout-btn" onclick="window.ElRoperito.Auth.logout()">Cerrar sesión</button></li>
                        <li class="nav-mobile-divider-li"></li>
                        <li><a href="checkout.html" style="display:flex;align-items:center;gap:10px;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                            Carrito
                        </a></li>
                        <li><a href="https://instagram.com/elroperitochivilcoy" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:10px;">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                            Instagram
                        </a></li>
                    </ul>
                </nav>
            </div>
        </header>`;
    }

    function getFooter() {
        return `
        <footer class="site-footer">
            <div class="footer-inner">
                <div class="footer-grid">
                    <div class="footer-brand">
                        <p class="footer-logo">El Roperito</p>
                        <p class="footer-tagline">Moda circular infantil</p>
                        <p class="footer-desc">
                            Damos segunda vida a la ropa de tus hijos para que otras familias sigan creando recuerdos con ella. Chivilcoy, Buenos Aires.
                        </p>
                        <div class="footer-socials">
                            <a href="https://instagram.com/elroperito" class="footer-social-link" aria-label="Instagram" target="_blank" rel="noopener">
                                <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                            </a>
                            <a href="https://wa.me/5492346530892" class="footer-social-link" aria-label="WhatsApp" target="_blank" rel="noopener">
                                <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            </a>
                            <a href="https://facebook.com/elroperito" class="footer-social-link" aria-label="Facebook" target="_blank" rel="noopener">
                                <svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            </a>
                        </div>
                    </div>
                    <div>
                        <p class="footer-col-title">Navegá</p>
                        <ul class="footer-links">
                            <li><a href="tienda.html">Tienda</a></li>
                            <li><a href="index.html#como-funciona">Vendé tu ropa</a></li>
                            <li><a href="index.html#nosotros">Nosotros</a></li>
                            <li><a href="index.html#faq">Preguntas frecuentes</a></li>
                        </ul>
                    </div>
                    <div>
                        <p class="footer-col-title">Contacto</p>
                        <div class="footer-contact-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                            </svg>
                            <span>Av. 3 de Febrero 640,<br>B6620 Chivilcoy, Buenos Aires</span>
                        </div>
                        <div class="footer-contact-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012.18 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l.91-.91a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 15.17v1.75z"/>
                            </svg>
                            <span><a href="https://wa.me/5492346530892" style="color:inherit;text-decoration:none;">+54 9 2346 530892</a></span>
                        </div>
                        <div class="footer-contact-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="3"/>
                            </svg>
                            <span><a href="https://instagram.com/elroperito" style="color:inherit;text-decoration:none;">@elroperitochivilcoy</a></span>
                        </div>
                    </div>
                </div>
                <div class="footer-bottom">
                    <span class="footer-copy">&copy; 2026 El Roperito &middot; Chivilcoy, Buenos Aires</span>
                    <span class="footer-love">Hecho con amor para las familias de nuestra comunidad</span>
                    <a href="https://sdp.ar/" class="footer-sdp" target="_blank" rel="noopener">Hecho por SDP</a>
                </div>
            </div>
        </footer>`;
    }

    // Genera una tarjeta de producto HTML
    function productCardHTML(product) {
        const img = (product.images && product.images.length > 0)
            ? product.images[0].imagen
            : (product.imagen_principal || 'images/placeholder.jpg');
        const genderClass = product.genero === 'nena' || product.genero === 'F' ? 'gender-nena' : product.genero === 'nene' || product.genero === 'M' ? 'gender-nene' : 'gender-unisex';
        const genderLabel = product.genero === 'nena' || product.genero === 'F' ? 'Nena' : product.genero === 'nene' || product.genero === 'M' ? 'Nene' : 'Unisex';

        return `
        <div class="product-card ${genderClass}">
            <a href="producto.html?slug=${product.slug}" class="product-image">
                <img src="${img}" alt="${product.nombre}" loading="lazy">
                <div class="product-attributes">
                    <span class="product-size">Talle ${product.talle}</span>
                    <span class="product-gender">${genderLabel}</span>
                </div>
                ${product.historia ? `
                <div class="product-story">
                    <svg class="quote-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
                    <p>${product.historia}</p>
                </div>` : ''}
            </a>
            <div class="product-details">
                <div class="product-meta">
                    <a href="producto.html?slug=${product.slug}" style="text-decoration:none;color:inherit;"><h3 class="product-name">${product.nombre}</h3></a>
                    <span class="product-price">$${Number(product.precio).toLocaleString('es-AR')}</span>
                </div>
                <button class="product-action" onclick="window.ElRoperito.addToCartFromCard(${product.id}, '${product.slug}')">Lo quiero</button>
            </div>
        </div>`;
    }

    // Inyectar header y footer en páginas secundarias
    function injectLayout() {
        const headerSlot = document.getElementById('site-header');
        const footerSlot = document.getElementById('site-footer');
        if (headerSlot) headerSlot.innerHTML = getHeader();
        if (footerSlot) footerSlot.innerHTML = getFooter();
        setupMobileNav();
    }

    function setupMobileNav() {
        var btn     = document.getElementById('nav-hamburger');
        var overlay = document.getElementById('nav-mobile-overlay');
        if (!btn || !overlay) return;

        function openMenu() {
            overlay.classList.add('open');
            btn.classList.add('open');
            btn.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        }
        function closeMenu() {
            overlay.classList.remove('open');
            btn.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }

        btn.addEventListener('click', function() {
            overlay.classList.contains('open') ? closeMenu() : openMenu();
        });
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeMenu();
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeMenu();
        });
    }

    // Helper para agregar al carrito desde tarjeta de producto
    window.ElRoperito.addToCartFromCard = function(productId, slug) {
        // Necesitamos los datos completos — los obtenemos del API
        window.ElRoperito.API.getProductBySlug(slug).then(function(p) {
            const img = (p.images && p.images.length > 0) ? p.images[0].imagen : null;
            const added = window.ElRoperito.Cart.addItem({
                id: p.id,
                nombre: p.nombre,
                precio: Number(p.precio),
                precio_original: Number(p.precio_original) || Number(p.precio),
                talle: p.talle,
                slug: p.slug,
                imagen: img
            });
            if (added) {
                showNotification('¡Agregado al carrito!');
            } else {
                showNotification('Ya está en tu carrito');
            }
        }).catch(function() {
            showNotification('Error al agregar');
        });
    };

    function showNotification(msg) {
        let n = document.getElementById('er-notification');
        if (!n) {
            n = document.createElement('div');
            n.id = 'er-notification';
            n.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1a1a18;color:#fff;padding:14px 24px;border-radius:8px;font-family:Nunito,sans-serif;font-size:14px;z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;';
            document.body.appendChild(n);
        }
        n.textContent = msg;
        n.style.opacity = '1';
        clearTimeout(n._timeout);
        n._timeout = setTimeout(function() { n.style.opacity = '0'; }, 2500);
    }

    window.ElRoperito.Components = {
        getHeader: getHeader,
        getFooter: getFooter,
        productCardHTML: productCardHTML,
        injectLayout: injectLayout,
        showNotification: showNotification
    };
})();
