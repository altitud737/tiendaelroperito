'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProducts } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { SlidersHorizontal, X } from 'lucide-react';

interface Product {
  id: number;
  nombre: string;
  slug: string;
  precio: number;
  precio_original: number;
  talle: string;
  genero: string;
  categoria: string;
  imagen_principal: string | null;
  es_nuevo: boolean;
  estado: string;
}

const TALLES = ['0000','000','00','0','1','2','3','4','5','6','7','8','9','10','12','14'];
const GENEROS = [
  { value: 'nena', label: 'Nena' },
  { value: 'nene', label: 'Nene' },
  { value: 'unisex', label: 'Unisex' },
];

export default function TiendaPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filtros
  const [talle, setTalle] = useState('');
  const [genero, setGenero] = useState('');
  const [novedades, setNovedades] = useState(searchParams.get('novedades') === 'true');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (talle) params.talle = talle;
      if (genero) params.genero = genero;
      if (novedades) params.novedades = 'true';

      const data = await getProducts(params);
      setProducts(data.results || []);
      setTotalCount(data.total_count || 0);
    } catch {
      setProducts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [talle, genero, novedades]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function clearFilters() {
    setTalle('');
    setGenero('');
    setNovedades(false);
  }

  const hasFilters = talle || genero || novedades;

  return (
    <div className="section-padding">
      <div className="container-roperito">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-text">Tienda</h1>
            <p className="font-sans text-sm text-text-light mt-1">
              Se encontraron <strong className="text-text">{totalCount}</strong> prendas
            </p>
          </div>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="md:hidden flex items-center gap-2 text-sm font-semibold text-text border border-border rounded-btn px-3 py-2"
          >
            <SlidersHorizontal size={16} />
            Filtros
          </button>
        </div>

        <div className="flex gap-8">
          {/* Filtros sidebar */}
          <aside className={`${filtersOpen ? 'fixed inset-0 z-50 bg-white p-6 overflow-auto' : 'hidden'} md:block md:static md:w-56 md:shrink-0`}>
            {/* Mobile close */}
            <div className="flex justify-between items-center mb-6 md:hidden">
              <h2 className="font-serif text-xl font-bold">Filtros</h2>
              <button onClick={() => setFiltersOpen(false)}><X size={24} /></button>
            </div>

            {/* Talle (prioridad máxima) */}
            <div className="mb-6">
              <h3 className="font-label text-xs uppercase tracking-widest text-text-light mb-3">Talle</h3>
              <div className="flex flex-wrap gap-2">
                {TALLES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTalle(talle === t ? '' : t)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-btn border transition-colors ${
                      talle === t
                        ? 'bg-pink text-white border-pink'
                        : 'border-border text-text hover:border-pink'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Género */}
            <div className="mb-6">
              <h3 className="font-label text-xs uppercase tracking-widest text-text-light mb-3">Género</h3>
              <div className="flex flex-col gap-2">
                {GENEROS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGenero(genero === g.value ? '' : g.value)}
                    className={`px-3 py-2 text-sm font-semibold rounded-btn border text-left transition-colors ${
                      genero === g.value
                        ? 'bg-pink text-white border-pink'
                        : 'border-border text-text hover:border-pink'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Novedades toggle */}
            <div className="mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={novedades}
                  onChange={(e) => setNovedades(e.target.checked)}
                  className="w-4 h-4 accent-pink"
                />
                <span className="font-sans text-sm font-semibold text-text">Solo novedades</span>
              </label>
            </div>

            {hasFilters && (
              <button onClick={clearFilters} className="text-sm text-pink hover:text-pink-dark font-semibold">
                Limpiar filtros
              </button>
            )}

            {/* Mobile apply */}
            <button
              onClick={() => setFiltersOpen(false)}
              className="md:hidden btn-primary w-full mt-6"
            >
              Ver resultados
            </button>
          </aside>

          {/* Grid de productos */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-card aspect-[3/4] animate-pulse" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="font-serif text-2xl text-text mb-2">No encontramos prendas</p>
                <p className="font-sans text-text-light mb-4">Probá ajustando los filtros</p>
                {hasFilters && (
                  <button onClick={clearFilters} className="btn-primary">
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
