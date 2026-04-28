from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import (
    Usuario, CreditTransaction, Producto, ProductImage,
    Orden, OrdenItem, Wishlist, Payment
)


# =============================================================================
# INLINES
# =============================================================================

class CreditTransactionInline(admin.TabularInline):
    """Inline para ver historial de crédito dentro del usuario."""
    model = CreditTransaction
    extra = 1
    readonly_fields = ('fecha',)
    fields = ('tipo', 'monto', 'descripcion', 'fecha')


class ProductImageInline(admin.TabularInline):
    """Inline para cargar imágenes dentro del producto."""
    model = ProductImage
    extra = 3
    fields = ('imagen', 'orden', 'es_principal')


class OrdenItemInline(admin.TabularInline):
    """Inline para ver ítems dentro de la orden."""
    model = OrdenItem
    extra = 0
    readonly_fields = ('producto', 'precio_unitario')
    can_delete = False


# =============================================================================
# USUARIO
# =============================================================================

@admin.register(Usuario)
class UsuarioAdmin(BaseUserAdmin):
    """
    Admin de Usuario personalizado.
    DECISIÓN: Se muestra credit_balance directamente editable en la ficha del usuario
    para que la dueña pueda asignar crédito manualmente.
    """
    list_display = ('email', 'nombre', 'apellido', 'credit_balance', 'is_active', 'date_joined')
    list_filter = ('is_active', 'is_staff', 'date_joined')
    search_fields = ('email', 'nombre', 'apellido', 'phone')
    ordering = ('-date_joined',)

    # DECISIÓN: Se redefine fieldsets completo porque el modelo no usa username
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Datos personales', {'fields': ('nombre', 'apellido', 'phone')}),
        ('Crédito', {'fields': ('credit_balance',)}),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Fechas', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'nombre', 'apellido', 'password1', 'password2'),
        }),
    )

    inlines = [CreditTransactionInline]


# =============================================================================
# CRÉDITO
# =============================================================================

@admin.register(CreditTransaction)
class CreditTransactionAdmin(admin.ModelAdmin):
    """Admin para ver historial completo de transacciones de crédito."""
    list_display = ('usuario', 'tipo', 'monto', 'descripcion', 'fecha')
    list_filter = ('tipo', 'fecha', 'usuario')
    search_fields = ('usuario__email', 'usuario__nombre', 'descripcion')
    readonly_fields = ('fecha',)
    date_hierarchy = 'fecha'


# =============================================================================
# PRODUCTO
# =============================================================================

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    """
    Admin de Producto con imágenes inline.
    DECISIÓN: Se incluyen filtros por talle, género y estado para facilitar
    la gestión diaria del catálogo.
    """
    list_display = (
        'nombre', 'talle', 'genero', 'categoria',
        'precio', 'estado', 'estado_badge', 'es_destacado', 'fecha_publicacion'
    )
    list_filter = ('estado', 'talle', 'genero', 'categoria', 'es_destacado', 'revisado', 'lavado', 'sin_manchas')
    search_fields = ('nombre', 'descripcion', 'familia_origen')
    prepopulated_fields = {'slug': ('nombre',)}
    list_editable = ('es_destacado', 'estado')
    readonly_fields = ('fecha_publicacion',)
    date_hierarchy = 'fecha_publicacion'

    fieldsets = (
        (None, {'fields': ('nombre', 'slug', 'descripcion')}),
        ('Precio', {'fields': ('precio', 'precio_original')}),
        ('Clasificación', {'fields': ('talle', 'genero', 'categoria', 'estado')}),
        ('Historia', {'fields': ('historia', 'familia_origen')}),
        ('Calidad', {'fields': ('revisado', 'lavado', 'sin_manchas')}),
        ('Visibilidad', {'fields': ('es_destacado', 'fecha_publicacion')}),
    )

    inlines = [ProductImageInline]

    @admin.display(description='Estado')
    def estado_badge(self, obj):
        """Muestra el estado con color para lectura rápida."""
        colors = {
            'disponible': '#28a745',
            'vendido': '#dc3545',
            'reservado': '#ffc107',
        }
        color = colors.get(obj.estado, '#6c757d')
        return format_html(
            '<span style="background:{}; color:white; padding:3px 8px; '
            'border-radius:4px; font-size:11px;">{}</span>',
            color, obj.get_estado_display()
        )


# =============================================================================
# ORDEN
# =============================================================================

class PaymentInline(admin.TabularInline):
    """Inline para ver pagos dentro de la orden."""
    model = Payment
    extra = 0
    readonly_fields = (
        'mp_payment_id', 'status', 'status_detail', 'amount',
        'payment_method', 'payment_type', 'installments', 'created_at'
    )
    can_delete = False


@admin.register(Orden)
class OrdenAdmin(admin.ModelAdmin):
    """
    Admin de Orden con detalle de productos y pagos inline.
    DECISIÓN: Estado editable desde el listado para agilizar la gestión.
    """
    list_display = (
        'id', 'usuario', 'estado', 'total', 'shipping_type',
        'shipping_cost', 'credito_usado', 'monto_pagado', 'fecha'
    )
    list_filter = ('estado', 'shipping_type', 'fecha')
    search_fields = ('usuario__email', 'usuario__nombre', 'referencia_mp')
    list_editable = ('estado',)
    readonly_fields = ('fecha',)
    date_hierarchy = 'fecha'

    fieldsets = (
        (None, {'fields': ('usuario', 'estado')}),
        ('Montos', {'fields': ('total', 'credito_usado', 'monto_pagado')}),
        ('Envío', {'fields': ('shipping_type', 'shipping_cost')}),
        ('Dirección', {
            'fields': ('address_street', 'address_number', 'address_city', 'address_zip', 'address_province'),
            'classes': ('collapse',),
        }),
        ('MercadoPago', {'fields': ('referencia_mp',)}),
        ('Fechas', {'fields': ('fecha',)}),
    )

    inlines = [OrdenItemInline, PaymentInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Admin para ver historial completo de pagos."""
    list_display = ('mp_payment_id', 'orden', 'status', 'amount', 'payment_method', 'created_at')
    list_filter = ('status', 'payment_type', 'created_at')
    search_fields = ('mp_payment_id', 'orden__id', 'orden__usuario__email')
    readonly_fields = (
        'mp_payment_id', 'orden', 'status', 'status_detail', 'amount',
        'payment_method', 'payment_type', 'installments',
        'mp_response', 'created_at', 'updated_at'
    )
    date_hierarchy = 'created_at'


# =============================================================================
# WISHLIST
# =============================================================================

@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'cantidad_productos')
    search_fields = ('usuario__email',)
    filter_horizontal = ('productos',)

    @admin.display(description='Cantidad de productos')
    def cantidad_productos(self, obj):
        return obj.productos.count()


# DECISIÓN: Se personaliza el título del sitio de admin para la dueña
admin.site.site_header = 'El Roperito — Administración'
admin.site.site_title = 'El Roperito Admin'
admin.site.index_title = 'Panel de gestión'
