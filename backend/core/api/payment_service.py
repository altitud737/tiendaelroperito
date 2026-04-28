"""
Servicio de pagos con MercadoPago.
Centraliza toda la lógica de interacción con la API de MP.
"""
import logging
from decimal import Decimal
from django.conf import settings

import mercadopago

logger = logging.getLogger('payments')


def get_mp_sdk():
    """Retorna una instancia del SDK de MercadoPago configurada."""
    if not settings.MP_ACCESS_TOKEN:
        raise ValueError('MP_ACCESS_TOKEN no está configurado.')
    return mercadopago.SDK(settings.MP_ACCESS_TOKEN)


def create_payment(token, payment_method_id, issuer_id, installments, payer_email, amount, orden_id, payer_identification_type='', payer_identification_number=''):
    """
    Crea un pago en MercadoPago usando el token generado por Checkout Bricks.
    Retorna la respuesta completa de MP.
    """
    sdk = get_mp_sdk()

    payer = {
        'email': payer_email,
    }
    if payer_identification_type and payer_identification_number:
        payer['identification'] = {
            'type': payer_identification_type,
            'number': payer_identification_number,
        }

    payment_data = {
        'transaction_amount': float(amount),
        'token': token,
        'description': f'El Roperito — Orden #{orden_id}',
        'installments': int(installments),
        'payment_method_id': payment_method_id,
        'payer': payer,
        'external_reference': str(orden_id),
        'notification_url': settings.MP_WEBHOOK_URL,
        'statement_descriptor': 'ELROPERITO',
        'three_d_secure_mode': 'optional',
    }

    if issuer_id:
        try:
            payment_data['issuer_id'] = int(issuer_id)
        except (ValueError, TypeError):
            payment_data['issuer_id'] = issuer_id

    logger.info(
        'Creando pago en MP — Orden #%s — Monto: %s — Método: %s — Token: %s... — Issuer: %s — Installments: %s — Payer: %s — NotifURL: %s',
        orden_id, amount, payment_method_id, str(token)[:20], issuer_id, installments, payer_email, settings.MP_WEBHOOK_URL
    )

    result = sdk.payment().create(payment_data)

    logger.info(
        'Respuesta MP — Status HTTP: %s — Payment ID: %s — Status: %s',
        result.get('status'),
        result.get('response', {}).get('id'),
        result.get('response', {}).get('status')
    )

    return result


def create_preference(orden):
    """
    Crea una preferencia de Checkout Pro en MercadoPago.
    SEGURIDAD: precios y productos siempre desde la orden en BD, nunca del frontend.
    Retorna la respuesta completa de MP (incluye init_point para redirigir al usuario).
    """
    sdk = get_mp_sdk()

    items = []
    for item in orden.items.select_related('producto').all():
        items.append({
            'title': item.producto.nombre[:255],
            'quantity': 1,
            'unit_price': float(item.precio_unitario),
            'currency_id': 'ARS',
        })

    if not items:
        items = [{
            'title': 'Compra en El Roperito',
            'quantity': 1,
            'unit_price': float(orden.monto_pagado),
            'currency_id': 'ARS',
        }]

    if orden.shipping_cost and orden.shipping_cost > 0:
        items.append({
            'title': 'Envío a domicilio',
            'quantity': 1,
            'unit_price': float(orden.shipping_cost),
            'currency_id': 'ARS',
        })

    if orden.credito_usado and orden.credito_usado > 0:
        items.append({
            'title': 'Descuento código de crédito',
            'quantity': 1,
            'unit_price': -float(orden.credito_usado),
            'currency_id': 'ARS',
        })

    preference_data = {
        'items': items,
        'back_urls': {
            'success': settings.MP_BACK_URL_SUCCESS,
            'failure': settings.MP_BACK_URL_FAILURE,
            'pending': settings.MP_BACK_URL_PENDING,
        },
        'auto_return': 'approved',
        'external_reference': str(orden.pk),
        'notification_url': settings.MP_WEBHOOK_URL,
        'statement_descriptor': 'ELROPERITO',
        'metadata': {
            'orden_id': orden.pk,
            'usuario_id': orden.usuario_id,
        },
    }

    logger.info(
        'Creando preferencia MP — Orden #%s — Monto: %s — Items: %s — NotifURL: %s',
        orden.pk, orden.monto_pagado, len(items), settings.MP_WEBHOOK_URL
    )

    result = sdk.preference().create(preference_data)

    logger.info(
        'Preferencia MP creada — Status HTTP: %s — ID: %s — init_point: %s',
        result.get('status'),
        result.get('response', {}).get('id'),
        result.get('response', {}).get('init_point', '')[:80]
    )

    return result


def get_payment(payment_id):
    """
    Consulta un pago en MercadoPago por su ID.
    IMPORTANTE: Siempre verificar el pago con la API, nunca confiar solo en el webhook.
    """
    sdk = get_mp_sdk()

    logger.info('Consultando pago en MP — Payment ID: %s', payment_id)

    result = sdk.payment().get(payment_id)

    if result.get('status') == 200:
        logger.info(
            'Pago consultado — ID: %s — Status: %s — External Ref: %s',
            payment_id,
            result['response'].get('status'),
            result['response'].get('external_reference')
        )
    else:
        logger.warning(
            'Error al consultar pago — ID: %s — Status HTTP: %s',
            payment_id, result.get('status')
        )

    return result
