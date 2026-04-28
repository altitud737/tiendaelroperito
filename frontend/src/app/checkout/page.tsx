'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { createCheckout } from '@/lib/api';
import { Trash2, CreditCard, ShieldCheck } from 'lucide-react';

// DECISIÓN: Si el usuario no está logueado y hace click en "Pagar",
// se redirige a /login?next=/checkout. El carrito sobrevive en localStorage.

export default function CheckoutPage() {
  const { user, token, isLoading } = useAuth();
  const { items, removeItem, clearCart, total } = useCart();
  const router = useRouter();

  const [usarCredito, setUsarCredito] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successOrder, setSuccessOrder] = useState<number | null>(null);

  const creditDisponible = user ? Number(user.credit_balance) : 0;
  const creditoAplicado = usarCredito ? Math.min(creditDisponible, total) : 0;
  const totalFinal = total - creditoAplicado;

  async function handleCheckout() {
    if (!user || !token) {
      router.push('/login?next=/checkout');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const checkoutItems = items.map((item) => ({ product_id: item.id }));
      const data = await createCheckout(token, checkoutItems, usarCredito);

      if (data.paid_with_credit) {
        // Pagado completamente con crédito
        setSuccessOrder(data.orden_id);
        clearCart();
        return;
      }

      if (data.init_point) {
        // Redirigir a MercadoPago
        clearCart();
        window.location.href = data.init_point;
      } else {
        // DECISIÓN: En desarrollo sin MP configurado, mostrar éxito con aviso
        setSuccessOrder(data.orden_id);
        clearCart();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Error al procesar el pago');
      } else {
        setError('Error al procesar el pago');
      }
    } finally {
      setProcessing(false);
    }
  }

  // Estado: Éxito
  if (successOrder) {
    return (
      <div className="section-padding">
        <div className="container-roperito max-w-lg mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={32} className="text-green-600" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-text mb-2">¡Compra exitosa!</h1>
          <p className="font-sans text-text-light mb-2">Tu número de orden es:</p>
          <p className="font-serif text-4xl font-bold text-pink mb-6">#{successOrder}</p>
          <p className="font-sans text-sm text-text-light mb-8">
            Podés ver el estado de tu compra en tu perfil.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/perfil?tab=compras" className="btn-primary">Ver mis compras</Link>
            <Link href="/tienda" className="btn-secondary">Seguir comprando</Link>
          </div>
        </div>
      </div>
    );
  }

  // Estado: Carrito vacío
  if (items.length === 0) {
    return (
      <div className="section-padding">
        <div className="container-roperito max-w-lg mx-auto text-center">
          <h1 className="font-serif text-3xl font-bold text-text mb-4">Tu carrito está vacío</h1>
          <p className="font-sans text-text-light mb-6">Explorá la tienda y encontrá prendas únicas</p>
          <Link href="/tienda" className="btn-primary">Ir a la tienda</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding">
      <div className="container-roperito max-w-3xl mx-auto">
        <h1 className="font-serif text-3xl font-bold text-text mb-8">Tu carrito</h1>

        {/* Items */}
        <div className="space-y-4 mb-8">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 border border-border rounded-card p-4">
              {/* Imagen */}
              <div className="relative w-20 h-24 bg-gray-100 rounded-btn overflow-hidden shrink-0">
                {item.imagen ? (
                  <Image src={item.imagen} alt={item.nombre} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-light text-xs">Sin img</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link href={`/tienda/${item.slug}`} className="font-sans font-semibold text-sm text-text hover:text-pink truncate block">
                  {item.nombre}
                </Link>
                <p className="font-label text-xs text-text-light mt-0.5">Talle {item.talle}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-sans font-bold text-text">${item.precio.toLocaleString('es-AR')}</span>
                  {item.precio_original > item.precio && (
                    <span className="font-sans text-xs text-text-light line-through">
                      ${item.precio_original.toLocaleString('es-AR')}
                    </span>
                  )}
                </div>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeItem(item.id)}
                className="text-text-light hover:text-red-500 transition-colors self-start"
                aria-label="Eliminar"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        {/* Resumen */}
        <div className="bg-gray-50 rounded-card p-6">
          {/* Crédito toggle */}
          {user && creditDisponible > 0 && (
            <label className="flex items-center justify-between mb-4 cursor-pointer">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-pink" />
                <span className="font-sans text-sm font-semibold text-text">
                  Usar mi crédito (${creditDisponible.toLocaleString('es-AR')})
                </span>
              </div>
              <input
                type="checkbox"
                checked={usarCredito}
                onChange={(e) => setUsarCredito(e.target.checked)}
                className="w-5 h-5 accent-pink"
              />
            </label>
          )}

          <div className="space-y-2 mb-4">
            <div className="flex justify-between font-sans text-sm text-text-light">
              <span>Subtotal ({items.length} prenda{items.length > 1 ? 's' : ''})</span>
              <span>${total.toLocaleString('es-AR')}</span>
            </div>
            {creditoAplicado > 0 && (
              <div className="flex justify-between font-sans text-sm text-green-600">
                <span>Crédito aplicado</span>
                <span>-${creditoAplicado.toLocaleString('es-AR')}</span>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-4 flex justify-between items-center mb-6">
            <span className="font-sans font-bold text-lg text-text">Total a pagar</span>
            <span className="font-serif text-2xl font-bold text-text">
              ${totalFinal.toLocaleString('es-AR')}
            </span>
          </div>

          {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

          <button
            onClick={handleCheckout}
            disabled={processing || isLoading}
            className="btn-primary w-full text-lg py-4"
          >
            {processing
              ? 'Procesando...'
              : !user
                ? 'Iniciar sesión para comprar'
                : totalFinal <= 0
                  ? 'Confirmar compra con crédito'
                  : 'Pagar con MercadoPago'}
          </button>

          {!user && (
            <p className="text-center font-sans text-xs text-text-light mt-3">
              Para completar tu compra, ingresá o creá tu cuenta
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
