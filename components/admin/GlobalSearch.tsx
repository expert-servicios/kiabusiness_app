'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, User, FolderOpen, Calendar, FileText, Loader2 } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'client' | 'case' | 'appointment' | 'quote';
  title: string;
  subtitle: string;
  href: string;
}

const TYPE_CONFIG = {
  client:      { icon: User,       label: 'Cliente',     color: 'text-blue-600 bg-blue-50' },
  case:        { icon: FolderOpen, label: 'Expediente',  color: 'text-amber-600 bg-amber-50' },
  appointment: { icon: Calendar,   label: 'Cita',        color: 'text-green-600 bg-green-50' },
  quote:       { icon: FileText,   label: 'Presupuesto', color: 'text-purple-600 bg-purple-50' },
} as const;

async function runSearch(q: string): Promise<SearchResult[]> {
  if (q.length < 2) return [];
  try {
    const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results ?? [];
  } catch {
    return [];
  }
}

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Open on Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setLoading(false); return; }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const r = await runSearch(query.trim());
      setResults(r);
      setActiveIdx(0);
      setLoading(false);
    }, 250);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const navigate = useCallback((href: string) => {
    setOpen(false);
    router.push(href);
  }, [router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[activeIdx]) navigate(results[activeIdx].href);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 pt-[10vh] px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-[#f0e9d8] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-[#9ca3af]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar clientes, expedientes, citas, presupuestos…"
            className="flex-1 bg-transparent text-sm text-[#07111d] placeholder:text-[#9ca3af] outline-none"
          />
          {loading
            ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#9ca3af]" />
            : query && <button type="button" onClick={() => setQuery('')} className="text-[#9ca3af] hover:text-[#07111d]"><X className="h-4 w-4" /></button>
          }
          <kbd className="hidden rounded border border-[#d8cbb5] px-1.5 py-0.5 text-[10px] font-semibold text-[#9ca3af] sm:inline">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {query.length > 0 && !loading && results.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-[#9ca3af]">
              Sin resultados para &ldquo;{query}&rdquo;
            </p>
          )}

          {results.length > 0 && (
            <ul className="py-2">
              {results.map((r, i) => {
                const { icon: Icon, label, color } = TYPE_CONFIG[r.type];
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => navigate(r.href)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                        i === activeIdx ? 'bg-[#f8f4eb]' : 'hover:bg-[#f8f4eb]'
                      }`}
                    >
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs ${color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#07111d]">{r.title}</p>
                        <p className="truncate text-xs text-[#29384a]/60">{r.subtitle}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#f0e9d8] px-2 py-0.5 text-[10px] font-semibold text-[#29384a]">
                        {label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {!query && (
            <div className="px-4 py-6 text-center text-xs text-[#9ca3af]">
              Escribe para buscar en clientes, expedientes, citas y presupuestos
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 border-t border-[#f0e9d8] px-4 py-2 text-[10px] text-[#9ca3af]">
          <span><kbd className="rounded border border-[#d8cbb5] px-1">↑↓</kbd> navegar</span>
          <span><kbd className="rounded border border-[#d8cbb5] px-1">↵</kbd> abrir</span>
          <span className="ml-auto"><kbd className="rounded border border-[#d8cbb5] px-1">⌘K</kbd> para abrir/cerrar</span>
        </div>
      </div>
    </div>
  );
}
