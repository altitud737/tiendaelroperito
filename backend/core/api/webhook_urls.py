"""
URL raíz /webhook para MercadoPago.
DECISIÓN: Se reutiliza el mismo CheckoutWebhookView pero con CSRF exempt
ya que MercadoPago envía POST sin token CSRF.
"""
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from .views import CheckoutWebhookView

urlpatterns = [
    path('', csrf_exempt(CheckoutWebhookView.as_view()), name='webhook-root'),
]
