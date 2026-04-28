from django.urls import path
from .views import NotificacionListView, NotificacionMarkReadView

urlpatterns = [
    path('', NotificacionListView.as_view(), name='notifications-list'),
    path('read/', NotificacionMarkReadView.as_view(), name='notifications-read'),
]
