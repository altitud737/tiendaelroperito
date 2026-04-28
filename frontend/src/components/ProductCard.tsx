'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { addToWishlist } from '@/lib/api';
import { useState } from 'react';

// DECISIÓN: Componente reutilizable para cards de producto en Home, Tienda y Wishlist

interface ProductCardProps {
  id: number;
  nombre: string;
  slug: string;
  precio: number;
  precio_original: number;
  talle: string;
  imagen_principal: string | null;
  es_nuevo: boolean;
  estado: string;
}

export default function ProductCard({
  id, nombre, slug, precio, precio_original, talle, imagen_principal, es_nuevo, estado,
}: ProductCardProps) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);

  async function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !token) {
      router.push('/login?next=/tienda');
      return;
    }
    try {
      await addToWishlist(token, id);
      setWishlisted(true);
    } catch {
      // silently fail
    }
  }

  return (
    <Link href={`/tienda/${slug}`} className="group block">
      <div className="bg-white rounded-card shadow-soft overflow-hidden transition-shadow hover:shadow-md">
        {/* Imagen */}
        <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
          {imagen_principal ? (
            <Image
              src={imagen_principal}
              alt={nombre}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-light text-sm">
              Sin imagen
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {es_nuevo && (
              <span className="bg-pink text-white text-xs font-bold px-2 py-1 rounded-btn">
                Nuevo
              </span>
            )}
            {estado === 'disponible' && (
              <span className="bg-white/90 text-text text-xs font-semibold px-2 py-1 rounded-btn">
                1 disponible
              </span>
            )}
            {estado === 'vendido' && (
              <span className="bg-text text-white text-xs font-bold px-2 py-1 rounded-btn">
                Vendido
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-pink hover:text-white transition-colors"
            aria-label="Agregar a favoritos"
          >
            <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-sans text-sm font-semibold text-text truncate">{nombre}</h3>
          <p className="font-label text-xs text-text-light mt-0.5">Talle {talle}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-sans font-bold text-text">${precio.toLocaleString('es-AR')}</span>
            {precio_original > precio && (
              <span className="font-sans text-xs text-text-light line-through">
                ${precio_original.toLocaleString('es-AR')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
