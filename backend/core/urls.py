from django.urls import path, include
from .api.views import TalleListView, CategoriaListView

# DECISIÓN: Se separan las URLs en sub-módulos para mantener claridad a medida que crece la API
urlpatterns = [
    path('auth/', include('core.api.auth_urls')),
    path('products/', include('core.api.product_urls')),
    path('credits/', include('core.api.credit_urls')),
    path('notifications/', include('core.api.notification_urls')),
    path('wishlist/', include('core.api.wishlist_urls')),
    path('checkout/', include('core.api.checkout_urls')),
    path('orders/', include('core.api.order_urls')),
    path('admin/', include('core.api.admin_urls')),
    path('talles/', TalleListView.as_view(), name='talle-list'),
    path('categorias/', CategoriaListView.as_view(), name='categoria-list'),
]
