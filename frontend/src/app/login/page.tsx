'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

// DECISIÓN: Login redirige según ?next param. Si no hay next, va al home.
// El carrito se mantiene en localStorage, así que sobrevive al login.

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // DECISIÓN: Si ya está logueado, redirigir inmediatamente
  if (user) {
    router.push(next);
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push(next);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Email o contraseña incorrectos');
      } else {
        setError('Email o contraseña incorrectos');
      }
    } finally {
      setLoading(false);
    }
  }

  const showCheckoutMsg = next === '/checkout';

  return (
    <div className="section-padding">
      <div className="container-roperito max-w-md mx-auto">
        <h1 className="font-serif text-3xl font-bold text-text text-center mb-2">
          Iniciar sesión
        </h1>

        {showCheckoutMsg && (
          <div className="bg-yellow/20 rounded-btn p-4 text-center mb-6">
            <p className="font-sans text-sm text-text">
              Para completar tu compra, ingresá o creá tu cuenta
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label className="font-label text-xs uppercase tracking-widest text-text-light block mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-border rounded-btn px-4 py-3 font-sans text-sm focus:outline-none focus:border-pink"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="font-label text-xs uppercase tracking-widest text-text-light block mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-border rounded-btn px-4 py-3 font-sans text-sm focus:outline-none focus:border-pink"
              placeholder="Tu contraseña"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center font-sans text-sm text-text-light mt-6">
          ¿No tenés cuenta?{' '}
          <Link
            href={`/registro${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}
            className="text-pink font-semibold hover:text-pink-dark"
          >
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
