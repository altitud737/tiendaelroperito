"""
URL configuration for elroperito project.
"""
import os
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from django.http import HttpResponse, Http404
from core.api.password_reset_views import (
    CustomPasswordResetConfirmView,
    CustomPasswordResetCompleteView,
)

# Directorio raíz del frontend (un nivel arriba del backend)
FRONTEND_ROOT = settings.BASE_DIR.parent


def frontend_view(request, page='index.html'):
    """Sirve archivos HTML del frontend sin procesamiento de templates Django."""
    file_path = os.path.join(FRONTEND_ROOT, page)
    try:
        with open(file_path, encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html; charset=utf-8')
    except FileNotFoundError:
        raise Http404(f'Página {page} no encontrada')


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    # Webhook raíz para MercadoPago (redirige al mismo handler)
    path('webhook', include('core.api.webhook_urls')),
    # Password reset — páginas que abre el usuario desde el email
    path('password-reset/<uidb64>/<token>/', CustomPasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('password-reset/done/', CustomPasswordResetCompleteView.as_view(), name='password_reset_complete'),

    # ── Frontend: URLs limpias para todas las páginas ──
    path('', frontend_view, {'page': 'index.html'}, name='home'),
    path('tienda/', frontend_view, {'page': 'tienda.html'}, name='tienda'),
    path('login/', frontend_view, {'page': 'login.html'}, name='login'),
    path('registro/', frontend_view, {'page': 'registro.html'}, name='registro'),
    path('recuperar/', frontend_view, {'page': 'recuperar.html'}, name='recuperar'),
    path('producto/', frontend_view, {'page': 'producto.html'}, name='producto'),
    path('checkout/', frontend_view, {'page': 'checkout.html'}, name='checkout'),
    path('perfil/', frontend_view, {'page': 'perfil.html'}, name='perfil'),
    path('panel/', frontend_view, {'page': 'panel.html'}, name='panel'),
    # Páginas de retorno post-pago (back_urls de Checkout Pro)
    path('pago-exitoso/', frontend_view, {'page': 'pago-exitoso.html'}, name='pago-exitoso'),
    path('pago-error/', frontend_view, {'page': 'pago-error.html'}, name='pago-error'),
    path('pago-pendiente/', frontend_view, {'page': 'pago-pendiente.html'}, name='pago-pendiente'),
]

# Media files — solo en desarrollo local (Cloudinary sirve en producción)
if not getattr(settings, 'USE_CLOUDINARY', False):
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Servir CSS, JS, imágenes y otros assets del frontend (WhiteNoise cubre /static/).
# En desarrollo y en Railway sin Nginx se sirven desde Django.
urlpatterns += [
    re_path(r'(?i)^(?P<path>.+\.(?:css|js|ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot))$',
            serve, {'document_root': FRONTEND_ROOT}),
]
