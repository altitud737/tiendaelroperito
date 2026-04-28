'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Heart, ShoppingBag, User, Menu, X, ChevronDown } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // DECISIÓN: Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border h-16">
      <div className="container-roperito h-full flex items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link href="/" className="font-serif text-2xl font-bold text-text tracking-wide">
          El Roperito
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/tienda" className="font-sans text-sm font-semibold text-text hover:text-pink-dark transition-colors">
            Tienda
          </Link>
          <Link href="/vender" className="font-sans text-sm font-semibold text-pink hover:text-pink-dark transition-colors">
            Vendé tu ropa
          </Link>
          <Link href="/tienda?novedades=true" className="font-sans text-sm font-semibold text-text hover:text-pink-dark transition-colors">
            Novedades
          </Link>
        </nav>

        {/* Icons desktop */}
        <div className="hidden md:flex items-center gap-4">
          {/* Wishlist */}
          <Link
            href={user ? '/perfil?tab=wishlist' : '/login?next=/perfil?tab=wishlist'}
            className="text-text hover:text-pink transition-colors"
            aria-label="Wishlist"
          >
            <Heart size={20} />
          </Link>

          {/* Carrito */}
          <Link href="/checkout" className="relative text-text hover:text-pink transition-colors" aria-label="Carrito">
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-pink text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Usuario */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex items-center gap-1 text-text hover:text-pink transition-colors"
              >
                <User size={20} />
                <ChevronDown size={14} />
              </button>
              {userDropdown && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-border rounded-card shadow-soft w-56 py-2 z-50">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="font-semibold text-sm">{user.nombre} {user.apellido}</p>
                    <p className="text-pink font-bold text-sm">Crédito: ${user.credit_balance}</p>
                  </div>
                  <Link
                    href="/perfil"
                    className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                    onClick={() => setUserDropdown(false)}
                  >
                    Mi perfil
                  </Link>
                  <Link
                    href="/perfil?tab=compras"
                    className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                    onClick={() => setUserDropdown(false)}
                  >
                    Mis compras
                  </Link>
                  <button
                    onClick={() => { logout(); setUserDropdown(false); }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 transition-colors"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="text-text hover:text-pink transition-colors" aria-label="Iniciar sesión">
              <User size={20} />
            </Link>
          )}
        </div>

        {/* Mobile: hamburger + cart */}
        <div className="flex md:hidden items-center gap-3">
          <Link href="/checkout" className="relative text-text" aria-label="Carrito">
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-pink text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </Link>
          <button onClick={() => setMobileOpen(true)} aria-label="Menú">
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile slide-out panel */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setMobileOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-72 bg-white z-50 shadow-lg p-6 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <span className="font-serif text-xl font-bold">El Roperito</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">
                <X size={24} />
              </button>
            </div>

            <nav className="flex flex-col gap-4 flex-1">
              <Link href="/tienda" className="font-sans font-semibold text-text py-2" onClick={() => setMobileOpen(false)}>
                Tienda
              </Link>
              <Link href="/vender" className="font-sans font-semibold text-pink py-2" onClick={() => setMobileOpen(false)}>
                Vendé tu ropa
              </Link>
              <Link href="/tienda?novedades=true" className="font-sans font-semibold text-text py-2" onClick={() => setMobileOpen(false)}>
                Novedades
              </Link>

              <hr className="border-border my-2" />

              <Link
                href={user ? '/perfil?tab=wishlist' : '/login?next=/perfil?tab=wishlist'}
                className="flex items-center gap-2 font-sans text-text py-2"
                onClick={() => setMobileOpen(false)}
              >
                <Heart size={18} /> Favoritos
              </Link>

              {user ? (
                <>
                  <Link href="/perfil" className="flex items-center gap-2 font-sans text-text py-2" onClick={() => setMobileOpen(false)}>
                    <User size={18} /> Mi perfil
                  </Link>
                  <p className="text-pink font-bold text-sm px-1">Crédito: ${user.credit_balance}</p>
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="text-left text-red-500 font-sans py-2"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <Link href="/login" className="flex items-center gap-2 font-sans text-text py-2" onClick={() => setMobileOpen(false)}>
                  <User size={18} /> Iniciar sesión
                </Link>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
