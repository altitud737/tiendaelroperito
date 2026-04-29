"""
Django settings for elroperito project.
"""
import os
from pathlib import Path
from datetime import timedelta
from decouple import config, Csv
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# DECISIÓN: Se usa python-decouple para leer variables de entorno desde .env en la raíz del monorepo
SECRET_KEY = config('SECRET_KEY', default='django-insecure-dev-key-change-in-production')
DEBUG = config('DEBUG', default=True, cast=bool)
BASE_URL = config('BASE_URL', default='https://elroperitotienda.com.ar').rstrip('/')
ALLOWED_HOSTS = config(
    'ALLOWED_HOSTS',
    default='elroperitotienda.com.ar,www.elroperitotienda.com.ar',
    cast=Csv(),
)

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'cloudinary_storage',
    'cloudinary',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    # Local
    'core',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'elroperito.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'elroperito.wsgi.application'

# Database
# Railway provee DATABASE_URL. Si existe, se usa. Si no, se usan los campos individuales (local dev).
DATABASE_URL = config('DATABASE_URL', default='')

if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600, ssl_require=True)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DB_NAME', default='elroperito'),
            'USER': config('DB_USER', default='postgres'),
            'PASSWORD': config('DB_PASSWORD', default='postgres'),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='5432'),
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'es-ar'
TIME_ZONE = 'America/Argentina/Buenos_Aires'
USE_I18N = True
USE_TZ = True

# Static files — WhiteNoise sirve estáticos en producción sin Nginx
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files (imágenes de productos)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Límite de tamaño de archivos subidos: 5 MB (en bytes)
DATA_UPLOAD_MAX_MEMORY_SIZE  = 5 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE  = 5 * 1024 * 1024

# ─── Cloudinary (imágenes en la nube) ────────────────────────────────────────
# Si CLOUDINARY_URL está configurada, las imágenes se suben a Cloudinary.
# Si no, se usa el filesystem local /media/ (desarrollo).
CLOUDINARY_URL = config('CLOUDINARY_URL', default='')
USE_CLOUDINARY = bool(CLOUDINARY_URL)

if USE_CLOUDINARY:
    CLOUDINARY_STORAGE = {
        'CLOUDINARY_URL': CLOUDINARY_URL,
    }
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
else:
    # Solo crear carpeta media en desarrollo local
    MEDIA_ROOT.mkdir(parents=True, exist_ok=True)

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# DECISIÓN: Se usa el modelo de usuario personalizado desde el inicio para evitar migraciones complicadas después
AUTH_USER_MODEL = 'core.Usuario'

# CORS
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default=f'{BASE_URL},https://www.elroperitotienda.com.ar',
    cast=Csv(),
)
CORS_ALLOW_CREDENTIALS = True

# CSRF — dominios de confianza para formularios
CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS',
    default=f'{BASE_URL},https://www.elroperitotienda.com.ar',
    cast=Csv(),
)

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '60/min',
        'user': '300/min',
        'login': '10/min',
        'password_reset': '5/min',
        'webhook': '120/min',
    },
}

# SimpleJWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# MercadoPago
MP_ACCESS_TOKEN = config('MP_ACCESS_TOKEN', default='')
MP_PUBLIC_KEY = config('MP_PUBLIC_KEY', default='')
MP_CLIENT_ID = config('MP_CLIENT_ID', default='')
MP_CLIENT_SECRET = config('MP_CLIENT_SECRET', default='')
MP_WEBHOOK_URL = config('MP_WEBHOOK_URL', default=f'{BASE_URL}/webhook')
MP_WEBHOOK_SECRET = config('MP_WEBHOOK_SECRET', default='')

# URLs de retorno post-pago (Checkout Pro)
MP_BACK_URL_SUCCESS = config('MP_BACK_URL_SUCCESS', default=f'{BASE_URL}/pago-exitoso/')
MP_BACK_URL_FAILURE = config('MP_BACK_URL_FAILURE', default=f'{BASE_URL}/pago-error/')
MP_BACK_URL_PENDING = config('MP_BACK_URL_PENDING', default=f'{BASE_URL}/pago-pendiente/')

# Envío — costo fijo configurable (en pesos)
SHIPPING_COST = config('SHIPPING_COST', default=2500, cast=float)

# Email — Gmail SMTP
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_TIMEOUT = 8
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='elroperitoch@gmail.com')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = 'El Roperito <elroperitoch@gmail.com>'

# Password reset — links usan la URL pública del sitio
FRONTEND_URL = config('FRONTEND_URL', default=BASE_URL)
PASSWORD_RESET_TIMEOUT = 3600  # 1 hora

# ─── Seguridad HTTPS (solo en producción) ──────────────────────────────────
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# Logging — en producción solo console (Railway captura stdout)
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {levelname} {name} — {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'payments': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}

if DEBUG:
    # Logging a archivo solo en desarrollo local
    (BASE_DIR / 'logs').mkdir(parents=True, exist_ok=True)
    LOGGING['handlers']['file'] = {
        'class': 'logging.FileHandler',
        'filename': BASE_DIR / 'logs' / 'payments.log',
        'formatter': 'verbose',
    }
    LOGGING['loggers']['payments']['handlers'].append('file')
