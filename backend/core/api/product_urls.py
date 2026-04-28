from django.urls import path
from .views import ProductoListView, ProductoDetailView, ProductoFeaturedView

urlpatterns = [
    path('', ProductoListView.as_view(), name='product-list'),
    path('featured/', ProductoFeaturedView.as_view(), name='product-featured'),
    path('<slug:slug>/', ProductoDetailView.as_view(), name='product-detail'),
]
