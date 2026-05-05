'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, ChevronDown, Check, Plus } from 'lucide-react';

interface Company {
  id: string;
  razon_social: string;
  forma_juridica: string;
  role: string;
}

interface Props {
  companies: Company[];
  activeCompanyId: string | null;
}

const FORMA_LABELS: Record<string, string> = {
  autonomo: 'Autónomo/a',
  sl: 'SL',
  sa: 'SA',
  slne: 'SLNE',
  cb: 'CB',
  cooperativa: 'Cooperativa',
  fundacion: 'Fundación',
  otra: 'Empresa'
};

export function CompanySwitcher({ companies, activeCompanyId }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const active = companies.find((c) => c.id === activeCompanyId);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const switchCompany = async (companyId: string) => {
    if (companyId === activeCompanyId) { setOpen(false); return; }
    setLoading(companyId);
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active_company_id: companyId })
      });
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-[#d7a33a]/60 hover:bg-white/10"
      >
        <Building2 className="h-3.5 w-3.5 text-[#d7a33a]" />
        <span className="max-w-[140px] truncate">
          {active ? active.razon_social : 'Sin empresa'}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-white/50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[220px] rounded-xl border border-white/10 bg-[#07111d] py-1.5 shadow-2xl">
          {companies.length > 0 ? (
            <>
              <p className="px-3 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-widest text-white/40">
                Mis empresas
              </p>
              {companies.map((company) => (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => switchCompany(company.id)}
                  disabled={loading === company.id}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-white/5 disabled:opacity-50"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#d7a33a]/15 text-[#d7a33a]">
                    <Building2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white">{company.razon_social}</p>
                    <p className="text-[10px] text-white/40">{FORMA_LABELS[company.forma_juridica] ?? company.forma_juridica}</p>
                  </div>
                  {company.id === activeCompanyId && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-[#d7a33a]" />
                  )}
                </button>
              ))}
              <div className="my-1.5 border-t border-white/10" />
            </>
          ) : (
            <p className="px-3 py-2 text-xs text-white/50">No tienes empresas aún</p>
          )}
          <Link
            href="/dashboard/empresa/nueva"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#d7a33a] transition hover:bg-white/5"
          >
            <Plus className="h-3.5 w-3.5" />
            Añadir empresa
          </Link>
        </div>
      )}
    </div>
  );
}
