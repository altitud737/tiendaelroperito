'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { register } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function RegistroPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    password_confirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // DECISIÓN: Si ya está logueado, redirigir
  if (user) {
    router.push(next);
    return null;
  }

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password_confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      // DECISIÓN: Post-registro se hace login automático y se redirige según ?next
      await login(formData.email, formData.password);
      router.push(next);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Error al registrar');
      } else {
        setError('Error al registrar');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section-padding">
      <div className="container-roperito max-w-md mx-auto">
        <h1 className="font-serif text-3xl font-bold text-text text-center mb-6">
          Crear cuenta
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-label text-xs uppercase tracking-widest text-text-light block mb-1">Nombre</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                required
                className="w-full border border-border rounded-btn px-4 py-3 font-sans text-sm focus:outline-none focus:border-pink"
              />
            </div>
            <div>
              <label className="font-label text-xs uppercase tracking-widest text-text-light block mb-1">Apellido</label>
              <input
                type="text"
                value={formData.apellido}
                onChange={(e) => handleChange('apellido', e.target.value)}
                required
                className="w-full border border-border rounded-btn px-4 py-3 font-sans text-sm focus:outline-none focus:border-pink"
              />
            </div>
          </div>

          <div>
            <label className="font-label text-xs uppercase tracking-widest text-text-light block mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
              className="w-full border border-border rounded-btn px-4 py-3 font-sans text-sm focus:outline-none focus:border-pink"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="font-label text-xs uppercase tracking-widest text-text-light block mb-1">Contraseña</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              required
              minLength={8}
              className="w-full border border-border rounded-btn px-4 py-3 font-sans text-sm focus:outline-none focus:border-pink"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label className="font-label text-xs uppercase tracking-widest text-text-light block mb-1">Confirmar contraseña</label>
            <input
              type="password"
              value={formData.password_confirm}
              onChange={(e) => handleChange('password_confirm', e.target.value)}
              required
              className="w-full border border-border rounded-btn px-4 py-3 font-sans text-sm focus:outline-none focus:border-pink"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center font-sans text-sm text-text-light mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link
            href={`/login${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}
            className="text-pink font-semibold hover:text-pink-dark"
          >
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
