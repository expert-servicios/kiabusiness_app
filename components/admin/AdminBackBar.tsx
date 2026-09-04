'use client';

import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export function AdminBackBar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/admin') return null;

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/admin');
  };

  return (
    <div className="sticky top-[53px] z-30 border-b border-[#e8dcc8] bg-[#f8f4eb]/95 px-4 py-2 backdrop-blur lg:top-0">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] bg-white px-3 py-1.5 text-xs font-semibold text-[#29384a] shadow-sm transition hover:border-[#c88b25] hover:text-[#07111d]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8a6d3b] hover:text-[#07111d]"
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          Panel Admin
        </button>
      </div>
    </div>
  );
}
