'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getFeaturedProducts } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { Shirt, Search, Heart, DollarSign, Quote } from 'lucide-react';

// DECISIÓN: Home como client component para poder hacer fetch de productos destacados

interface Product {
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

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    getFeaturedProducts()
      .then((data) => setFeatured(Array.isArray(data) ? data : data.results || []))
      .catch(() => setFeatured([]));
  }, []);

  return (
    <>
      {/* ============================================================= */}
      {/* SECCIÓN 1 — Hero */}
      {/* ============================================================= */}
      <section className="relative min-h-[80vh] flex items-center justify-center bg-gray-100">
        {/* DECISIÓN: Overlay sobre fondo gris como placeholder. Reemplazar con imagen real del negocio. */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/20" />
        <div className="relative z-10 text-center px-4 max-w-3xl">
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-white leading-tight mb-4">
            Pequeñas prendas, grandes historias
          </h1>
          <p className="font-sans text-lg md:text-xl text-white/90 mb-8">
            Moda circular infantil para familias de Chivilcoy y alrededores
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/tienda" className="btn-primary text-center text-lg">
              Ver la tienda
            </Link>
            <Link href="/vender" className="btn-secondary border-white text-white hover:bg-white hover:text-text text-center text-lg">
              Vendé tu ropa
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* SECCIÓN 2 — Cómo funciona */}
      {/* ============================================================= */}
      <section className="section-padding bg-yellow/20">
        <div className="container-roperito">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-center text-text mb-12">
            ¿Cómo funciona El Roperito?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Shirt, step: '1', title: 'Traés tu ropa', desc: 'Nos acercás las prendas que tus hijos ya no usan.' },
              { icon: Search, step: '2', title: 'La revisamos', desc: 'Seleccionamos lo mejor y lo preparamos con cuidado.' },
              { icon: Heart, step: '3', title: 'Otra familia la elige', desc: 'Publicamos las prendas y una nueva familia las encuentra.' },
              { icon: DollarSign, step: '4', title: 'Vos cobrás', desc: 'Recibís crédito para la tienda o efectivo en el local.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-soft">
                  <item.icon size={28} className="text-pink" />
                </div>
                <span className="font-label text-xs uppercase tracking-widest text-text-light">Paso {item.step}</span>
                <h3 className="font-serif text-xl font-bold text-text mt-1 mb-2">{item.title}</h3>
                <p className="font-sans text-sm text-text-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* SECCIÓN 3 — Productos destacados */}
      {/* ============================================================= */}
      <section className="section-padding">
        <div className="container-roperito">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-center text-text mb-2">
            Prendas destacadas
          </h2>
          <p className="font-sans text-text-light text-center mb-10">
            Seleccionadas especialmente para vos
          </p>

          {featured.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featured.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-text-light py-8">
              Pronto subiremos prendas destacadas. ¡Volvé pronto!
            </p>
          )}

          <div className="text-center mt-10">
            <Link href="/tienda" className="btn-primary">
              Ver toda la tienda
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* SECCIÓN 4 — Prueba social */}
      {/* ============================================================= */}
      <section className="section-padding bg-gray-50">
        <div className="container-roperito">
          {/* Números impactantes */}
          {/* DECISIÓN: Números hardcodeados. Actualizar manualmente a medida que el negocio crece. */}
          <div className="grid grid-cols-3 gap-4 mb-16">
            {[
              { number: '+350', label: 'prendas circuladas' },
              { number: '+120', label: 'familias participaron' },
              { number: '100%', label: 'revisado con amor' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-serif text-3xl md:text-5xl font-bold text-pink">{stat.number}</p>
                <p className="font-sans text-sm text-text-light mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Testimonios */}
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-center text-text mb-10">
            Lo que dicen las familias
          </h2>
          {/* DECISIÓN: Testimonios hardcodeados. Estructura preparada para reemplazar con datos reales. */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: 'Encontré un conjunto hermoso para Sofi a un precio increíble. La ropa estaba impecable, como nueva.',
                name: 'Lu',
                detail: 'mamá de Sofi',
              },
              {
                quote: 'Me encanta la idea de darle una segunda vida a la ropa. Emma ya tiene todo su guardarropas del Roperito.',
                name: 'Valentina',
                detail: 'mamá de Emma',
              },
              {
                quote: 'Traje la ropa que Tomás ya no usaba y me llevé crédito para comprar talle nuevo. Genial el sistema.',
                name: 'Diego',
                detail: 'papá de Tomás',
              },
            ].map((testimonial) => (
              <div
                key={testimonial.name}
                className="bg-white rounded-card p-6 shadow-soft"
              >
                <Quote size={24} className="text-pink/40 mb-3" />
                <p className="font-sans text-sm text-text leading-relaxed mb-4">
                  {testimonial.quote}
                </p>
                <div>
                  <p className="font-sans font-bold text-sm text-text">{testimonial.name}</p>
                  <p className="font-label text-xs text-text-light">{testimonial.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* SECCIÓN 5 — CTA Vendé tu ropa */}
      {/* ============================================================= */}
      <section className="section-padding bg-blue">
        <div className="container-roperito text-center max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-text mb-4">
            ¿Tenés ropa que tus hijos ya no usan?
          </h2>
          <p className="font-sans text-text/80 mb-8 text-lg">
            Traéla al Roperito y dale una nueva historia
          </p>
          <Link href="/vender" className="btn-white text-lg">
            Quiero Vendé tu ropa
          </Link>
        </div>
      </section>
    </>
  );
}
