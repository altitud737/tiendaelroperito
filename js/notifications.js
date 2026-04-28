/**
 * Módulo de notificaciones internas — El Roperito
 * Se inicializa automáticamente si existe #notif-btn en la página.
 */
(function () {
    'use strict';

    function init() {
        var btn = document.getElementById('notif-btn');
        if (!btn) return;

        // Ocultar campana por defecto (se muestra al confirmar login)
        btn.style.display = 'none';

        // Crear dropdown si no existe
        if (!document.getElementById('notif-dropdown')) {
            var wrap = document.createElement('div');
            wrap.className = 'notif-wrap';
            wrap.style.position = 'relative';
            btn.parentNode.insertBefore(wrap, btn);
            wrap.appendChild(btn);

            var dd = document.createElement('div');
            dd.id = 'notif-dropdown';
            dd.className = 'notif-dropdown';
            dd.style.display = 'none';
            dd.innerHTML =
                '<div class="notif-header">' +
                    '<span class="notif-title">Notificaciones</span>' +
                    '<button class="notif-mark-all" id="notif-mark-all">Marcar todo leído</button>' +
                '</div>' +
                '<div class="notif-list" id="notif-list">' +
                    '<div class="notif-empty">Sin notificaciones</div>' +
                '</div>';
            wrap.appendChild(dd);
        }

        var dropdown = document.getElementById('notif-dropdown');
        var dot = document.getElementById('notif-dot');
        var listEl = document.getElementById('notif-list');
        var markAllBtn = document.getElementById('notif-mark-all');
        var isOpen = false;

        // Toggle dropdown
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            isOpen = !isOpen;
            dropdown.style.display = isOpen ? '' : 'none';
            if (isOpen) {
                loadNotifications();
            }
        });

        // Close on outside click
        document.addEventListener('click', function (e) {
            if (isOpen && !dropdown.contains(e.target) && e.target !== btn) {
                isOpen = false;
                dropdown.style.display = 'none';
            }
        });

        // Mark all read
        markAllBtn.addEventListener('click', function () {
            if (!window.ElRoperito || !window.ElRoperito.Auth || !window.ElRoperito.Auth.isLoggedIn()) return;
            var token = window.ElRoperito.Auth.token;
            window.ElRoperito.API.markNotificationsRead(token).then(function (res) {
                dot.style.display = 'none';
                var items = listEl.querySelectorAll('.notif-item.unread');
                for (var i = 0; i < items.length; i++) {
                    items[i].classList.remove('unread');
                }
            }).catch(function () {});
        });

        // Show bell + check unread when auth is ready
        window.addEventListener('ElRoperitoAuthReady', function () {
            if (window.ElRoperito.Auth.isLoggedIn()) {
                btn.style.display = '';
                checkUnread();
            } else {
                btn.style.display = 'none';
            }
        });
    }

    function checkUnread() {
        if (!window.ElRoperito || !window.ElRoperito.Auth || !window.ElRoperito.Auth.isLoggedIn()) return;
        var token = window.ElRoperito.Auth.token;
        var dot = document.getElementById('notif-dot');
        if (!dot) return;

        window.ElRoperito.API.getNotifications(token).then(function (res) {
            dot.style.display = res.unread > 0 ? '' : 'none';
        }).catch(function () {});
    }

    function loadNotifications() {
        if (!window.ElRoperito || !window.ElRoperito.Auth || !window.ElRoperito.Auth.isLoggedIn()) return;
        var token = window.ElRoperito.Auth.token;
        var listEl = document.getElementById('notif-list');
        var dot = document.getElementById('notif-dot');

        listEl.innerHTML = '<div class="notif-loading">Cargando...</div>';

        window.ElRoperito.API.getNotifications(token).then(function (res) {
            var notifs = res.results || [];
            dot.style.display = res.unread > 0 ? '' : 'none';

            if (!notifs.length) {
                listEl.innerHTML = '<div class="notif-empty">Sin notificaciones</div>';
                return;
            }

            listEl.innerHTML = notifs.map(function (n) {
                var cls = 'notif-item' + (n.leida ? '' : ' unread');
                var fecha = new Date(n.fecha);
                var fechaStr = fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
                var horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                // Replace \n with <br> for message display
                var mensajeHtml = n.mensaje.replace(/\n/g, '<br>');
                return '<div class="' + cls + '" data-id="' + n.id + '">' +
                    '<div class="notif-item-header">' +
                        '<strong class="notif-item-title">' + escapeHtml(n.titulo) + '</strong>' +
                        '<span class="notif-item-date">' + fechaStr + ' ' + horaStr + '</span>' +
                    '</div>' +
                    '<div class="notif-item-body">' + mensajeHtml + '</div>' +
                '</div>';
            }).join('');
        }).catch(function () {
            listEl.innerHTML = '<div class="notif-empty">Error al cargar</div>';
        });
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Init when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
