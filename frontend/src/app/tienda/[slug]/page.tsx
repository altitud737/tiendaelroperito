'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getProductBySlug, addToWishlist } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCart, CartItem } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { Heart, Check, ChevronDown, MessageCircle } from 'lucide-react';

interface ProductImage {
  id: number;
  imagen: string;
  orden: number;
  es_principal: boolean;
}

interface Product {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string;
  precio: number;
  precio_original: number;
  talle: string;
  genero: string;
  categoria: string;
  estado: string;
  historia: string;
  familia_origen: string;
  revisado: boolean;
  lavado: boolean;
  sin_manchas: boolean;
  es_nuevo: boolean;
  fecha_publicacion: string;
  imagenes: ProductImage[];
}

// DECISIÓN: Guía de talles hardcodeada. Estructura preparada para hacerla dinámica si el negocio lo requiere.
const GUIA_TALLES = [
  { talle: '0000', edad: 'Recién nacido', altura: '50 cm' },
  { talle: '000', edad: '0-3 meses', altura: '56 cm' },
  { talle: '00', edad: '3-6 meses', altura: '62 cm' },
  { talle: '0', edad: '6-9 meses', altura: '68 cm' },
  { talle: '1', edad: '9-12 meses', altura: '74 cm' },
  { talle: '2', edad: '1-2 años', altura: '80-86 cm' },
  { talle: '3', edad: '2-3 años', altura: '86-92 cm' },
  { talle: '4', edad: '3-4 años', altura: '92-98 cm' },
  { talle: '5', edad: '4-5 años', altura: '98-104 cm' },
  { talle: '6', edad: '5-6 años', altura: '104-110 cm' },
  { talle: '7', edad: '6-7 años', altura: '110-116 cm' },
  { talle: '8', edad: '7-8 años', altura: '116-122 cm' },
  { talle: '10', edad: '8-10 años', altura: '122-134 cm' },
  { talle: '12', edad: '10-12 años', altura: '134-146 cm' },
  { talle: '14', edad: '12-14 años', altura: '146-158 cm' },
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [tallesOpen, setTallesOpen] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    if (params.slug) {
      getProductBySlug(params.slug as string)
        .then((data) => setProduct(data))
        .catch(() => setProduct(null))
        .finally(() => setLoading(false));
    }
  }, [params.slug]);

  function handleAddToCart() {
    if (!product || product.estado !== 'disponible') return;
    const mainImg = product.imagenes.find((i) => i.es_principal) || product.imagenes[0];
    const cartItem: CartItem = {
      id: product.id,
      nombre: product.nombre,
      precio: product.precio,
      precio_original: product.precio_original,
      talle: product.talle,
      slug: product.slug,
      imagen: mainImg?.imagen || null,
    };
    addItem(cartItem);
    setAddedToCart(true);
  }

  async function handleWishlist() {
    if (!user || !token) {
      router.push(`/login?next=/tienda/${product?.slug}`);
      return;
    }
    if (product) {
      try {
        await addToWishlist(token, product.id);
        setWishlisted(true);
      } catch {
        // silently fail
      }
    }
  }

  if (loading) {
    return (
      <div className="section-padding">
        <div className="container-roperito">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-100 rounded-card animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-100 rounded w-3/4 animate-pulse" />
              <div className="h-6 bg-gray-100 rounded w-1/2 animate-pulse" />
              <div className="h-12 bg-gray-100 rounded w-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="section-padding text-center">
        <h1 className="font-serif text-3xl text-text mb-4">Producto no encontrado</h1>
        <Link href="/tienda" className="btn-primary">Volver a la tienda</Link>
      </div>
    );
  }

  const isVendido = product.estado === 'vendido';
  const generoLabel = product.genero === 'nena' ? 'Nena' : product.genero === 'nene' ? 'Nene' : 'Unisex';
  const sortedImages = [...product.imagenes].sort((a, b) => a.orden - b.orden);

  return (
    <div className="section-padding">
      <div className="container-roperito">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">

          {/* ============================================================= */}
          {/* 1. GALERÍA DE FOTOS */}
          {/* ============================================================= */}
          <div>
            {/* Imagen principal */}
            <div className="relative aspect-square bg-gray-100 rounded-card overflow-hidden mb-3">
              {sortedImages.length > 0 ? (
                <Image
                  src={sortedImages[selectedImage]?.imagen}
                  alt={product.nombre}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-light">
                  Sin imagen
                </div>
              )}

              {isVendido && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="bg-white text-text font-bold px-6 py-3 rounded-card text-lg">
                    Ya encontró nueva familia 💛
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails (desktop) */}
            {sortedImages.length > 1 && (
              <div className="hidden md:flex gap-2 overflow-x-auto">
                {sortedImages.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-20 h-20 rounded-btn overflow-hidden shrink-0 border-2 transition-colors ${
                      selectedImage === i ? 'border-pink' : 'border-transparent'
                    }`}
                  >
                    <Image src={img.imagen} alt="" fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}

            {/* Swipe dots (mobile) */}
            {sortedImages.length > 1 && (
              <div className="flex md:hidden justify-center gap-2 mt-3">
                {sortedImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      selectedImage === i ? 'bg-pink' : 'bg-border'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ============================================================= */}
          {/* CONTENIDO DERECHO */}
          {/* ============================================================= */}
          <div>
            {/* 2. Nombre + talle + género */}
            <div className="mb-4">
              {product.es_nuevo && (
                <span className="inline-block bg-pink text-white text-xs font-bold px-2 py-1 rounded-btn mb-2">
                  Nuevo
                </span>
              )}
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-text leading-tight">
                {product.nombre}
              </h1>
              <p className="font-label text-sm text-text-light mt-1">
                Talle {product.talle} · {generoLabel} · {product.categoria.charAt(0).toUpperCase() + product.categoria.slice(1)}
              </p>
            </div>

            {/* 3. Precio con comparación */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-sans text-3xl font-bold text-text">
                ${product.precio.toLocaleString('es-AR')}
              </span>
              {product.precio_original > product.precio && (
                <span className="font-sans text-lg text-text-light line-through">
                  ${product.precio_original.toLocaleString('es-AR')}
                </span>
              )}
            </div>

            {/* 4. Badges de calidad */}
            <div className="flex flex-wrap gap-3 mb-6">
              {product.revisado && (
                <span className="flex items-center gap-1 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-btn">
                  <Check size={14} /> Revisado
                </span>
              )}
              {product.lavado && (
                <span className="flex items-center gap-1 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-btn">
                  <Check size={14} /> Lavado
                </span>
              )}
              {product.sin_manchas && (
                <span className="flex items-center gap-1 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-btn">
                  <Check size={14} /> Sin manchas
                </span>
              )}
            </div>

            {/* 5. CTA: "Lo quiero" + wishlist */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={isVendido || addedToCart}
                className={`flex-1 py-4 rounded-btn font-bold text-lg transition-colors ${
                  isVendido
                    ? 'bg-gray-200 text-text-light cursor-not-allowed'
                    : addedToCart
                      ? 'bg-green-500 text-white'
                      : 'btn-primary'
                }`}
              >
                {isVendido ? 'No disponible' : addedToCart ? '¡Agregado!' : 'Lo quiero'}
              </button>
              <button
                onClick={handleWishlist}
                className={`w-14 h-14 rounded-btn border-2 flex items-center justify-center transition-colors ${
                  wishlisted ? 'border-pink bg-pink text-white' : 'border-border text-text hover:border-pink'
                }`}
                aria-label="Agregar a favoritos"
              >
                <Heart size={20} fill={wishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* ============================================================= */}
            {/* 6. HISTORIA DE LA PRENDA — EN EL PRIMER TERCIO, NO AL FINAL */}
            {/* ============================================================= */}
            {(product.historia || product.familia_origen) && (
              <div className="bg-yellow/20 rounded-card p-6 mb-8">
                <h3 className="font-serif text-xl font-bold text-text mb-2">La historia de esta prenda</h3>
                {product.familia_origen && (
                  <p className="font-label text-xs uppercase tracking-widest text-text-light mb-2">
                    Familia: {product.familia_origen}
                  </p>
                )}
                {product.historia && (
                  <p className="font-sans text-sm text-text leading-relaxed">{product.historia}</p>
                )}
              </div>
            )}

            {/* Descripción */}
            {product.descripcion && (
              <div className="mb-8">
                <h3 className="font-serif text-lg font-bold text-text mb-2">Descripción</h3>
                <p className="font-sans text-sm text-text-light leading-relaxed">{product.descripcion}</p>
              </div>
            )}

            {/* 7. Guía de talles — acordeón */}
            <div className="border border-border rounded-card mb-8">
              <button
                onClick={() => setTallesOpen(!tallesOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <span className="font-sans font-semibold text-sm text-text">Guía de talles</span>
                <ChevronDown
                  size={18}
                  className={`text-text-light transition-transform ${tallesOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {tallesOpen && (
                <div className="border-t border-border px-4 py-3">
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <span className="font-bold text-text-light">Talle</span>
                    <span className="font-bold text-text-light">Edad</span>
                    <span className="font-bold text-text-light">Altura</span>
                    {GUIA_TALLES.map((row) => (
                      <span
                        key={row.talle}
                        className={`contents ${row.talle === product.talle ? '[&>*]:font-bold [&>*]:text-pink' : ''}`}
                      >
                        <span className="py-1">{row.talle}</span>
                        <span className="py-1">{row.edad}</span>
                        <span className="py-1">{row.altura}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 8. Contacto WhatsApp */}
            <div className="bg-gray-50 rounded-card p-4 text-center">
              <p className="font-sans text-sm text-text mb-2">¿Tenés dudas sobre esta prenda?</p>
              <a
                href={`https://wa.me/5492346530892?text=${encodeURIComponent(`Hola, quiero consultar sobre "${product.nombre}" (talle ${product.talle})`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-green-600 hover:text-green-700"
              >
                <MessageCircle size={16} />
                Consultanos por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
