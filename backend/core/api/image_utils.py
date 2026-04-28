"""
Utilidades de validación y procesamiento de imágenes para productos.
"""
from PIL import Image, UnidentifiedImageError
from rest_framework.exceptions import ValidationError

MAX_IMAGE_SIZE    = 5 * 1024 * 1024
ALLOWED_PIL_FORMATS = {'JPEG', 'PNG', 'WEBP'}
ALLOWED_MIMETYPES = {
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
}
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}


def validate_product_image(image_file):
    """
    Valida tipo (content-type + Pillow verify), extensión y tamaño.
    Lanza ValidationError de DRF si algo falla.
    Retorna la extensión normalizada ('jpg', 'png' o 'webp').
    """
    # 1. Tamaño
    if image_file.size > MAX_IMAGE_SIZE:
        mb = image_file.size / (1024 * 1024)
        raise ValidationError(
            f'La imagen es demasiado grande ({mb:.1f} MB). El límite es 5 MB.'
        )

    # 2. Content-Type declarado por el cliente
    content_type = getattr(image_file, 'content_type', '').lower()
    if content_type not in ALLOWED_MIMETYPES:
        raise ValidationError(
            f'Formato no permitido ("{content_type}"). '
            'Solo se aceptan imágenes JPG, PNG o WEBP.'
        )

    # 3. Extensión del nombre de archivo
    name = getattr(image_file, 'name', '')
    ext = name.rsplit('.', 1)[-1].lower() if '.' in name else ''
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(
            f'Extensión ".{ext}" no permitida. Usá .jpg, .png o .webp.'
        )

    # 4. Pillow verify — detecta el formato real por magic bytes y valida integridad
    image_file.seek(0)
    try:
        img = Image.open(image_file)
        img_format = img.format  # leer formato antes de verify()
        img.verify()             # lanza excepción si el archivo está corrupto o no es imagen
    except (UnidentifiedImageError, Exception):
        image_file.seek(0)
        raise ValidationError(
            'El archivo no es una imagen válida. '
            'Solo se aceptan JPG, PNG o WEBP.'
        )
    finally:
        image_file.seek(0)

    if img_format not in ALLOWED_PIL_FORMATS:
        raise ValidationError(
            f'Formato "{img_format}" no permitido. '
            'Solo se aceptan JPG, PNG o WEBP.'
        )

    # Normalizar extensión
    return 'jpg' if ext == 'jpeg' else ext
