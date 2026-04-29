"""
Vistas para recuperación de contraseña.
Usa las vistas nativas de Django con templates personalizados.
Incluye un endpoint API para que el frontend SPA pueda solicitar el reset.
"""
import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.views import (
    PasswordResetConfirmView,
    PasswordResetCompleteView,
)
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .throttles import PasswordResetThrottle

logger = logging.getLogger(__name__)
Usuario = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetThrottle])
def password_reset_request(request):
    """
    POST /api/auth/password-reset/
    Body: { "email": "user@example.com" }

    Envía email con link de recuperación.
    Siempre responde 200 para no revelar si el email existe.
    """
    email = request.data.get('email', '').strip().lower()

    if email:
        form = PasswordResetForm(data={'email': email})
        if form.is_valid():
            # Construir dominio para los links del email
            frontend_url = getattr(settings, 'FRONTEND_URL', getattr(settings, 'BASE_URL', 'https://elroperitotienda.com.ar'))
            # Extraer dominio y protocolo
            if '://' in frontend_url:
                protocol = frontend_url.split('://')[0]
                domain = frontend_url.split('://')[1].rstrip('/')
            else:
                protocol = 'https'
                domain = frontend_url.rstrip('/')

            try:
                form.save(
                    subject_template_name='registration/password_reset_subject.txt',
                    email_template_name='registration/password_reset_email.html',
                    use_https=(protocol == 'https'),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    domain_override=domain,
                    token_generator=default_token_generator,
                )
            except Exception as exc:
                logger.error('password_reset send_mail failed: %s', exc, exc_info=True)

    return Response(
        {'detail': 'Si el email está registrado, recibirás un enlace para restablecer tu contraseña.'},
        status=status.HTTP_200_OK
    )


@method_decorator(csrf_exempt, name='dispatch')
class CustomPasswordResetConfirmView(PasswordResetConfirmView):
    """
    GET/POST /password-reset/<uidb64>/<token>/
    Muestra formulario para ingresar nueva contraseña.
    """
    template_name = 'registration/password_reset_confirm.html'
    success_url = '/password-reset/done/'


class CustomPasswordResetCompleteView(PasswordResetCompleteView):
    """
    GET /password-reset/done/
    Muestra confirmación de cambio exitoso.
    """
    template_name = 'registration/password_reset_complete.html'
