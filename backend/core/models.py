from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.text import slugify
from django.utils import timezone
import uuid
import os


# =============================================================================
# USUARIO
# =============================================================================

class UsuarioManager(BaseUserManager):
    """
    Manager personalizado para Usuario.
    DECISIÓN: Se usa email como campo principal de login en lugar de username.
    """

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser debe tener is_superuser=True.')
        return self.create_user(email, password, **extra_fields)


class Usuario(AbstractUser):
    """
    Modelo de usuario personalizado.
    DECISIÓN: Se extiende AbstractUser con email como campo de login principal.
    Se elimina username y se agrega credit_balance para el sistema de créditos.
    """
    username = None
    email = models.EmailField('email', unique=True)
    nombre = models.CharField('nombre', max_length=100)
    apellido = models.CharField('apellido', max_length=100)
    credit_balance = models.DecimalField(
        'saldo de crédito',
        max_digits=10,
        decimal_places=2,
        default=0
    )
    phone = models.CharField('teléfono', max_length=20, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombre', 'apellido']

    objects = UsuarioManager()

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f'{self.nombre} {self.apellido} ({self.email})'


# =============================================================================
# CRÉDITO
# =============================================================================

class CreditTransaction(models.Model):
    """
    Registro de movimientos de crédito.
    DECISIÓN: El admin asigna crédito manualmente. No hay automatización por ahora.
    Cada transacción registra un movimiento positivo (credito) o negativo (debito).
    """
    TIPO_CHOICES = [
        ('credito', 'Crédito'),
        ('debito', 'Débito'),
    ]

    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name='credit_transactions',
        verbose_name='usuario'
    )
    monto = models.DecimalField('monto', max_digits=10, decimal_places=2)
    tipo = models.CharField('tipo', max_length=10, choices=TIPO_CHOICES)
    descripcion = models.CharField('descripción', max_length=255)
    fecha = models.DateTimeField('fecha', auto_now_add=True)

    class Meta:
        verbose_name = 'Transacción de crédito'
        verbose_name_plural = 'Transacciones de crédito'
        ordering = ['-fecha']

    def __str__(self):
        signo = '+' if self.tipo == 'credito' else '-'
        return f'{signo}${self.monto} — {self.usuario.email} — {self.descripcion}'


def generate_credit_code():
    """Genera un código alfanumérico de 8 caracteres en mayúsculas."""
    return uuid.uuid4().hex[:8].upper()


class CreditCode(models.Model):
    """
    Código de crédito personal asignado a un usuario específico.
    DECISIÓN: El admin crea un código para UN usuario. Solo ese usuario puede
    canjearlo, una sola vez. Nadie más puede usar el código.
    """
    codigo = models.CharField(
        'código',
        max_length=50,
        unique=True,
        default=generate_credit_code,
        help_text='Código alfanumérico que el usuario ingresa para canjearlo'
    )
    monto = models.DecimalField('monto de crédito', max_digits=10, decimal_places=2)
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name='codigos_credito',
        verbose_name='usuario asignado'
    )
    descripcion = models.CharField('descripción', max_length=255, blank=True)
    creado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='codigos_creados',
        verbose_name='creado por'
    )
    fecha_creacion = models.DateTimeField('fecha de creación', auto_now_add=True)
    usado = models.BooleanField('usado', default=False)
    fecha_uso = models.DateTimeField('fecha de uso', null=True, blank=True)

    class Meta:
        verbose_name = 'Código de crédito'
        verbose_name_plural = 'Códigos de crédito'
        ordering = ['-fecha_creacion']

    def __str__(self):
        estado = 'USADO' if self.usado else 'PENDIENTE'
        return f'{self.codigo} — ${self.monto} — {self.usuario.email} — {estado}'


# =============================================================================
# TALLE / CATEGORÍA  (dinámicos, el admin los gestiona desde el panel)
# =============================================================================

class Talle(models.Model):
    nombre = models.CharField('nombre', max_length=10, unique=True)
    orden = models.PositiveIntegerField('orden', default=0)

    class Meta:
        verbose_name = 'Talle'
        verbose_name_plural = 'Talles'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


class Categoria(models.Model):
    nombre = models.CharField('nombre', max_length=50, unique=True)
    slug = models.SlugField('slug', max_length=60, unique=True, blank=True)

    class Meta:
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nombre)
        super().save(*args, **kwargs)


# =============================================================================
# PRODUCTO
# =============================================================================

class Producto(models.Model):
    """
    Modelo de producto (prenda única).
    DECISIÓN: Stock siempre = 1, no hay campo quantity.
    Cada prenda es única y tiene una historia emocional asociada.
    El slug se genera automáticamente a partir del nombre.
    """

    GENERO_CHOICES = [
        ('nena', 'Nena'),
        ('nene', 'Nene'),
        ('unisex', 'Unisex'),
    ]

    ESTADO_CHOICES = [
        ('disponible', 'Disponible'),
        ('pausado', 'Pausado'),
        ('vendido', 'Vendido'),
        ('reservado', 'Reservado'),
    ]

    nombre = models.CharField('nombre', max_length=200)
    slug = models.SlugField('slug', max_length=250, unique=True, blank=True)
    descripcion = models.TextField('descripción', blank=True)
    precio = models.DecimalField('precio', max_digits=10, decimal_places=2)
    precio_original = models.DecimalField(
        'precio original',
        max_digits=10,
        decimal_places=2,
        help_text='Precio de referencia para mostrar tachado'
    )
    talle = models.CharField('talle', max_length=20)
    genero = models.CharField('género', max_length=7, choices=GENERO_CHOICES)
    categoria = models.CharField('categoría', max_length=50)
    estado = models.CharField(
        'estado',
        max_length=10,
        choices=ESTADO_CHOICES,
        default='disponible'
    )
    historia = models.TextField(
        'historia de la prenda',
        blank=True,
        help_text='Historia emocional de la prenda. Se muestra en el primer tercio del detalle.'
    )
    familia_origen = models.CharField(
        'familia de origen',
        max_length=200,
        blank=True,
        help_text='Nombre o alias de la familia que entregó la prenda'
    )
    fecha_publicacion = models.DateTimeField('fecha de publicación', auto_now_add=True)
    revisado = models.BooleanField('revisado', default=False)
    lavado = models.BooleanField('lavado', default=False)
    sin_manchas = models.BooleanField('sin manchas', default=False)
    es_destacado = models.BooleanField(
        'es destacado',
        default=False,
        help_text='Mostrar en la sección de destacados del Home'
    )

    # Consignación — nota interna del admin
    nota_consignante = models.CharField(
        'nombre del consignante',
        max_length=200,
        blank=True,
        help_text='Quién entregó la ropa (uso interno admin)'
    )
    monto_consignante = models.DecimalField(
        'monto a pagar al consignante',
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text='Cuánto dinero se le debe dar al que entregó la ropa'
    )

    # Soft delete — no borra de la BD para preservar métricas
    eliminado = models.BooleanField('eliminado', default=False)
    fecha_eliminacion = models.DateTimeField('fecha de eliminación', null=True, blank=True)

    class Meta:
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['-fecha_publicacion']

    def __str__(self):
        return f'{self.nombre} — Talle {self.talle} — {self.get_estado_display()}'

    def save(self, *args, **kwargs):
        # DECISIÓN: Generar slug único automáticamente. Si ya existe, agrega un sufijo UUID corto.
        if not self.slug:
            base_slug = slugify(self.nombre)
            slug = base_slug
            counter = 1
            while Producto.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def es_nuevo(self):
        """Retorna True si la prenda fue publicada en los últimos 7 días."""
        return (timezone.now() - self.fecha_publicacion).days <= 7

    @property
    def imagen_principal(self):
        """Retorna la imagen principal del producto o la primera disponible."""
        img = self.imagenes.filter(es_principal=True).first()
        if not img:
            img = self.imagenes.first()
        return img


# =============================================================================
# IMÁGENES DE PRODUCTO
# =============================================================================

def producto_image_path(instance, filename):
    """
    DECISIÓN: Las imágenes se renombran con UUID para evitar colisiones de nombres
    y se organizan por carpeta de producto. Los archivos nunca sobreescriben otros.
    """
    ext = os.path.splitext(filename)[1].lower()
    unique_name = f'{uuid.uuid4().hex}{ext}'
    return f'productos/{instance.producto.slug}/{unique_name}'


class ProductImage(models.Model):
    """
    Imagen asociada a un producto.
    DECISIÓN: Se permite múltiples imágenes por producto, con orden y marca de imagen principal.
    """
    producto = models.ForeignKey(
        Producto,
        on_delete=models.CASCADE,
        related_name='imagenes',
        verbose_name='producto'
    )
    imagen = models.ImageField('imagen', upload_to=producto_image_path)
    orden = models.IntegerField('orden', default=0)
    es_principal = models.BooleanField('es imagen principal', default=False)

    class Meta:
        verbose_name = 'Imagen de producto'
        verbose_name_plural = 'Imágenes de producto'
        ordering = ['orden']

    def __str__(self):
        return f'Imagen {self.orden} de {self.producto.nombre}'


# =============================================================================
# ORDEN
# =============================================================================

class Orden(models.Model):
    """
    Orden de compra.
    DECISIÓN: Se registra crédito usado y monto pagado por separado para auditoría.
    referencia_mp almacena el ID de MercadoPago para conciliación.
    Incluye datos de envío y dirección para el flujo de checkout completo.
    """
    ESTADO_CHOICES = [
        ('pending_payment', 'Pendiente de pago'),
        ('paid', 'Pagado'),
        ('shipped', 'Enviado'),
        ('ready_for_pickup', 'Listo para retirar'),
        ('completed', 'Completado'),
        ('cancelled', 'Cancelado'),
    ]

    SHIPPING_CHOICES = [
        ('envio', 'Envío a domicilio'),
        ('retiro', 'Retiro en local'),
    ]

    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name='ordenes',
        verbose_name='usuario'
    )
    estado = models.CharField(
        'estado',
        max_length=20,
        choices=ESTADO_CHOICES,
        default='pending_payment'
    )
    total = models.DecimalField('total', max_digits=10, decimal_places=2)
    credito_usado = models.DecimalField(
        'crédito usado',
        max_digits=10,
        decimal_places=2,
        default=0
    )
    monto_pagado = models.DecimalField(
        'monto pagado',
        max_digits=10,
        decimal_places=2,
        default=0
    )
    referencia_mp = models.CharField(
        'referencia MercadoPago',
        max_length=255,
        blank=True
    )
    codigo_credito_usado = models.ForeignKey(
        'CreditCode',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='ordenes',
        verbose_name='código de crédito usado'
    )

    # Envío
    shipping_type = models.CharField(
        'tipo de entrega',
        max_length=10,
        choices=SHIPPING_CHOICES,
        default='retiro'
    )
    shipping_cost = models.DecimalField(
        'costo de envío',
        max_digits=10,
        decimal_places=2,
        default=0
    )

    # Dirección (solo si shipping_type == 'envio')
    address_street = models.CharField('calle', max_length=255, blank=True)
    address_number = models.CharField('número', max_length=20, blank=True)
    address_city = models.CharField('ciudad', max_length=100, blank=True)
    address_zip = models.CharField('código postal', max_length=10, blank=True)
    address_province = models.CharField('provincia', max_length=100, blank=True)

    fecha = models.DateTimeField('fecha', auto_now_add=True)

    class Meta:
        verbose_name = 'Orden'
        verbose_name_plural = 'Órdenes'
        ordering = ['-fecha']

    def __str__(self):
        return f'Orden #{self.pk} — {self.usuario.email} — {self.get_estado_display()}'

    @property
    def total_con_envio(self):
        return self.total + self.shipping_cost


# =============================================================================
# PAGO
# =============================================================================

class Payment(models.Model):
    """
    Registro de pagos procesados por MercadoPago.
    DECISIÓN: Se separa del modelo Orden para tener un historial completo de
    intentos de pago (puede haber múltiples intentos por orden).
    """
    ESTADO_CHOICES = [
        ('pending', 'Pendiente'),
        ('approved', 'Aprobado'),
        ('rejected', 'Rechazado'),
        ('in_process', 'En proceso'),
        ('cancelled', 'Cancelado'),
        ('refunded', 'Reembolsado'),
    ]

    orden = models.ForeignKey(
        Orden,
        on_delete=models.CASCADE,
        related_name='payments',
        verbose_name='orden'
    )
    mp_payment_id = models.CharField(
        'ID de pago MercadoPago',
        max_length=255,
        unique=True
    )
    status = models.CharField(
        'estado',
        max_length=20,
        choices=ESTADO_CHOICES,
        default='pending'
    )
    status_detail = models.CharField(
        'detalle del estado',
        max_length=255,
        blank=True
    )
    amount = models.DecimalField('monto', max_digits=10, decimal_places=2)
    payment_method = models.CharField('método de pago', max_length=50, blank=True)
    payment_type = models.CharField('tipo de pago', max_length=50, blank=True)
    installments = models.IntegerField('cuotas', default=1)
    mp_response = models.JSONField('respuesta completa MP', default=dict, blank=True)
    created_at = models.DateTimeField('fecha de creación', auto_now_add=True)
    updated_at = models.DateTimeField('última actualización', auto_now=True)

    class Meta:
        verbose_name = 'Pago'
        verbose_name_plural = 'Pagos'
        ordering = ['-created_at']

    def __str__(self):
        return f'Pago {self.mp_payment_id} — Orden #{self.orden.pk} — {self.get_status_display()}'


class OrdenItem(models.Model):
    """
    Ítem individual dentro de una orden.
    DECISIÓN: Se guarda precio_unitario al momento de la compra para mantener historial
    incluso si el producto cambia de precio después.
    """
    orden = models.ForeignKey(
        Orden,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='orden'
    )
    producto = models.ForeignKey(
        Producto,
        on_delete=models.PROTECT,
        related_name='orden_items',
        verbose_name='producto'
    )
    precio_unitario = models.DecimalField(
        'precio unitario',
        max_digits=10,
        decimal_places=2
    )

    class Meta:
        verbose_name = 'Ítem de orden'
        verbose_name_plural = 'Ítems de orden'

    def __str__(self):
        return f'{self.producto.nombre} — ${self.precio_unitario}'


# =============================================================================
# WISHLIST
# =============================================================================

class Wishlist(models.Model):
    """
    Lista de deseos del usuario.
    DECISIÓN: OneToOne con Usuario — cada usuario tiene exactamente una wishlist.
    Se crea automáticamente cuando se necesita.
    """
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        related_name='wishlist',
        verbose_name='usuario'
    )
    productos = models.ManyToManyField(
        Producto,
        blank=True,
        related_name='wishlisted_by',
        verbose_name='productos'
    )

    class Meta:
        verbose_name = 'Lista de deseos'
        verbose_name_plural = 'Listas de deseos'

    def __str__(self):
        return f'Wishlist de {self.usuario.email}'


# =============================================================================
# NOTIFICACIONES
# =============================================================================

class Notificacion(models.Model):
    """
    Notificación interna para el usuario.
    DECISIÓN: Sistema simple — título, mensaje, leída/no leída.
    """
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name='notificaciones',
        verbose_name='usuario'
    )
    titulo = models.CharField('título', max_length=200)
    mensaje = models.TextField('mensaje')
    leida = models.BooleanField('leída', default=False)
    fecha = models.DateTimeField('fecha', auto_now_add=True)

    class Meta:
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        ordering = ['-fecha']

    def __str__(self):
        return f'{self.titulo} → {self.usuario.email}'
