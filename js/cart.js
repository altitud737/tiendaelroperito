// ============================================================================
// Cart — Gestión del carrito en localStorage
// Stock siempre = 1, no se puede agregar el mismo producto dos veces
// ============================================================================
window.ElRoperito = window.ElRoperito || {};

(function() {
    function getItems() {
        try {
            return JSON.parse(localStorage.getItem('cart') || '[]');
        } catch (e) {
            return [];
        }
    }

    function saveItems(items) {
        localStorage.setItem('cart', JSON.stringify(items));
        updateCartBadge();
    }

    function updateCartBadge() {
        const badges = document.querySelectorAll('.cart-count');
        const count = getItems().length;
        badges.forEach(function(badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? '' : 'none';
        });
    }

    const CART = {
        getItems: getItems,

        addItem: function(product) {
            const items = getItems();
            if (items.find(function(i) { return i.id === product.id; })) return false; // ya está
            items.push({
                id: product.id,
                nombre: product.nombre,
                precio: product.precio,
                precio_original: product.precio_original || product.precio,
                talle: product.talle,
                slug: product.slug,
                imagen: product.imagen || null
            });
            saveItems(items);
            return true;
        },

        removeItem: function(id) {
            const items = getItems().filter(function(i) { return i.id !== id; });
            saveItems(items);
        },

        clearCart: function() {
            saveItems([]);
        },

        getCount: function() {
            return getItems().length;
        },

        getTotal: function() {
            return getItems().reduce(function(sum, item) { return sum + item.precio; }, 0);
        },

        hasItem: function(id) {
            return !!getItems().find(function(i) { return i.id === id; });
        },

        updateBadge: updateCartBadge
    };

    window.ElRoperito.Cart = CART;
})();
