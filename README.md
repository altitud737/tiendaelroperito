# El Roperito — Moda Circular Infantil

Ecommerce de moda circular infantil para familias de Chivilcoy y alrededores.  
Negocio real ubicado en Av. 3 de Febrero 640, Chivilcoy, Buenos Aires.

## Estructura del Proyecto

```
elroperito/
├── frontend/          ← Next.js 14 (App Router) + Tailwind CSS
├── backend/           ← Django 4.x + Django REST Framework
├── .env               ← Variables de entorno compartidas
├── index.html         ← Landing HTML original (referencia visual)
├── styles.css         ← CSS original (referencia visual)
├── script.js          ← JS original (referencia visual)
└── README.md          ← Este archivo
```

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Django 4.2 + Django REST Framework |
| Base de datos | PostgreSQL |
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Pagos | MercadoPago (Argentina) |
| Auth | JWT con SimpleJWT |
| Imágenes | Django con MEDIA_ROOT local |

## Requisitos Previos

- **Python 3.10+**
- **Node.js 18+**
- **PostgreSQL 14+**

## Instrucciones de Instalación

### 1. Clonar y configurar variables de entorno

```bash
# Copiar y editar el archivo .env en la raíz
# Configurar SECRET_KEY, credenciales de PostgreSQL y tokens de MercadoPago
```

### 2. Backend (Django)

```bash
# Crear entorno virtual
cd backend
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Crear la base de datos PostgreSQL
# (desde psql o pgAdmin):
# CREATE DATABASE elroperito;

# Correr migraciones
python manage.py makemigrations core
python manage.py migrate

# Crear superusuario (para acceder al admin)
python manage.py createsuperuser

# Iniciar el servidor de desarrollo
python manage.py runserver
```

El backend corre en `http://localhost:8000`  
Panel de admin: `http://localhost:8000/admin/`

### 3. Frontend (Next.js)

```bash
# En otra terminal
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El frontend corre en `http://localhost:3000`

## API Endpoints

### Productos (públicos)
- `GET /api/products/` — Listado con filtros (talle, genero, categoria, novedades)
- `GET /api/products/:slug/` — Detalle completo
- `GET /api/products/featured/` — Hasta 8 destacados

### Auth
- `POST /api/auth/register/` — Registro
- `POST /api/auth/login/` — Login (devuelve JWT)
- `POST /api/auth/refresh/` — Renovar token
- `GET /api/auth/me/` — Datos del usuario logueado

### Crédito (autenticado)
- `GET /api/credits/history/` — Historial de crédito

### Wishlist (autenticado)
- `GET /api/wishlist/`
- `POST /api/wishlist/add/`
- `DELETE /api/wishlist/remove/:id/`

### Checkout (autenticado)
- `POST /api/checkout/` — Crear orden + pago MP
- `POST /api/checkout/webhook/` — Webhook de MP
- `GET /api/checkout/success/` — Confirmación

### Órdenes (autenticado)
- `GET /api/orders/` — Historial
- `GET /api/orders/:id/` — Detalle

## Flujo de Uso (Admin)

1. Acceder a `http://localhost:8000/admin/`
2. **Cargar productos** con imágenes, talle, género, precio e historia
3. **Marcar destacados** para que aparezcan en el Home
4. **Gestionar crédito** de usuarios desde su ficha
5. **Revisar órdenes** y actualizar estados

## Notas Importantes

- El archivo `.env` contiene las credenciales. **No commitear a repositorios públicos.**
- Los archivos `index.html`, `styles.css` y `script.js` en la raíz son la landing original y sirven como referencia visual. El nuevo frontend está en `/frontend`.
- Stock siempre = 1 (cada prenda es única).
- MercadoPago requiere configurar `MP_ACCESS_TOKEN` y `MP_PUBLIC_KEY` para funcionar. Sin ellos, el checkout funciona en modo desarrollo.
