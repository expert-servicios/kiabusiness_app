'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Shown when the user lands on /dashboard/post-compra before the Stripe webhook
// has written the subscription row. Polls every 3 s for up to 30 s, then gives up.
export default function PostCompraWaiting() {
  const router   = useRouter();
  const attempts = useRef(0);
  const MAX      = 10; // 10 × 3s = 30s

  useEffect(() => {
    const id = setInterval(() => {
      attempts.current += 1;
      if (attempts.current >= MAX) {
        clearInterval(id);
        // Give up — send user to dashboard (subscription may appear later)
        router.push('/dashboard');
        return;
      }
      // Reload the server component so it can re-check the DB
      router.refresh();
    }, 3_000);

    return () => clearInterval(id);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f8f4eb] flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#d7a33a]" />
        <p className="font-semibold text-[#07111d]">Activando tu suscripción…</p>
        <p className="text-sm text-[#29384a]/60">Esto solo tarda unos segundos.</p>
      </div>
    </div>
  );
}
