'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { getCreditHistory, getOrders, getWishlist, updateMe, removeFromWishlist } from '@/lib/api';
import { CreditCard, ShoppingBag, Heart, User, Trash2 } from 'lucide-react';

// DECISIÓN: Perfil protegido. Si no hay sesión, redirige a /login?next=/perfil

type Tab = 'credito' | 'compras' | 'wishlist' | 'datos';

interface CreditTx {
  id: number;
  monto: number;
  tipo: string;
  descripcion: string;
  fecha: string;
}

interface OrderItem {
  id: number;
  producto: { nombre: string; imagen_principal: string | null };
  precio_unitario: number;
}

interface Order {
  id: number;
  estado: string;
  total: number;
  fecha: string;
  items_count?: number;
  items?: OrderItem[];
}

interface WishlistProduct {
  id: number;
  nombre: string;
  slug: string;
  precio: number;
  talle: string;
  imagen_principal: string | null;
}

export default function PerfilPage() {
  const { user, token, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as Tab | null;

  const [activeTab, setActiveTab] = useState<Tab>(tabParam || 'credito');
  const [credits, setCredits] = useState<CreditTx[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<WishlistProduct[]>([]);
  const [formData, setFormData] = useState({ nombre: '', apellido: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?next=/perfil');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (tabParam && ['credito', 'compras', 'wishlist', 'datos'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (!token) return;
    if (activeTab === 'credito') {
      getCreditHistory(token).then((data) => setCredits(data.results || data || [])).catch(() => {});
    } else if (activeTab === 'compras') {
      getOrders(token).then((data) => setOrders(data.results || data || [])).catch(() => {});
    } else if (activeTab === 'wishlist') {
      getWishlist(token).then((data) => setWishlistProducts(data.productos || [])).catch(() => {});
    } else if (activeTab === 'datos' && user) {
      setFormData({ nombre: user.nombre, apellido: user.apellido, phone: user.phone || '' });
    }
  }, [activeTab, token, user]);

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    setSaveMsg('');
    try {
      await updateMe(token, formData);
      await refreshUser();
      setSaveMsg('Datos actualizados');
    } catch {
      setSaveMsg('Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveWishlist(productId: number) {
    if (!token) return;
    try {
      await removeFromWishlist(token, productId);
      setWishlistProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch {
      // silently fail
    }
  }

  if (isLoading || !user) {
    return (
      <div className="section-padding">
        <div className="container-roperito text-center py-16">
          <div className="w-8 h-8 border-2 border-pink border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'credito', label: 'Mi crédito', icon: <CreditCard size={18} /> },
    { key: 'compras', label: 'Mis compras', icon: <ShoppingBag size={18} /> },
    { key: 'wishlist', label: 'Favoritos', icon: <Heart size={18} /> },
    { key: 'datos', label: 'Mis datos', icon: <User size={18} /> },
  ];

  const estadoLabel: Record<string, string> = {
    pendiente: 'Pendiente',
    pagado: 'Pagado',
    completado: 'Completado',
    cancelado: 'Cancelado',
  };

  return (
    <div className="section-padding">
      <div className="container-roperito max-w-4xl mx-auto">
        <h1 className="font-serif text-3xl font-bold text-text mb-2">Hola, {user.nombre} 👋</h1>
        <p className="font-sans text-text-light mb-8">{user.email}</p>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-1 border-b border-border mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-pink text-pink'
                  : 'border-transparent text-text-light hover:text-text'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Crédito */}
        {activeTab === 'credito' && (
          <div>
            <div className="bg-pink/10 rounded-card p-8 text-center mb-8">
              <p className="font-label text-xs uppercase tracking-widest text-text-light mb-1">Tu crédito disponible</p>
              <p className="font-serif text-5xl font-bold text-pink">${Number(user.credit_balance).toLocaleString('es-AR')}</p>
            </div>

            {credits.length > 0 ? (
              <div className="space-y-3">
                <h3 className="font-sans font-semibold text-text mb-2">Historial</h3>
                {credits.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center border-b border-border py-3">
                    <div>
                      <p className="font-sans text-sm text-text">{tx.descripcion}</p>
                      <p className="font-label text-xs text-text-light">{new Date(tx.fecha).toLocaleDateString('es-AR')}</p>
                    </div>
                    <span className={`font-bold text-sm ${tx.tipo === 'credito' ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.tipo === 'credito' ? '+' : '-'}${tx.monto}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="font-sans text-text-light mb-3">Todavía no tenés movimientos de crédito</p>
                <Link href="/vender" className="btn-primary">Traé ropa y empezá a acumular</Link>
              </div>
            )}
          </div>
        )}

        {/* Tab: Compras */}
        {activeTab === 'compras' && (
          <div>
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-border rounded-card p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-sans font-bold text-sm text-text">Orden #{order.id}</p>
                        <p className="font-label text-xs text-text-light">
                          {new Date(order.fecha).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-bold px-2 py-1 rounded-btn ${
                          order.estado === 'pagado' || order.estado === 'completado'
                            ? 'bg-green-100 text-green-700'
                            : order.estado === 'cancelado'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {estadoLabel[order.estado] || order.estado}
                        </span>
                        <p className="font-sans font-bold text-text mt-1">${order.total}</p>
                      </div>
                    </div>
                    {order.items_count !== undefined && (
                      <p className="font-sans text-xs text-text-light">{order.items_count} prenda(s)</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="font-sans text-text-light mb-3">Aún no hiciste ninguna compra</p>
                <Link href="/tienda" className="btn-primary">Explorá la tienda</Link>
              </div>
            )}
          </div>
        )}

        {/* Tab: Wishlist */}
        {activeTab === 'wishlist' && (
          <div>
            {wishlistProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {wishlistProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-card shadow-soft overflow-hidden relative">
                    <Link href={`/tienda/${product.slug}`}>
                      <div className="relative aspect-[3/4] bg-gray-100">
                        {product.imagen_principal ? (
                          <Image
                            src={product.imagen_principal}
                            alt={product.nombre}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-light text-xs">Sin imagen</div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-sans text-sm font-semibold text-text truncate">{product.nombre}</h3>
                        <p className="font-label text-xs text-text-light">Talle {product.talle}</p>
                        <p className="font-sans font-bold text-text mt-1">${product.precio}</p>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleRemoveWishlist(product.id)}
                      className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-white"
                      aria-label="Quitar de favoritos"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="font-sans text-text-light mb-3">Tu lista de favoritos está vacía</p>
                <Link href="/tienda" className="btn-primary">Guardá lo que te gusta para después</Link>
              </div>
            )}
          </div>
        )}

        {/* Tab: Datos */}
        {activeTab === 'datos' && (
          <div className="max-w-md">
            <div className="space-y-4">
              <div>
                <label className="font-label text-xs uppercase tracking-widest text-text-light block mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full border border-border rounded-btn px-4 py-3 font-sans text-sm focus:outline-none focus:border-pink"
                />
              </div>
              <div>
                <label className="font-label text-xs uppercase tracking-widest text-text-light block mb-1">Apellido</label>
                <input
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  className="w-full border border-border rounded-btn px-4 py-3 font-sans text-sm focus:outline-none focus:border-pink"
                />
              </div>
              <div>
                <label className="font-label text-xs uppercase tracking-widest text-text-light block mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-border rounded-btn px-4 py-3 font-sans text-sm focus:outline-none focus:border-pink"
                />
              </div>
              <div>
                <label className="font-label text-xs uppercase tracking-widest text-text-light block mb-1">Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full border border-border rounded-btn px-4 py-3 font-sans text-sm bg-gray-50 text-text-light"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary w-full"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              {saveMsg && <p className="text-center text-sm text-green-600">{saveMsg}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
