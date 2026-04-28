"""
Clases de throttle personalizadas para endpoints sensibles.
"""
from rest_framework.throttling import AnonRateThrottle


class LoginThrottle(AnonRateThrottle):
    scope = 'login'


class PasswordResetThrottle(AnonRateThrottle):
    scope = 'password_reset'


class WebhookThrottle(AnonRateThrottle):
    scope = 'webhook'
