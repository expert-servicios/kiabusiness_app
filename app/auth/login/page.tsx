'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState<'magic' | 'google' | 'microsoft' | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading('magic');
    const supabase = getSupabaseClient();
    if (!supabase) { setError('Error de configuración. Inténtalo de nuevo.'); setLoading(null); return; }
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` }
      });
      if (err) throw err;
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar el enlace.');
    } finally {
      setLoading(null);
    }
  };

  const handleMicrosoft = async () => {
    setError('');
    setLoading('microsoft');
    const supabase = getSupabaseClient();
    if (!supabase) { setError('Error de configuración. Inténtalo de nuevo.'); setLoading(null); return; }
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` }
      });
      if (err) throw err;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión con Microsoft.');
      setLoading(null);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading('google');
    const supabase = getSupabaseClient();
    if (!supabase) { setError('Error de configuración. Inténtalo de nuevo.'); setLoading(null); return; }
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` }
      });
      if (err) throw err;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión con Google.');
      setLoading(null);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#07111d] px-4 py-12">
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4A017]/5 blur-[120px]" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <Link href="/" className="transition-opacity hover:opacity-80">
            <Image
              src="/logos/EXPERT_logo/expert-logo-light-clean.png"
              alt="EXPERT"
              width={120}
              height={120}
              priority
              className="drop-shadow-[0_4px_24px_rgba(212,160,23,0.25)]"
            />
          </Link>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#D4A017]">Portal de cliente</p>
            <h1 className="mt-1 font-serif text-2xl font-bold text-white">Accede a tu panel</h1>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
          {submitted ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D4A017]/15 ring-1 ring-[#D4A017]/30">
                <Mail className="h-7 w-7 text-[#D4A017]" />
              </div>
              <div>
                <p className="font-semibold text-white">Revisa tu email</p>
                <p className="mt-1 text-sm text-white/60">
                  Hemos enviado un enlace de acceso a{' '}
                  <span className="font-medium text-white/80">{email}</span>
                </p>
                <p className="mt-2 text-xs text-white/40">El enlace caduca en 24 horas.</p>
              </div>
              <button
                type="button"
                onClick={() => { setSubmitted(false); setEmail(''); }}
                className="mt-2 text-sm font-semibold text-[#D4A017] hover:text-[#F2C14E]"
              >
                Usar otro email
              </button>
            </div>
          ) : (
            /* ── Form state ── */
            <div className="space-y-5">
              {error && (
                <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {/* Magic link form */}
              <form onSubmit={handleMagicLink} className="space-y-3">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-white/60">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    disabled={loading === 'magic'}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-[#D4A017]/60 focus:ring-2 focus:ring-[#D4A017]/20 disabled:opacity-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!!loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4A017] px-5 py-3 text-sm font-bold text-[#07111d] shadow-lg shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading === 'magic' ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</>
                  ) : (
                    <><Mail className="h-4 w-4" /> Enviar enlace de acceso
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-white/30">o continúa con</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              {/* Google button */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={!!loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading === 'google' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                Acceder con Google
              </button>

              {/* Microsoft button */}
              <button
                type="button"
                onClick={handleMicrosoft}
                disabled={!!loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading === 'microsoft' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#F25022" d="M1 1h10.5v10.5H1z" />
                    <path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z" />
                    <path fill="#00A4EF" d="M1 12.5h10.5V23H1z" />
                    <path fill="#FFB900" d="M12.5 12.5H23V23H12.5z" />
                  </svg>
                )}
                Acceder con Microsoft
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-white/40">
          Al acceder aceptas nuestros{' '}
          <Link href="/terminos" className="underline hover:text-white/60">Términos de uso</Link>
          {' '}y la{' '}
          <Link href="/privacidad" className="underline hover:text-white/60">Política de privacidad</Link>
        </p>
        <p className="mt-3 text-center text-xs text-white/30">
          <Link href="/" className="hover:text-white/50">← Volver al inicio</Link>
        </p>
      </div>
    </main>
  );
}
