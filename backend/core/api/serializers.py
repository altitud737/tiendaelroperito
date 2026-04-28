from rest_framework import serializers
from django.contrib.auth import get_user_model
from core.models import (
    CreditTransaction, CreditCode,
    Producto, ProductImage,
    Orden, OrdenItem, Wishlist, Payment,
    Notificacion
)

Usuario = get_user_model()


# =============================================================================
# AUTH
# =============================================================================

class RegisterSerializer(serializers.ModelSerializer):
    """Serializer para registro de usuario."""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = ('email', 'nombre', 'apellido', 'password', 'password_confirm', 'phone')

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Las contraseñas no coinciden.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        return Usuario.objects.create_user(**validated_data)


class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer para datos del usuario logueado."""
    class Meta:
        model = Usuario
        fields = ('id', 'email', 'nombre', 'apellido', 'phone', 'credit_balance', 'date_joined', 'is_staff')
        read_only_fields = ('id', 'email', 'credit_balance', 'date_joined', 'is_staff')


# =============================================================================
# PRODUCTO
# =============================================================================

class ProductImageSerializer(serializers.ModelSerializer):
    imagen = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ('id', 'imagen', 'orden', 'es_principal')

    def get_imagen(self, obj):
        request = self.context.get('request')
        if obj.imagen:
            if request:
                return request.build_absolute_uri(obj.imagen.url)
            return obj.imagen.url
        return None


class ProductoListSerializer(serializers.ModelSerializer):
    """Serializer liviano para el listado de productos."""
    imagen_principal = serializers.SerializerMethodField()
    es_nuevo = serializers.BooleanField(read_only=True)

    class Meta:
        model = Producto
        fields = (
            'id', 'nombre', 'slug', 'precio', 'precio_original',
            'talle', 'genero', 'categoria', 'estado',
            'imagen_principal', 'es_nuevo', 'es_destacado', 'fecha_publicacion'
        )

    def get_imagen_principal(self, obj):
        img = obj.imagenes.filter(es_principal=True).first()
        if not img:
            img = obj.imagenes.first()
        if img:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(img.imagen.url)
            return img.imagen.url
        return None


class ProductoDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para el detalle del producto."""
    images = ProductImageSerializer(source='imagenes', many=True, read_only=True)
    es_nuevo = serializers.BooleanField(read_only=True)

    class Meta:
        model = Producto
        fields = (
            'id', 'nombre', 'slug', 'descripcion', 'precio', 'precio_original',
            'talle', 'genero', 'categoria', 'estado',
            'historia', 'familia_origen',
            'revisado', 'lavado', 'sin_manchas',
            'es_destacado', 'es_nuevo', 'fecha_publicacion',
            'images'
        )


# =============================================================================
# CRÉDITO
# =============================================================================

class CreditTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditTransaction
        fields = ('id', 'monto', 'tipo', 'descripcion', 'fecha')
        read_only_fields = fields


class AdminAssignCreditSerializer(serializers.Serializer):
    """Serializer para asignar crédito manual a un usuario."""
    usuario_id = serializers.IntegerField()
    monto = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01)
    descripcion = serializers.CharField(max_length=255, required=False, default='Crédito asignado por administrador')

    def validate_usuario_id(self, value):
        if not Usuario.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError('Usuario no encontrado o inactivo.')
        return value


class CreditCodeSerializer(serializers.ModelSerializer):
    """Serializer para códigos de crédito personales (admin)."""
    usuario_email = serializers.SerializerMethodField()
    usuario_nombre = serializers.SerializerMethodField()

    class Meta:
        model = CreditCode
        fields = (
            'id', 'codigo', 'monto', 'usuario', 'usuario_email', 'usuario_nombre',
            'descripcion', 'fecha_creacion', 'usado', 'fecha_uso'
        )
        read_only_fields = ('id', 'codigo', 'fecha_creacion', 'usado', 'fecha_uso')

    def get_usuario_email(self, obj):
        return obj.usuario.email if obj.usuario else None

    def get_usuario_nombre(self, obj):
        return f'{obj.usuario.nombre} {obj.usuario.apellido}' if obj.usuario else None


class RedeemCreditCodeSerializer(serializers.Serializer):
    """Serializer para canjear un código de crédito (usuario)."""
    codigo = serializers.CharField(max_length=50)


# =============================================================================
# WISHLIST
# =============================================================================

class WishlistSerializer(serializers.ModelSerializer):
    productos = ProductoListSerializer(many=True, read_only=True)

    class Meta:
        model = Wishlist
        fields = ('id', 'productos')


class WishlistAddSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()

    def validate_product_id(self, value):
        if not Producto.objects.filter(id=value).exists():
            raise serializers.ValidationError('Producto no encontrado.')
        return value


# =============================================================================
# ORDEN
# =============================================================================

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = (
            'id', 'mp_payment_id', 'status', 'status_detail',
            'amount', 'payment_method', 'payment_type',
            'installments', 'created_at', 'updated_at'
        )
        read_only_fields = fields


class OrdenItemSerializer(serializers.ModelSerializer):
    producto = ProductoListSerializer(read_only=True)

    class Meta:
        model = OrdenItem
        fields = ('id', 'producto', 'precio_unitario')


class OrdenSerializer(serializers.ModelSerializer):
    items = OrdenItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Orden
        fields = (
            'id', 'estado', 'total', 'credito_usado',
            'monto_pagado', 'referencia_mp', 'fecha',
            'shipping_type', 'shipping_cost',
            'address_street', 'address_number', 'address_city',
            'address_zip', 'address_province',
            'items', 'payments'
        )
        read_only_fields = fields


class OrdenListSerializer(serializers.ModelSerializer):
    """Serializer para listado de órdenes con items y producto."""
    items = OrdenItemSerializer(many=True, read_only=True)
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Orden
        fields = (
            'id', 'estado', 'total', 'credito_usado', 'monto_pagado',
            'shipping_type', 'shipping_cost', 'fecha',
            'items_count', 'items'
        )

    def get_items_count(self, obj):
        return obj.items.count()


# =============================================================================
# ADMIN
# =============================================================================

class AdminProductoSerializer(serializers.ModelSerializer):
    """Serializer completo para el admin — incluye escritura de todos los campos."""
    images = ProductImageSerializer(source='imagenes', many=True, read_only=True)
    comprador = serializers.SerializerMethodField()

    class Meta:
        model = Producto
        fields = (
            'id', 'nombre', 'slug', 'descripcion', 'precio', 'precio_original',
            'talle', 'genero', 'categoria', 'estado',
            'historia', 'familia_origen',
            'nota_consignante', 'monto_consignante',
            'revisado', 'lavado', 'sin_manchas',
            'es_destacado', 'fecha_publicacion', 'images',
            'comprador', 'eliminado'
        )
        read_only_fields = ('id', 'slug', 'fecha_publicacion', 'images', 'comprador', 'eliminado')

    def get_comprador(self, obj):
        """Retorna datos del comprador si el producto fue reservado o vendido."""
        if obj.estado not in ('reservado', 'vendido'):
            return None
        orden_item = (
            obj.orden_items
            .select_related('orden__usuario')
            .filter(orden__estado__in=['pending_payment', 'paid', 'shipped', 'ready_for_pickup', 'completed'])
            .order_by('-orden__fecha')
            .first()
        )
        if not orden_item:
            return None
        usuario = orden_item.orden.usuario
        return {
            'id': usuario.id,
            'nombre': usuario.nombre,
            'apellido': usuario.apellido,
            'email': usuario.email,
            'phone': usuario.phone or '',
            'orden_id': orden_item.orden.pk,
            'orden_estado': orden_item.orden.estado,
            'orden_fecha': orden_item.orden.fecha.isoformat(),
        }


class AdminUsuarioSerializer(serializers.ModelSerializer):
    """Serializer para listar usuarios desde el panel admin."""
    ordenes_count = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = (
            'id', 'email', 'nombre', 'apellido', 'phone',
            'credit_balance', 'date_joined', 'last_login',
            'is_active', 'is_staff', 'ordenes_count'
        )
        read_only_fields = (
            'id', 'email', 'nombre', 'apellido', 'phone',
            'credit_balance', 'date_joined', 'last_login', 'is_staff'
        )

    def get_ordenes_count(self, obj):
        return obj.ordenes.count()


# =============================================================================
# CHECKOUT
# =============================================================================

class CheckoutItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()

    def validate_product_id(self, value):
        try:
            producto = Producto.objects.get(id=value, estado='disponible')
        except Producto.DoesNotExist:
            raise serializers.ValidationError(f'Producto {value} no disponible.')
        return value


class CheckoutSerializer(serializers.Serializer):
    """
    Serializer para el proceso de checkout.
    DECISIÓN: Se recibe lista de product_ids, código de crédito opcional,
    tipo de entrega y datos de dirección si corresponde.
    El código se aplica como descuento directo en esta compra y se consume.
    """
    items = CheckoutItemSerializer(many=True)
    codigo_credito = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    shipping_type = serializers.ChoiceField(choices=['envio', 'retiro'], default='retiro')
    address_street = serializers.CharField(max_length=255, required=False, allow_blank=True)
    address_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    address_city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    address_zip = serializers.CharField(max_length=10, required=False, allow_blank=True)
    address_province = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def validate(self, data):
        if data.get('shipping_type') == 'envio':
            required_fields = ['address_street', 'address_number', 'address_city', 'address_zip', 'address_province']
            missing = [f for f in required_fields if not data.get(f)]
            if missing:
                raise serializers.ValidationError({
                    f: 'Este campo es obligatorio para envío a domicilio.'
                    for f in missing
                })
        return data


class ProcessPaymentSerializer(serializers.Serializer):
    """
    Serializer para procesar pagos con Checkout Bricks.
    Recibe el token generado por Bricks en el frontend.
    """
    orden_id = serializers.IntegerField()
    token = serializers.CharField()
    payment_method_id = serializers.CharField()
    issuer_id = serializers.CharField(required=False, allow_blank=True)
    installments = serializers.IntegerField(default=1)
    payer_email = serializers.EmailField()
    payer_identification_type = serializers.CharField(required=False, allow_blank=True, default='')
    payer_identification_number = serializers.CharField(required=False, allow_blank=True, default='')


# =============================================================================
# NOTIFICACIONES
# =============================================================================

class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = ('id', 'titulo', 'mensaje', 'leida', 'fecha')
        read_only_fields = fields
