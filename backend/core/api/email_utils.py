"""
Utilidades de email para El Roperito.
"""
from django.core.mail import send_mail
from django.conf import settings
from django.utils.html import escape
import logging

logger = logging.getLogger('payments')


def send_credit_code_email(usuario, code_obj):
    """
    Envía email al usuario notificando que se le asignó un código de crédito.
    """
    monto_str = f"${int(code_obj.monto):,}".replace(",", ".")
    descripcion = code_obj.descripcion or "Crédito asignado por El Roperito"

    subject = f"🎉 ¡Tenés un código de descuento de {monto_str}!"

    message = (
        f"Hola {usuario.nombre},\n\n"
        f"¡Te asignamos un código de crédito!\n\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"  Código: {code_obj.codigo}\n"
        f"  Valor:  {monto_str}\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"Mensaje: {descripcion}\n\n"
        f"📋 ¿Cómo usarlo?\n"
        f"1. Agregá los productos que quieras al carrito\n"
        f"2. En el resumen de compra, ingresá tu código\n"
        f"3. Hacé click en \"Aplicar\" y el descuento se aplica automáticamente\n\n"
        f"⚠️ El código es de uso único y se consume completamente en una sola compra.\n\n"
        f"¡Gracias por ser parte de El Roperito!\n"
        f"— El equipo de El Roperito"
    )

    safe_nombre = escape(usuario.nombre)
    safe_codigo = escape(code_obj.codigo)
    safe_descripcion = escape(descripcion)
    safe_monto_str = escape(monto_str)

    html_message = f"""
    <div style="font-family:'Jost',Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a18;">
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:600;">¡Hola {safe_nombre}!</h2>
        <p style="margin:0 0 20px;font-size:15px;color:#555;">Te asignamos un código de crédito para tu próxima compra:</p>

        <div style="background:#f8f7f4;border:2px dashed #c9a96e;border-radius:12px;padding:24px;text-align:center;margin-bottom:20px;">
            <div style="font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Tu código</div>
            <div style="font-size:28px;font-weight:700;letter-spacing:3px;color:#1a1a18;font-family:monospace;">{safe_codigo}</div>
            <div style="margin-top:12px;font-size:20px;font-weight:600;color:#c9a96e;">Valor: {safe_monto_str}</div>
        </div>

        <p style="font-size:14px;color:#555;margin-bottom:16px;"><strong>Mensaje:</strong> {safe_descripcion}</p>

        <div style="background:rgba(40,167,69,0.06);border:1px solid rgba(40,167,69,0.2);border-radius:10px;padding:16px;margin-bottom:20px;">
            <p style="margin:0 0 8px;font-size:14px;font-weight:600;">¿Cómo usarlo?</p>
            <ol style="margin:0;padding-left:20px;font-size:13px;color:#555;line-height:1.8;">
                <li>Agregá los productos que quieras al carrito</li>
                <li>En el resumen de compra, ingresá tu código</li>
                <li>Hacé click en "Aplicar" y listo</li>
            </ol>
        </div>

        <p style="font-size:12px;color:#999;margin:0;">⚠️ El código es de uso único y se consume completamente en una sola compra.</p>

        <hr style="border:none;border-top:1px solid #eee;margin:24px 0 16px;">
        <p style="font-size:12px;color:#aaa;margin:0;text-align:center;">El Roperito — Ropa infantil con historia</p>
    </div>
    """

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else None,
            recipient_list=[usuario.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info('Email de código de crédito enviado a %s (código: %s)', usuario.email, code_obj.codigo)
        return True
    except Exception as e:
        logger.error('Error enviando email de crédito a %s: %s', usuario.email, str(e))
        return False
