from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

Usuario = get_user_model()

ADMIN_EMAIL    = 'lemmej8@gmail.com'
ADMIN_PASSWORD = 'lemmej8661'
ADMIN_NOMBRE   = 'Administrador'
ADMIN_APELLIDO = 'El Roperito'


class Command(BaseCommand):
    help = 'Crea el usuario administrador de El Roperito si no existe.'

    def handle(self, *args, **options):
        if Usuario.objects.filter(email=ADMIN_EMAIL).exists():
            user = Usuario.objects.get(email=ADMIN_EMAIL)
            user.is_staff = True
            user.is_active = True
            user.set_password(ADMIN_PASSWORD)
            user.save()
            self.stdout.write(self.style.WARNING(
                f'Usuario {ADMIN_EMAIL} ya existía — contraseña y permisos actualizados.'
            ))
        else:
            Usuario.objects.create_user(
                email=ADMIN_EMAIL,
                password=ADMIN_PASSWORD,
                nombre=ADMIN_NOMBRE,
                apellido=ADMIN_APELLIDO,
                is_staff=True,
                is_active=True,
            )
            self.stdout.write(self.style.SUCCESS(
                f'Administrador creado: {ADMIN_EMAIL}'
            ))
