import hashlib
import hmac
import logging
from decimal import Decimal, InvalidOperation
from django.conf import settings
from django.db import transaction
from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework import generics, status, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
import django_filters

from django.contrib.auth import get_user_model
from core.models import (
    Producto, ProductImage, CreditTransaction, CreditCode,
    Wishlist, Orden, OrdenItem, Payment, Notificacion,
    Talle, Categoria,
)
from .image_utils import validate_product_image
from .email_utils import send_credit_code_email
from .serializers import (
    RegisterSerializer, UsuarioSerializer,
    ProductoListSerializer, ProductoDetailSerializer,
    CreditTransactionSerializer, AdminAssignCreditSerializer,
    CreditCodeSerializer, RedeemCreditCodeSerializer,
    WishlistSerializer, WishlistAddSerializer,
    OrdenSerializer, OrdenListSerializer,
    CheckoutSerializer, ProcessPaymentSerializer,
    AdminProductoSerializer, AdminUsuarioSerializer,
    NotificacionSerializer,
    TalleSerializer, CategoriaSerializer,
)
from . import payment_service
from .throttles import LoginThrottle, PasswordResetThrottle, WebhookThrottle

logger = logging.getLogger('payments')

Usuario = get_user_model()


# =============================================================================
# AUTH
# =============================================================================

class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — Registrar nuevo usuario."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {'detail': 'Usuario creado exitosamente.', 'email': user.email},
            status=status.HTTP_201_CREATED
        )


class MeView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/auth/me/ — Datos del usuario logueado + credit_balance
    PATCH /api/auth/me/ — Actualizar nombre, apellido, phone
    """
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# =============================================================================
# PRODUCTOS
# =============================================================================

class ProductoFilter(django_filters.FilterSet):
    """
    DECISIÓN: Filtros por query params para el listado de productos.
    Incluye filtro de novedades (últimos 7 días).
    """
    novedades = django_filters.BooleanFilter(method='filter_novedades')

    class Meta:
        model = Producto
        fields = {
            'talle': ['exact'],
            'genero': ['exact'],
            'categoria': ['exact'],
            'estado': ['exact'],
        }

    def filter_novedades(self, queryset, name, value):
        if value:
            from django.utils import timezone
            from datetime import timedelta
            fecha_limite = timezone.now() - timedelta(days=7)
            return queryset.filter(fecha_publicacion__gte=fecha_limite)
        return queryset


class ProductoListView(generics.ListAPIView):
    """
    GET /api/products/ — Listado de productos con filtros.
    DECISIÓN: Solo muestra productos disponibles por defecto.
    Incluye total_count en la respuesta.
    """
    serializer_class = ProductoListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductoFilter
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['precio', 'fecha_publicacion']
    ordering = ['-fecha_publicacion']

    def get_queryset(self):
        # DECISIÓN: Por defecto solo productos disponibles y no eliminados.
        return Producto.objects.filter(estado='disponible', eliminado=False).prefetch_related('imagenes')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        total_count = queryset.count()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            response.data['total_count'] = total_count
            return response
        serializer = self.get_serializer(queryset, many=True)
        return Response({'results': serializer.data, 'total_count': total_count})


class ProductoDetailView(generics.RetrieveAPIView):
    """GET /api/products/:slug/ — Detalle completo del producto."""
    serializer_class = ProductoDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

    def get_queryset(self):
        # DECISIÓN: Se permite ver productos vendidos (con badge) pero no reservados
        return Producto.objects.exclude(estado='reservado').prefetch_related('imagenes')


class ProductoFeaturedView(generics.ListAPIView):
    """GET /api/products/featured/ — Hasta 8 productos destacados para el Home."""
    serializer_class = ProductoListSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        return (
            Producto.objects
            .filter(es_destacado=True, estado='disponible', eliminado=False)
            .prefetch_related('imagenes')[:8]
        )


# =============================================================================
# NOTIFICACIONES
# =============================================================================

class NotificacionListView(APIView):
    """GET /api/notifications/ — Notificaciones del usuario logueado."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        notifs = Notificacion.objects.filter(usuario=request.user)[:50]
        serializer = NotificacionSerializer(notifs, many=True)
        unread = Notificacion.objects.filter(usuario=request.user, leida=False).count()
        return Response({'unread': unread, 'results': serializer.data})


class NotificacionMarkReadView(APIView):
    """POST /api/notifications/read/ — Marcar notificaciones como leídas."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ids = request.data.get('ids', [])
        if ids:
            Notificacion.objects.filter(usuario=request.user, pk__in=ids).update(leida=True)
        else:
            Notificacion.objects.filter(usuario=request.user, leida=False).update(leida=True)
        unread = Notificacion.objects.filter(usuario=request.user, leida=False).count()
        return Response({'unread': unread})


# =============================================================================
# CRÉDITO
# =============================================================================

class CreditHistoryView(generics.ListAPIView):
    """GET /api/credits/history/ — Historial de crédito del usuario logueado."""
    serializer_class = CreditTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CreditTransaction.objects.filter(usuario=self.request.user)


class MyCodesView(APIView):
    """GET /api/credits/my-codes/ — Códigos de crédito asignados al usuario."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        codes = CreditCode.objects.filter(usuario=request.user).order_by('-fecha_creacion')
        serializer = CreditCodeSerializer(codes, many=True)
        return Response(serializer.data)


class RedeemCreditCodeView(APIView):
    """POST /api/credits/redeem/ — Canjear un código de crédito personal."""
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = RedeemCreditCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        codigo_str = serializer.validated_data['codigo'].strip().upper()
        user = request.user

        try:
            code = CreditCode.objects.select_for_update().get(codigo=codigo_str)
        except CreditCode.DoesNotExist:
            return Response(
                {'detail': 'Código no válido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Seguridad: solo el usuario asignado puede canjearlo
        if code.usuario_id != user.id:
            return Response(
                {'detail': 'Código no válido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if code.usado:
            return Response(
                {'detail': 'Este código ya fue utilizado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Marcar como usado
        code.usado = True
        code.fecha_uso = timezone.now()
        code.save()

        # Acreditar saldo
        user.credit_balance += code.monto
        user.save()

        # Registrar transacción
        CreditTransaction.objects.create(
            usuario=user,
            monto=code.monto,
            tipo='credito',
            descripcion=f'Código canjeado: {code.codigo}'
        )

        return Response({
            'detail': f'¡Código canjeado! Se acreditaron ${code.monto} a tu cuenta.',
            'monto': float(code.monto),
            'nuevo_saldo': float(user.credit_balance),
        })


# =============================================================================
# WISHLIST
# =============================================================================

class WishlistView(generics.RetrieveAPIView):
    """GET /api/wishlist/ — Wishlist del usuario logueado."""
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # DECISIÓN: Se crea la wishlist automáticamente si no existe
        wishlist, _ = Wishlist.objects.get_or_create(usuario=self.request.user)
        return wishlist


class WishlistAddView(APIView):
    """POST /api/wishlist/add/ — Agregar producto a la wishlist."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = WishlistAddSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        wishlist, _ = Wishlist.objects.get_or_create(usuario=request.user)
        producto = Producto.objects.get(id=serializer.validated_data['product_id'])
        wishlist.productos.add(producto)
        return Response({'detail': 'Producto agregado a tu wishlist.'}, status=status.HTTP_201_CREATED)


class WishlistRemoveView(APIView):
    """DELETE /api/wishlist/remove/:id/ — Quitar producto de la wishlist."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, product_id):
        try:
            wishlist = Wishlist.objects.get(usuario=request.user)
            wishlist.productos.remove(product_id)
            return Response({'detail': 'Producto removido de tu wishlist.'})
        except Wishlist.DoesNotExist:
            return Response(
                {'detail': 'Wishlist no encontrada.'},
                status=status.HTTP_404_NOT_FOUND
            )


# =============================================================================
# CHECKOUT
# =============================================================================

class CheckoutView(APIView):
    """
    POST /api/checkout/ — Crear orden con datos de envío.
    Paso 1 del flujo: crea la orden en estado pending_payment.
    El pago se procesa después con ProcessPaymentView (Checkout Bricks).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        product_ids = [item['product_id'] for item in data['items']]
        codigo_credito = data.get('codigo_credito', '').strip().upper()
        shipping_type = data['shipping_type']

        with transaction.atomic():
            # Cancelar órdenes pendientes anteriores del usuario
            stale_orders = Orden.objects.filter(
                usuario=request.user, estado='pending_payment'
            ).select_for_update()
            for stale in stale_orders:
                stale.estado = 'cancelled'
                stale.save()
                # Si la orden cancelada tenía un código, liberar el código
                if stale.codigo_credito_usado:
                    try:
                        old_code = CreditCode.objects.get(pk=stale.codigo_credito_usado.pk)
                        old_code.usado = False
                        old_code.fecha_uso = None
                        old_code.save()
                    except CreditCode.DoesNotExist:
                        pass
                logger.info('Orden pendiente #%s cancelada automáticamente.', stale.pk)

            # Validar código de crédito si se proporcionó
            credit_code = None
            credito_usado = Decimal('0')
            if codigo_credito:
                try:
                    credit_code = CreditCode.objects.select_for_update().get(codigo=codigo_credito)
                except CreditCode.DoesNotExist:
                    return Response({'detail': 'Código de crédito no válido.'}, status=status.HTTP_400_BAD_REQUEST)

                if credit_code.usuario_id != request.user.id:
                    return Response({'detail': 'Código de crédito no válido.'}, status=status.HTTP_400_BAD_REQUEST)

                if credit_code.usado:
                    return Response({'detail': 'Este código ya fue utilizado.'}, status=status.HTTP_400_BAD_REQUEST)

            # Verificar y bloquear productos
            productos = list(
                Producto.objects.select_for_update()
                .filter(id__in=product_ids, estado='disponible')
            )

            if len(productos) != len(product_ids):
                return Response(
                    {'detail': 'Uno o más productos ya no están disponibles.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            total = sum(p.precio for p in productos)

            # Calcular costo de envío
            shipping_cost = Decimal('0')
            if shipping_type == 'envio':
                shipping_cost = Decimal(str(settings.SHIPPING_COST))

            total_con_envio = total + shipping_cost
            monto_a_pagar = total_con_envio

            # Aplicar código de crédito como descuento directo (se consume completo)
            if credit_code:
                credito_usado = min(credit_code.monto, total_con_envio)
                monto_a_pagar = total_con_envio - credito_usado

                # Marcar código como usado
                credit_code.usado = True
                credit_code.fecha_uso = timezone.now()
                credit_code.save()

                # Registrar transacción de crédito
                CreditTransaction.objects.create(
                    usuario=request.user,
                    monto=credito_usado,
                    tipo='debito',
                    descripcion=f'Código {credit_code.codigo} aplicado en compra'
                )

            # Crear orden
            orden = Orden.objects.create(
                usuario=request.user,
                total=total,
                credito_usado=credito_usado,
                monto_pagado=monto_a_pagar,
                estado='pending_payment',
                shipping_type=shipping_type,
                shipping_cost=shipping_cost,
                address_street=data.get('address_street', ''),
                address_number=data.get('address_number', ''),
                address_city=data.get('address_city', ''),
                address_zip=data.get('address_zip', ''),
                address_province=data.get('address_province', ''),
                codigo_credito_usado=credit_code,
            )

            # Crear ítems de orden (productos siguen disponibles hasta el pago)
            for producto in productos:
                OrdenItem.objects.create(
                    orden=orden,
                    producto=producto,
                    precio_unitario=producto.precio
                )

            # Si monto a pagar es 0 (cubierto por crédito), marcar como pagado y productos como vendidos
            if monto_a_pagar <= 0:
                orden.estado = 'paid'
                orden.save()
                for producto in productos:
                    producto.estado = 'vendido'
                    producto.save()

                logger.info('Orden #%s pagada completamente con código %s.', orden.pk, credit_code.codigo)
                return Response({
                    'detail': 'Orden pagada con crédito.',
                    'orden_id': orden.pk,
                    'paid_with_credit': True,
                })

            logger.info(
                'Orden #%s creada — Total: %s — Envío: %s — Crédito: %s — A pagar: %s',
                orden.pk, total, shipping_cost, credito_usado, monto_a_pagar
            )

            return Response({
                'orden_id': orden.pk,
                'total': float(total),
                'shipping_cost': float(shipping_cost),
                'credito_usado': float(credito_usado),
                'monto_a_pagar': float(monto_a_pagar),
            }, status=status.HTTP_201_CREATED)


class ProcessPaymentView(APIView):
    """
    POST /api/checkout/process_payment/ — Procesa pago con Checkout Bricks.
    Paso 2 del flujo: recibe el token de Bricks y crea el pago en MP.
    NUNCA confiar en datos del frontend para el monto — se recalcula desde la orden.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ProcessPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        try:
            orden = Orden.objects.get(
                pk=data['orden_id'],
                usuario=request.user,
                estado='pending_payment'
            )
        except Orden.DoesNotExist:
            return Response(
                {'detail': 'Orden no encontrada o ya fue procesada.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # SEGURIDAD: El monto se toma de la orden, NUNCA del frontend
        amount = orden.monto_pagado

        try:
            result = payment_service.create_payment(
                token=data['token'],
                payment_method_id=data['payment_method_id'],
                issuer_id=data.get('issuer_id', ''),
                installments=data['installments'],
                payer_email=data['payer_email'],
                amount=amount,
                orden_id=orden.pk,
                payer_identification_type=data.get('payer_identification_type', ''),
                payer_identification_number=data.get('payer_identification_number', ''),
            )

            if result.get('status') not in (200, 201):
                logger.error(
                    'Error MP al crear pago — Orden #%s — Response: %s',
                    orden.pk, result
                )
                # Liberar productos y cancelar orden
                self._release_order(orden)
                return Response({
                    'detail': 'Error al procesar el pago en MercadoPago.',
                    'mp_error': result.get('response', {}),
                }, status=status.HTTP_400_BAD_REQUEST)

            mp_response = result['response']
            mp_payment_id = str(mp_response.get('id', ''))
            mp_status = mp_response.get('status', 'pending')
            mp_status_detail = mp_response.get('status_detail', '')

            # Registrar pago en la base de datos
            payment = Payment.objects.create(
                orden=orden,
                mp_payment_id=mp_payment_id,
                status=mp_status,
                status_detail=mp_status_detail,
                amount=amount,
                payment_method=mp_response.get('payment_method_id', ''),
                payment_type=mp_response.get('payment_type_id', ''),
                installments=mp_response.get('installments', 1),
                mp_response=mp_response,
            )

            # Actualizar orden según estado del pago
            if mp_status == 'approved':
                orden.estado = 'paid'
                orden.referencia_mp = mp_payment_id
                orden.save()
                for item in orden.items.select_related('producto').all():
                    item.producto.estado = 'vendido'
                    item.producto.save()
                logger.info('Pago aprobado — Orden #%s — Payment: %s', orden.pk, mp_payment_id)

            elif mp_status in ('rejected', 'cancelled'):
                orden.referencia_mp = mp_payment_id
                orden.save()
                self._release_order(orden)
                logger.warning('Pago rechazado — Orden #%s — Status: %s', orden.pk, mp_status)

            elif mp_status == 'in_process':
                orden.referencia_mp = mp_payment_id
                orden.save()
                logger.info('Pago en proceso — Orden #%s — Payment: %s', orden.pk, mp_payment_id)

            return Response({
                'orden_id': orden.pk,
                'payment_id': payment.pk,
                'mp_payment_id': mp_payment_id,
                'status': mp_status,
                'status_detail': mp_status_detail,
            })

        except ValueError as e:
            logger.error('MP no configurado: %s', str(e))
            self._release_order(orden)
            return Response({
                'detail': str(e),
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        except Exception as e:
            logger.exception('Error inesperado procesando pago — Orden #%s', orden.pk)
            self._release_order(orden)
            return Response({
                'detail': 'Error interno al procesar el pago.',
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @staticmethod
    def _release_order(orden):
        """Cancela la orden."""
        orden.estado = 'cancelled'
        orden.save()
        # Liberar código de crédito si se usó
        if orden.codigo_credito_usado:
            orden.codigo_credito_usado.usado = False
            orden.codigo_credito_usado.fecha_uso = None
            orden.codigo_credito_usado.save()
        logger.info('Orden #%s cancelada.', orden.pk)


class CheckoutConfigView(APIView):
    """GET /api/checkout/config/ — Retorna la public key de MP para inicializar Bricks."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        public_key = settings.MP_PUBLIC_KEY
        return Response({
            'public_key': public_key if public_key else None,
            'configured': bool(public_key),
            'shipping_cost': float(settings.SHIPPING_COST),
        })


class CreatePreferenceView(APIView):
    """
    POST /api/checkout/preference/ — Crea preferencia de Checkout Pro en MP.
    Paso alternativo al Bricks: redirige al usuario al checkout hosteado por MP.
    SEGURIDAD: el monto se toma de la orden en BD, nunca del frontend.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        orden_id = request.data.get('orden_id')
        if not orden_id:
            return Response({'detail': 'orden_id requerido.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            orden = Orden.objects.get(
                pk=orden_id,
                usuario=request.user,
                estado='pending_payment'
            )
        except Orden.DoesNotExist:
            return Response(
                {'detail': 'Orden no encontrada o ya fue procesada.'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            result = payment_service.create_preference(orden)

            if result.get('status') not in (200, 201):
                logger.error(
                    'Error MP al crear preferencia — Orden #%s — Response: %s',
                    orden.pk, result
                )
                return Response({
                    'detail': 'Error al crear la preferencia en MercadoPago.',
                    'mp_error': result.get('response', {}),
                }, status=status.HTTP_400_BAD_REQUEST)

            preference = result['response']
            return Response({
                'preference_id': preference.get('id'),
                'init_point': preference.get('init_point'),
                'sandbox_init_point': preference.get('sandbox_init_point'),
                'orden_id': orden.pk,
            }, status=status.HTTP_201_CREATED)

        except ValueError as e:
            logger.error('MP no configurado: %s', str(e))
            return Response({'detail': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        except Exception as e:
            logger.exception('Error inesperado creando preferencia — Orden #%s', orden.pk)
            return Response({'detail': 'Error interno.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CheckoutWebhookView(APIView):
    """
    POST /api/checkout/webhook/ — Recibe notificación de MercadoPago.
    REGLAS:
    - Siempre responde 200 OK (nunca romper)
    - Consulta el pago DIRECTAMENTE en la API de MP (nunca confiar en el body)
    - Registra todo en Payment y actualiza la Orden
    - Manejo robusto de errores con logging
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [WebhookThrottle]

    def _verify_signature(self, request):
        """
        Verifica firma HMAC-SHA256 de MercadoPago.
        Formato header: x-signature: ts=<timestamp>,v1=<hmac>
        Manifest: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
        Retorna True si válida o si no hay secret configurado (modo permisivo).
        """
        secret = getattr(settings, 'MP_WEBHOOK_SECRET', '')
        if not secret:
            return True

        x_signature = request.headers.get('X-Signature', '')
        x_request_id = request.headers.get('X-Request-Id', '')

        ts = ''
        v1 = ''
        for part in x_signature.split(','):
            part = part.strip()
            if part.startswith('ts='):
                ts = part[3:]
            elif part.startswith('v1='):
                v1 = part[3:]

        if not ts or not v1:
            logger.warning('Webhook sin firma válida — x-signature: %s', x_signature)
            return False

        data_id = request.data.get('data', {}).get('id', '')
        manifest = f'id:{data_id};request-id:{x_request_id};ts:{ts};'

        expected = hmac.new(
            secret.encode('utf-8'),
            manifest.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected, v1):
            logger.warning('Webhook firma inválida — Manifest: %s', manifest)
            return False

        return True

    def post(self, request):
        logger.info('Webhook recibido — Body: %s — Query: %s', request.data, request.query_params)

        if not self._verify_signature(request):
            logger.warning('Webhook rechazado por firma inválida')
            return Response({'status': 'ok'})

        try:
            topic = request.data.get('type') or request.query_params.get('topic')

            if topic != 'payment':
                logger.info('Webhook ignorado — Topic: %s', topic)
                return Response({'status': 'ok'})

            # Extraer payment_id
            payment_id = request.data.get('data', {}).get('id')
            if not payment_id:
                payment_id = request.query_params.get('id')

            if not payment_id:
                logger.warning('Webhook sin payment_id — Body: %s', request.data)
                return Response({'status': 'ok'})

            # SEGURIDAD: Consultar el pago DIRECTAMENTE en la API de MP
            result = payment_service.get_payment(payment_id)

            if result.get('status') != 200:
                logger.error(
                    'Error al consultar pago en MP — Payment ID: %s — HTTP: %s',
                    payment_id, result.get('status')
                )
                return Response({'status': 'ok'})

            payment_data = result['response']
            external_ref = payment_data.get('external_reference')
            mp_status = payment_data.get('status')
            mp_status_detail = payment_data.get('status_detail', '')
            mp_amount = Decimal(str(payment_data.get('transaction_amount', 0)))

            if not external_ref:
                logger.warning('Pago sin external_reference — Payment ID: %s', payment_id)
                return Response({'status': 'ok'})

            # Buscar la orden
            try:
                orden = Orden.objects.get(pk=external_ref)
            except Orden.DoesNotExist:
                logger.error('Orden no encontrada — external_reference: %s', external_ref)
                return Response({'status': 'ok'})

            # Registrar o actualizar Payment
            payment, created = Payment.objects.update_or_create(
                mp_payment_id=str(payment_id),
                defaults={
                    'orden': orden,
                    'status': mp_status,
                    'status_detail': mp_status_detail,
                    'amount': mp_amount,
                    'payment_method': payment_data.get('payment_method_id', ''),
                    'payment_type': payment_data.get('payment_type_id', ''),
                    'installments': payment_data.get('installments', 1),
                    'mp_response': payment_data,
                }
            )

            action = 'creado' if created else 'actualizado'
            logger.info(
                'Payment %s — ID: %s — Orden #%s — Status: %s',
                action, payment_id, orden.pk, mp_status
            )

            # Actualizar orden según estado del pago
            with transaction.atomic():
                if mp_status == 'approved' and orden.estado == 'pending_payment':
                    orden.estado = 'paid'
                    orden.referencia_mp = str(payment_id)
                    orden.save()
                    for item in orden.items.select_related('producto').all():
                        item.producto.estado = 'vendido'
                        item.producto.save()
                    logger.info('Orden #%s marcada como PAGADA via webhook.', orden.pk)

                elif mp_status in ('rejected', 'cancelled') and orden.estado == 'pending_payment':
                    orden.estado = 'cancelled'
                    orden.referencia_mp = str(payment_id)
                    orden.save()
                    # Revertir crédito
                    if orden.credito_usado > 0:
                        orden.usuario.credit_balance += orden.credito_usado
                        orden.usuario.save()
                        CreditTransaction.objects.create(
                            usuario=orden.usuario,
                            monto=orden.credito_usado,
                            tipo='credito',
                            descripcion=f'Reembolso webhook — Orden #{orden.pk}'
                        )
                    logger.warning('Orden #%s CANCELADA via webhook — Status: %s', orden.pk, mp_status)

        except Exception as e:
            logger.exception('Error procesando webhook: %s', str(e))

        # SIEMPRE responder 200 OK
        return Response({'status': 'ok'})


class CheckoutSuccessView(APIView):
    """GET /api/checkout/success/ — Callback de retorno post-pago."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        orden_id = request.query_params.get('orden_id')
        mp_status = request.query_params.get('status', 'success')

        if not orden_id:
            return Response({'detail': 'orden_id requerido.'}, status=400)

        try:
            orden = Orden.objects.get(pk=orden_id, usuario=request.user)
            return Response({
                'orden_id': orden.pk,
                'estado': orden.estado,
                'total': float(orden.total),
                'shipping_cost': float(orden.shipping_cost),
                'monto_pagado': float(orden.monto_pagado),
                'mp_status': mp_status,
            })
        except Orden.DoesNotExist:
            return Response({'detail': 'Orden no encontrada.'}, status=404)


# =============================================================================
# ÓRDENES
# =============================================================================

class OrdenListView(generics.ListAPIView):
    """GET /api/orders/ — Historial de órdenes del usuario logueado."""
    serializer_class = OrdenListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Orden.objects.filter(usuario=self.request.user).prefetch_related(
            'items__producto__imagenes'
        ).order_by('-fecha')


class OrdenDetailView(generics.RetrieveAPIView):
    """GET /api/orders/:id/ — Detalle de una orden."""
    serializer_class = OrdenSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Orden.objects.filter(usuario=self.request.user).prefetch_related(
            'items__producto__imagenes'
        )


# =============================================================================
# ADMIN — Solo accesible con is_staff=True
# =============================================================================

class IsAdminUser(permissions.BasePermission):
    """Permiso exclusivo para usuarios con is_staff=True."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class AdminProductListCreateView(APIView):
    """
    GET  /api/admin/products/ — Todos los productos (cualquier estado, excluye eliminados)
    POST /api/admin/products/ — Crear producto (acepta multipart para imagen)
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        productos = Producto.objects.filter(eliminado=False).prefetch_related('imagenes').order_by('-fecha_publicacion')
        serializer = AdminProductoSerializer(productos, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        imagen_files = request.FILES.getlist('imagen')
        if imagen_files:
            for img in imagen_files:
                validate_product_image(img)
            if len(imagen_files) > 2:
                return Response(
                    {'detail': 'Máximo 2 imágenes permitidas.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        serializer = AdminProductoSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        producto = serializer.save()

        if imagen_files:
            for i, img in enumerate(imagen_files):
                ProductImage.objects.create(
                    producto=producto,
                    imagen=img,
                    orden=i,
                    es_principal=(i == 0)
                )

        return Response(
            AdminProductoSerializer(producto, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class AdminProductDetailView(APIView):
    """
    GET    /api/admin/products/:id/ — Detalle
    PATCH  /api/admin/products/:id/ — Editar campos
    DELETE /api/admin/products/:id/ — Eliminar
    """
    permission_classes = [IsAdminUser]

    def _get_producto(self, pk):
        try:
            return Producto.objects.prefetch_related('imagenes').get(pk=pk)
        except Producto.DoesNotExist:
            return None

    def get(self, request, pk):
        producto = self._get_producto(pk)
        if not producto:
            return Response({'detail': 'No encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AdminProductoSerializer(producto, context={'request': request}).data)

    def patch(self, request, pk):
        producto = self._get_producto(pk)
        if not producto:
            return Response({'detail': 'No encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        imagen_file = request.FILES.get('imagen')
        if imagen_file:
            validate_product_image(imagen_file)

        serializer = AdminProductoSerializer(
            producto, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        producto = serializer.save()

        if imagen_file:
            # Eliminar imagen anterior y guardar nueva
            old_images = list(ProductImage.objects.filter(producto=producto))
            for old_img in old_images:
                old_img.imagen.delete(save=False)  # borra el archivo físico
            ProductImage.objects.filter(producto=producto).delete()
            ProductImage.objects.create(
                producto=producto,
                imagen=imagen_file,
                orden=0,
                es_principal=True
            )

        return Response(AdminProductoSerializer(producto, context={'request': request}).data)

    def delete(self, request, pk):
        producto = self._get_producto(pk)
        if not producto:
            return Response({'detail': 'No encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        # Soft delete — preserva métricas históricas
        producto.eliminado = True
        producto.fecha_eliminacion = timezone.now()
        producto.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminProductPauseView(APIView):
    """PATCH /api/admin/products/:id/pause/ — Alternar pausado/disponible."""
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            producto = Producto.objects.get(pk=pk)
        except Producto.DoesNotExist:
            return Response({'detail': 'No encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if producto.estado == 'pausado':
            producto.estado = 'disponible'
        elif producto.estado == 'disponible':
            producto.estado = 'pausado'
        else:
            return Response(
                {'detail': f'No se puede pausar/reactivar un producto en estado "{producto.estado}".'},
                status=status.HTTP_400_BAD_REQUEST
            )
        producto.save()
        return Response({'estado': producto.estado})


class AdminUserListView(generics.ListAPIView):
    """GET /api/admin/users/ — Lista de todos los usuarios (excluye al propio admin)."""
    serializer_class = AdminUsuarioSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return (
            Usuario.objects
            .exclude(pk=self.request.user.pk)
            .order_by('-date_joined')
        )


class AdminUserBlockView(APIView):
    """PATCH /api/admin/users/:id/block/ — Alternar bloqueo de usuario."""
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            usuario = Usuario.objects.get(pk=pk)
        except Usuario.DoesNotExist:
            return Response({'detail': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if usuario.is_staff:
            return Response(
                {'detail': 'No se puede bloquear a un administrador.'},
                status=status.HTTP_403_FORBIDDEN
            )

        usuario.is_active = not usuario.is_active
        usuario.save()
        return Response({'is_active': usuario.is_active})


class AdminProductMarkSoldView(APIView):
    """PATCH /api/admin/products/:id/mark-sold/ — Cambiar reservado → vendido."""
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            producto = Producto.objects.get(pk=pk)
        except Producto.DoesNotExist:
            return Response({'detail': 'No encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if producto.estado != 'reservado':
            return Response(
                {'detail': f'Solo se puede marcar como vendido un producto reservado (actual: {producto.estado}).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        producto.estado = 'vendido'
        producto.save()

        # También actualizar la orden asociada si existe
        orden_item = (
            producto.orden_items
            .select_related('orden')
            .filter(orden__estado='pending_payment')
            .first()
        )
        if orden_item:
            orden_item.orden.estado = 'paid'
            orden_item.orden.save()

        return Response({'estado': producto.estado})


class AdminDashboardView(APIView):
    """
    GET /api/admin/dashboard/ — Métricas del admin.
    Incluye todos los productos (incluso eliminados) para métricas precisas.
    Soporta ?year=YYYY para filtrar por año.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        year = request.query_params.get('year')

        # Años disponibles (para el selector)
        years_qs = Producto.objects.values_list('fecha_publicacion__year', flat=True).distinct().order_by('-fecha_publicacion__year')
        available_years = sorted(set(years_qs), reverse=True)

        # Base querysets
        productos_qs = Producto.objects.all()
        ordenes_qs = Orden.objects.all()

        if year:
            year = int(year)
            productos_qs = productos_qs.filter(fecha_publicacion__year=year)
            ordenes_qs = ordenes_qs.filter(fecha__year=year)

        # Producto stats (incluye eliminados para métricas históricas)
        total_productos = productos_qs.count()
        disponibles = productos_qs.filter(estado='disponible', eliminado=False).count()
        pausados = productos_qs.filter(estado='pausado', eliminado=False).count()
        reservados = productos_qs.filter(estado='reservado', eliminado=False).count()
        vendidos = productos_qs.filter(estado='vendido').count()

        # Dinero — ventas concretadas (órdenes pagadas o completadas)
        ordenes_pagadas = ordenes_qs.filter(estado__in=['paid', 'shipped', 'ready_for_pickup', 'completed'])
        ingresos = ordenes_pagadas.aggregate(total=Sum('total'))['total'] or Decimal('0')
        cantidad_ordenes = ordenes_pagadas.count()

        # Dinero reservado (órdenes pending)
        ordenes_pending = ordenes_qs.filter(estado='pending_payment')
        dinero_reservado = ordenes_pending.aggregate(total=Sum('total'))['total'] or Decimal('0')

        # Consignación — monto total pendiente a pagar
        monto_consignantes = (
            productos_qs
            .filter(estado='vendido', monto_consignante__gt=0)
            .aggregate(total=Sum('monto_consignante'))['total']
        ) or Decimal('0')

        # Métricas por mes (último año o año seleccionado)
        if year:
            target_year = year
        else:
            target_year = timezone.now().year

        monthly = []
        for month in range(1, 13):
            month_orders = Orden.objects.filter(
                fecha__year=target_year,
                fecha__month=month,
                estado__in=['paid', 'shipped', 'ready_for_pickup', 'completed']
            )
            month_total = month_orders.aggregate(total=Sum('total'))['total'] or Decimal('0')
            month_count = month_orders.count()
            monthly.append({
                'mes': month,
                'ingresos': float(month_total),
                'ordenes': month_count,
            })

        return Response({
            'available_years': available_years,
            'year': target_year,
            'productos': {
                'total': total_productos,
                'disponibles': disponibles,
                'pausados': pausados,
                'reservados': reservados,
                'vendidos': vendidos,
            },
            'ventas': {
                'cantidad_ordenes': cantidad_ordenes,
                'ingresos': float(ingresos),
                'dinero_reservado': float(dinero_reservado),
                'monto_consignantes': float(monto_consignantes),
            },
            'mensual': monthly,
        })


# ─── Admin: Créditos ──────────────────────────────────────────────────────────

class AdminAssignCreditView(APIView):
    """POST /api/admin/credits/assign/ — Asignar crédito manual a un usuario."""
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def post(self, request):
        serializer = AdminAssignCreditSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        usuario = Usuario.objects.get(pk=data['usuario_id'])

        usuario.credit_balance += data['monto']
        usuario.save()

        CreditTransaction.objects.create(
            usuario=usuario,
            monto=data['monto'],
            tipo='credito',
            descripcion=data['descripcion']
        )

        return Response({
            'detail': f'Se asignaron ${data["monto"]} de crédito a {usuario.email}.',
            'nuevo_saldo': float(usuario.credit_balance),
        })


class AdminCreditCodeListCreateView(APIView):
    """
    GET  /api/admin/credits/codes/     — Listar todos los códigos asignados
    POST /api/admin/credits/codes/     — Crear un código para un usuario específico
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        codes = CreditCode.objects.select_related('usuario').all()
        serializer = CreditCodeSerializer(codes, many=True)
        return Response(serializer.data)

    def post(self, request):
        usuario_id = request.data.get('usuario_id')
        monto = request.data.get('monto')
        descripcion = request.data.get('descripcion', '')

        if not usuario_id:
            return Response({'detail': 'Seleccioná un usuario.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            usuario = Usuario.objects.get(pk=usuario_id, is_active=True)
        except Usuario.DoesNotExist:
            return Response({'detail': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            monto_dec = Decimal(str(monto))
            if monto_dec <= 0:
                raise ValueError
        except (TypeError, ValueError, InvalidOperation):
            return Response({'detail': 'Monto inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        code = CreditCode.objects.create(
            usuario=usuario,
            monto=monto_dec,
            descripcion=descripcion,
            creado_por=request.user,
        )

        # Notificación interna al usuario
        monto_str = f"${int(code.monto):,}".replace(",", ".")
        Notificacion.objects.create(
            usuario=usuario,
            titulo=f'¡Tenés un código de descuento de {monto_str}!',
            mensaje=f'Tu código es: {code.codigo}\nValor: {monto_str}\n{descripcion or "Crédito asignado por El Roperito"}\n\nPodés usarlo en tu próxima compra ingresándolo en el carrito.',
        )

        serializer = CreditCodeSerializer(code)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminCreditCodeDetailView(APIView):
    """
    PATCH  /api/admin/credits/codes/:id/ — Editar código (activo, monto, etc.)
    DELETE /api/admin/credits/codes/:id/ — Eliminar código
    """
    permission_classes = [IsAdminUser]

    def _get_code(self, pk):
        try:
            return CreditCode.objects.get(pk=pk)
        except CreditCode.DoesNotExist:
            return None

    def patch(self, request, pk):
        code = self._get_code(pk)
        if not code:
            return Response({'detail': 'Código no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CreditCodeSerializer(code, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        code = self._get_code(pk)
        if not code:
            return Response({'detail': 'Código no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        code.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =============================================================================
# TALLE / CATEGORÍA — endpoints públicos (lectura) y admin (escritura)
# =============================================================================

class TalleListView(generics.ListAPIView):
    """GET /api/talles/ — Lista pública de talles disponibles."""
    queryset = Talle.objects.all()
    serializer_class = TalleSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class CategoriaListView(generics.ListAPIView):
    """GET /api/categorias/ — Lista pública de categorías disponibles."""
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class AdminTalleListCreateView(APIView):
    """
    GET  /api/admin/talles/ — Listar talles
    POST /api/admin/talles/ — Crear talle  { nombre, orden? }
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        talles = Talle.objects.all()
        return Response(TalleSerializer(talles, many=True).data)

    def post(self, request):
        serializer = TalleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminTalleDeleteView(APIView):
    """DELETE /api/admin/talles/:id/ — Eliminar talle."""
    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        try:
            talle = Talle.objects.get(pk=pk)
        except Talle.DoesNotExist:
            return Response({'detail': 'Talle no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        talle.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminCategoriaListCreateView(APIView):
    """
    GET  /api/admin/categorias/ — Listar categorías
    POST /api/admin/categorias/ — Crear categoría  { nombre }
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        categorias = Categoria.objects.all()
        return Response(CategoriaSerializer(categorias, many=True).data)

    def post(self, request):
        serializer = CategoriaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminCategoriaDeleteView(APIView):
    """DELETE /api/admin/categorias/:id/ — Eliminar categoría."""
    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        try:
            cat = Categoria.objects.get(pk=pk)
        except Categoria.DoesNotExist:
            return Response({'detail': 'Categoría no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        cat.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
