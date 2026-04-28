from django.urls import path
from .views import (
    AdminProductListCreateView,
    AdminProductDetailView,
    AdminProductPauseView,
    AdminProductMarkSoldView,
    AdminDashboardView,
    AdminUserListView,
    AdminUserBlockView,
    AdminAssignCreditView,
    AdminCreditCodeListCreateView,
    AdminCreditCodeDetailView,
)

urlpatterns = [
    path('dashboard/',          AdminDashboardView.as_view(),          name='admin-dashboard'),
    path('products/',           AdminProductListCreateView.as_view(),  name='admin-products'),
    path('products/<int:pk>/',  AdminProductDetailView.as_view(),      name='admin-product-detail'),
    path('products/<int:pk>/pause/', AdminProductPauseView.as_view(),  name='admin-product-pause'),
    path('products/<int:pk>/mark-sold/', AdminProductMarkSoldView.as_view(), name='admin-product-mark-sold'),
    path('users/',              AdminUserListView.as_view(),           name='admin-users'),
    path('users/<int:pk>/block/', AdminUserBlockView.as_view(),        name='admin-user-block'),
    path('credits/assign/',     AdminAssignCreditView.as_view(),       name='admin-credit-assign'),
    path('credits/codes/',      AdminCreditCodeListCreateView.as_view(), name='admin-credit-codes'),
    path('credits/codes/<int:pk>/', AdminCreditCodeDetailView.as_view(), name='admin-credit-code-detail'),
]
