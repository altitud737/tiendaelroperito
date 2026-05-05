from django.contrib.sitemaps import Sitemap
from .models import Producto


class StaticSitemap(Sitemap):
    """Páginas estáticas del sitio."""
    protocol = 'https'

    _pages = [
        ('/', 1.0, 'daily'),
        ('/tienda/', 0.9, 'daily'),
        ('/login/', 0.3, 'monthly'),
        ('/registro/', 0.3, 'monthly'),
    ]

    def items(self):
        return self._pages

    def location(self, item):
        return item[0]

    def priority(self, item):
        return item[1]

    def changefreq(self, item):
        return item[2]


class ProductoSitemap(Sitemap):
    """Páginas dinámicas de productos disponibles."""
    changefreq = 'daily'
    priority = 0.7
    protocol = 'https'

    def items(self):
        return Producto.objects.filter(
            estado='disponible', eliminado=False
        ).order_by('-fecha_publicacion')

    def location(self, obj):
        return f'/producto/?slug={obj.slug}'

    def lastmod(self, obj):
        return obj.fecha_publicacion
