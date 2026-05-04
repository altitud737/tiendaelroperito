// ============================================================================
// API Client — Centraliza todas las llamadas al backend Django
// ============================================================================
window.ElRoperito = window.ElRoperito || {};

(function() {
    // En desarrollo local, el frontend corre en localhost:3000 y el backend en 127.0.0.1:8000
    // Cuando se accede por IP de red (desde celular), apunta al mismo host en puerto 8000
    // En producción, ambos están en el mismo dominio
    const _host = window.location.hostname;
    const _isLocal = _host === 'localhost' || _host === '127.0.0.1';
    const _isLAN = !_isLocal && /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(_host);
    const API_URL = _isLocal
        ? 'http://127.0.0.1:8000'
        : _isLAN
            ? 'http://' + _host + ':8000'
            : window.location.origin;

    async function fetchAPI(endpoint, options = {}) {
        const { token, ...rest } = options;
        const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
        if (token) headers['Authorization'] = 'Bearer ' + token;

        const res = await fetch(API_URL + endpoint, { headers, ...rest });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: 'Error de conexión' }));
            throw new Error(err.detail || 'Error ' + res.status);
        }
        if (res.status === 204) return null;
        return res.json();
    }

    async function fetchFormData(endpoint, token, formData, method = 'POST') {
        const res = await fetch(API_URL + endpoint, {
            method,
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: 'Error de conexión' }));
            throw new Error(err.detail || 'Error ' + res.status);
        }
        if (res.status === 204) return null;
        return res.json();
    }

    window.ElRoperito.API = {
        // AUTH
        register: (data) => fetchAPI('/api/auth/register/', { method: 'POST', body: JSON.stringify(data) }),
        login: (email, password) => fetchAPI('/api/auth/login/', { method: 'POST', body: JSON.stringify({ email, password }) }),
        refreshToken: (refresh) => fetchAPI('/api/auth/refresh/', { method: 'POST', body: JSON.stringify({ refresh }) }),
        getMe: (token) => fetchAPI('/api/auth/me/', { token }),
        updateMe: (token, data) => fetchAPI('/api/auth/me/', { method: 'PATCH', token, body: JSON.stringify(data) }),
        passwordReset: (email) => fetchAPI('/api/auth/password-reset/', { method: 'POST', body: JSON.stringify({ email }) }),

        // PRODUCTOS
        getProducts: (params) => {
            const query = params ? '?' + new URLSearchParams(params).toString() : '';
            return fetchAPI('/api/products/' + query);
        },
        getProductBySlug: (slug) => fetchAPI('/api/products/' + slug + '/'),
        getFeaturedProducts: () => fetchAPI('/api/products/featured/'),

        // NOTIFICACIONES
        getNotifications: (token) => fetchAPI('/api/notifications/', { token }),
        markNotificationsRead: (token, ids) => fetchAPI('/api/notifications/read/', { method: 'POST', token, body: JSON.stringify(ids ? { ids } : {}) }),

        // CRÉDITO
        getCreditHistory: (token) => fetchAPI('/api/credits/history/', { token }),
        getMyCodes: (token) => fetchAPI('/api/credits/my-codes/', { token }),
        redeemCreditCode: (token, codigo) => fetchAPI('/api/credits/redeem/', { method: 'POST', token, body: JSON.stringify({ codigo }) }),

        // WISHLIST
        getWishlist: (token) => fetchAPI('/api/wishlist/', { token }),
        addToWishlist: (token, productId) => fetchAPI('/api/wishlist/add/', { method: 'POST', token, body: JSON.stringify({ product_id: productId }) }),
        removeFromWishlist: (token, productId) => fetchAPI('/api/wishlist/remove/' + productId + '/', { method: 'DELETE', token }),

        // CHECKOUT
        getCheckoutConfig: () => fetchAPI('/api/checkout/config/'),
        createCheckout: (token, data) => fetchAPI('/api/checkout/', { method: 'POST', token, body: JSON.stringify(data) }),
        processPayment: (token, paymentData) => fetchAPI('/api/checkout/process_payment/', { method: 'POST', token, body: JSON.stringify(paymentData) }),
        createPreference: (token, ordenId) => fetchAPI('/api/checkout/preference/', { method: 'POST', token, body: JSON.stringify({ orden_id: ordenId }) }),

        // ÓRDENES
        getOrders: (token) => fetchAPI('/api/orders/', { token }),
        getOrderDetail: (token, id) => fetchAPI('/api/orders/' + id + '/', { token }),

        // ADMIN — DASHBOARD
        adminGetDashboard: (token, year) => fetchAPI('/api/admin/dashboard/' + (year ? '?year=' + year : ''), { token }),

        // ADMIN — PRODUCTOS
        adminGetProducts: (token) => fetchAPI('/api/admin/products/', { token }),
        adminCreateProduct: (token, formData) => fetchFormData('/api/admin/products/', token, formData, 'POST'),
        adminUpdateProduct: (token, id, formData) => fetchFormData('/api/admin/products/' + id + '/', token, formData, 'PATCH'),
        adminDeleteProduct: (token, id) => fetchAPI('/api/admin/products/' + id + '/', { method: 'DELETE', token }),
        adminPauseProduct: (token, id) => fetchAPI('/api/admin/products/' + id + '/pause/', { method: 'PATCH', token }),
        adminMarkSold: (token, id) => fetchAPI('/api/admin/products/' + id + '/mark-sold/', { method: 'PATCH', token }),

        // ADMIN — USUARIOS
        adminGetUsers: (token) => fetchAPI('/api/admin/users/', { token }),
        adminBlockUser: (token, id) => fetchAPI('/api/admin/users/' + id + '/block/', { method: 'PATCH', token }),

        // ADMIN — CRÉDITOS
        adminAssignCredit: (token, data) => fetchAPI('/api/admin/credits/assign/', { method: 'POST', token, body: JSON.stringify(data) }),
        adminGetCreditCodes: (token) => fetchAPI('/api/admin/credits/codes/', { token }),
        adminCreateCreditCode: (token, data) => fetchAPI('/api/admin/credits/codes/', { method: 'POST', token, body: JSON.stringify(data) }),
        adminUpdateCreditCode: (token, id, data) => fetchAPI('/api/admin/credits/codes/' + id + '/', { method: 'PATCH', token, body: JSON.stringify(data) }),
        adminDeleteCreditCode: (token, id) => fetchAPI('/api/admin/credits/codes/' + id + '/', { method: 'DELETE', token }),

        // TALLES / CATEGORÍAS (público)
        getTalles: () => fetchAPI('/api/talles/'),
        getCategorias: () => fetchAPI('/api/categorias/'),

        // ADMIN — TALLES / CATEGORÍAS
        adminGetTalles: (token) => fetchAPI('/api/admin/talles/', { token }),
        adminCreateTalle: (token, data) => fetchAPI('/api/admin/talles/', { method: 'POST', token, body: JSON.stringify(data) }),
        adminDeleteTalle: (token, id) => fetchAPI('/api/admin/talles/' + id + '/', { method: 'DELETE', token }),
        adminGetCategorias: (token) => fetchAPI('/api/admin/categorias/', { token }),
        adminCreateCategoria: (token, data) => fetchAPI('/api/admin/categorias/', { method: 'POST', token, body: JSON.stringify(data) }),
        adminDeleteCategoria: (token, id) => fetchAPI('/api/admin/categorias/' + id + '/', { method: 'DELETE', token }),
    };
})();
