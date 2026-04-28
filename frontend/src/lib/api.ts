// DECISIÓN: Cliente API centralizado para todas las llamadas al backend Django
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface FetchOptions extends RequestInit {
  token?: string | null;
}

async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const { token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((customHeaders as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    headers,
    ...rest,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Error de conexión' }));
    throw new Error(error.detail || `Error ${res.status}`);
  }

  return res.json();
}

// =============================================================================
// AUTH
// =============================================================================

export async function register(data: {
  email: string;
  nombre: string;
  apellido: string;
  password: string;
  password_confirm: string;
}) {
  return fetchAPI('/api/auth/register/', { method: 'POST', body: JSON.stringify(data) });
}

export async function login(email: string, password: string) {
  return fetchAPI('/api/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function refreshToken(refresh: string) {
  return fetchAPI('/api/auth/refresh/', {
    method: 'POST',
    body: JSON.stringify({ refresh }),
  });
}

export async function getMe(token: string) {
  return fetchAPI('/api/auth/me/', { token });
}

export async function updateMe(token: string, data: { nombre?: string; apellido?: string; phone?: string }) {
  return fetchAPI('/api/auth/me/', { method: 'PATCH', token, body: JSON.stringify(data) });
}

// =============================================================================
// PRODUCTOS
// =============================================================================

export async function getProducts(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return fetchAPI(`/api/products/${query}`);
}

export async function getProductBySlug(slug: string) {
  return fetchAPI(`/api/products/${slug}/`);
}

export async function getFeaturedProducts() {
  return fetchAPI('/api/products/featured/');
}

// =============================================================================
// CRÉDITO
// =============================================================================

export async function getCreditHistory(token: string) {
  return fetchAPI('/api/credits/history/', { token });
}

// =============================================================================
// WISHLIST
// =============================================================================

export async function getWishlist(token: string) {
  return fetchAPI('/api/wishlist/', { token });
}

export async function addToWishlist(token: string, productId: number) {
  return fetchAPI('/api/wishlist/add/', {
    method: 'POST',
    token,
    body: JSON.stringify({ product_id: productId }),
  });
}

export async function removeFromWishlist(token: string, productId: number) {
  return fetchAPI(`/api/wishlist/remove/${productId}/`, { method: 'DELETE', token });
}

// =============================================================================
// CHECKOUT
// =============================================================================

export async function createCheckout(token: string, items: { product_id: number }[], usarCredito: boolean) {
  return fetchAPI('/api/checkout/', {
    method: 'POST',
    token,
    body: JSON.stringify({ items, usar_credito: usarCredito }),
  });
}

// =============================================================================
// ÓRDENES
// =============================================================================

export async function getOrders(token: string) {
  return fetchAPI('/api/orders/', { token });
}

export async function getOrderDetail(token: string, id: number) {
  return fetchAPI(`/api/orders/${id}/`, { token });
}
