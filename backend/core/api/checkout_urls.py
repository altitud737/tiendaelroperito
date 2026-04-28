from django.urls import path
from .views import (
    CheckoutView, ProcessPaymentView, CheckoutWebhookView,
    CheckoutSuccessView, CheckoutConfigView, CreatePreferenceView,
)

urlpatterns = [
    path('', CheckoutView.as_view(), name='checkout'),
    path('process_payment/', ProcessPaymentView.as_view(), name='checkout-process-payment'),
    path('preference/', CreatePreferenceView.as_view(), name='checkout-preference'),
    path('webhook/', CheckoutWebhookView.as_view(), name='checkout-webhook'),
    path('success/', CheckoutSuccessView.as_view(), name='checkout-success'),
    path('config/', CheckoutConfigView.as_view(), name='checkout-config'),
]
