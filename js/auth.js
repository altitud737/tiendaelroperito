// ============================================================================
// Auth — Gestión de autenticación con JWT en localStorage
// ============================================================================
window.ElRoperito = window.ElRoperito || {};

(function() {
    const AUTH = {
        user: null,
        token: null,
        loading: true,

        async init() {
            const storedToken = localStorage.getItem('access_token');
            const storedRefresh = localStorage.getItem('refresh_token');

            if (storedToken) {
                this.token = storedToken;
                try {
                    this.user = await window.ElRoperito.API.getMe(storedToken);
                } catch (e) {
                    // Token expirado, intentar refresh
                    if (storedRefresh) {
                        try {
                            const data = await window.ElRoperito.API.refreshToken(storedRefresh);
                            localStorage.setItem('access_token', data.access);
                            localStorage.setItem('refresh_token', data.refresh);
                            this.token = data.access;
                            this.user = await window.ElRoperito.API.getMe(data.access);
                        } catch (e2) {
                            this.clearSession();
                        }
                    } else {
                        this.clearSession();
                    }
                }
            }
            this.loading = false;
            this.updateUI();
            window.dispatchEvent(new Event('ElRoperitoAuthReady'));
        },

        async login(email, password) {
            const data = await window.ElRoperito.API.login(email, password);
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            this.token = data.access;
            this.user = await window.ElRoperito.API.getMe(data.access);
            this.updateUI();
        },

        logout() {
            this.clearSession();
            this.updateUI();
            window.location.href = 'index.html';
        },

        clearSession() {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            this.token = null;
            this.user = null;
        },

        async refreshUser() {
            if (this.token) {
                this.user = await window.ElRoperito.API.getMe(this.token);
                this.updateUI();
            }
        },

        isLoggedIn() {
            return !!this.user && !!this.token;
        },

        // Actualiza elementos del header según estado de auth
        updateUI() {
            const loginLink = document.querySelector('[data-auth="login"]');
            const userMenu  = document.querySelector('[data-auth="user-menu"]');
            const userName  = document.querySelector('[data-auth="user-name"]');

            if (loginLink && userMenu) {
                if (this.isLoggedIn()) {
                    loginLink.style.display = 'none';
                    userMenu.style.display = 'flex';
                    if (userName) userName.textContent = this.user.nombre;
                } else {
                    loginLink.style.display = '';
                    userMenu.style.display = 'none';
                }
            }

            // Mobile nav items
            const mobileLogin  = document.querySelector('[data-auth="mobile-login"]');
            const mobileUser   = document.querySelector('[data-auth="mobile-user"]');
            const mobileLogout = document.querySelector('[data-auth="mobile-logout"]');
            const mobileUserName = document.querySelector('[data-auth="mobile-user-name"]');

            if (mobileLogin) {
                mobileLogin.style.display  = this.isLoggedIn() ? 'none' : '';
                if (mobileUser)   mobileUser.style.display   = this.isLoggedIn() ? '' : 'none';
                if (mobileLogout) mobileLogout.style.display = this.isLoggedIn() ? '' : 'none';
                if (mobileUserName && this.user) mobileUserName.textContent = 'Mi cuenta (' + this.user.nombre + ')';
            }
        },

        isAdmin() {
            return this.isLoggedIn() && !!this.user.is_staff;
        },

        // Redirigir a login si no está autenticado
        requireAuth(redirectBack) {
            if (!this.isLoggedIn()) {
                const next = redirectBack || window.location.pathname.split('/').pop();
                window.location.href = 'login.html?next=' + encodeURIComponent(next);
                return false;
            }
            return true;
        },

        requireAdmin() {
            if (!this.isAdmin()) {
                window.location.href = 'index.html';
                return false;
            }
            return true;
        }
    };

    window.ElRoperito.Auth = AUTH;
})();
