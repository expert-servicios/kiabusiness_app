'use client';

/**
 * /auth/holded-claude
 *
 * Auth bridge landing page for the Holded MCP server OAuth flow.
 * The MCP server redirects here when it needs a verified user identity.
 *
 * Flow:
 *   1. Page loads, reads `next` from query string
 *   2. Checks Supabase session (client-side)
 *   3. If not logged in → shows login button / auto-redirects to login
 *   4. If logged in → calls GET /api/auth/holded-claude?next=... to set
 *      the __session cookie + redirect back to MCP
 */

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Shield, Loader2, LogIn, AlertCircle } from 'lucide-react';

// Suspense wrapper required because useSearchParams() opts out of static rendering
export default function HoldedClaudeBridgePage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-[#f8f4eb]">
        <Loader2 className="h-6 w-6 animate-spin text-[#c88b25]" />
      </main>
    }>
      <HoldedClaudeBridgeContent />
    </Suspense>
  );
}

function HoldedClaudeBridgeContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const next         = searchParams.get('next') ?? '';

  const [status, setStatus] = useState<'checking' | 'redirecting' | 'needs-login' | 'error'>('checking');
  const [error,  setError]  = useState('');

  useEffect(() => {
    if (!next) {
      setStatus('error'); // eslint-disable-line react-hooks/set-state-in-effect
      setError('Parámetro `next` faltante. Vuelve a iniciar el proceso desde Claude.'); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        // Logged in — call the cookie-setter route, which redirects back to MCP
        setStatus('redirecting');
        const bridgeUrl = new URL('/api/auth/holded-claude', window.location.origin);
        bridgeUrl.searchParams.set('next', next);
        window.location.href = bridgeUrl.toString();
      } else {
        setStatus('needs-login');
      }
    }).catch(() => {
      setStatus('needs-login');
    });
  }, [next]);

  function handleLogin() {
    const loginUrl = new URL('/auth/login', window.location.origin);
    loginUrl.searchParams.set('redirectTo', window.location.href);
    router.push(loginUrl.toString());
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f4eb] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#e8dfc8] bg-white p-8 shadow-sm text-center">

        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#e8dfc8] bg-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/catalog/holded.png" alt="Holded" className="h-7 w-7 object-contain" />
            </div>
            <span className="text-lg text-[#c8b89a]">×</span>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c88b25]/10">
              <Shield className="h-6 w-6 text-[#c88b25]" />
            </div>
          </div>
        </div>

        <h1 className="mb-1 text-lg font-bold text-[#3d3528]">Conectar Holded con Claude</h1>
        <p className="mb-6 text-sm text-[#7a6e5f]">
          Para continuar necesitas iniciar sesión con tu cuenta de EXPERT.
        </p>

        {status === 'checking' && (
          <div className="flex items-center justify-center gap-2 text-sm text-[#7a6e5f]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verificando sesión…
          </div>
        )}

        {status === 'redirecting' && (
          <div className="flex items-center justify-center gap-2 text-sm text-[#7a6e5f]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirigiendo a Holded…
          </div>
        )}

        {status === 'needs-login' && (
          <button
            type="button"
            onClick={handleLogin}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#c88b25] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#b07820]"
          >
            <LogIn className="h-4 w-4" />
            Iniciar sesión con EXPERT
          </button>
        )}

        {status === 'error' && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-left">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <p className="mt-6 text-xs text-[#a89880]">
          EXPERT accede a Holded en modo solo lectura. Tus credenciales se cifran con AES-256.
        </p>
      </div>
    </main>
  );
}

