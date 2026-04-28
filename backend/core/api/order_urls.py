from django.urls import path
from .views import OrdenListView, OrdenDetailView

urlpatterns = [
    path('', OrdenListView.as_view(), name='order-list'),
    path('<int:pk>/', OrdenDetailView.as_view(), name='order-detail'),
]
