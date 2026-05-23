'use client';

import { useState } from 'react';
import { Search, CheckCircle2, AlertCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface CompanySuggestion {
  name              ?: string;
  taxId             ?: string;
  registeredAddress ?: string;
  postalCode        ?: string;
  city              ?: string;
  province          ?: string;
  country           ?: string;
  shareCapital      ?: string;
  representativeName?: string;
  representativeRole?: string;
  incorporationDate ?: string;
  companyStatus     ?: string;
  source             : string;
  sourceUrl         ?: string;
  retrievedAt        : string;
  confidence         : 'high' | 'medium' | 'low';
  warnings           : string[];
}

interface ResolveResponse {
  suggestions             : CompanySuggestion[];
  bestSuggestion         ?: CompanySuggestion;
  requiresUserConfirmation: boolean;
  suggestionIds           : string[];
  taxIdType              ?: string | null;
  note                   ?: string;
  error                  ?: string;
  meta                   ?: { sources: string[]; elapsedMs: number; queriedAt: string };
}

interface ApplyData {
  company    ?: string;
  taxId      ?: string;
  address    ?: string;
  city       ?: string;
  postalCode ?: string;
  province   ?: string;
}

interface Props {
  company   : string;
  taxId     : string;
  onApply   : (data: ApplyData) => void;
}

const SOURCE_LABELS: Record<string, string> = {
  vies               : 'VIES (UE)',
  boe_borme          : 'BORME (BOE)',
  opencorporates     : 'OpenCorporates',
  registradores_opendata: 'Registradores',
  manual             : 'Manual',
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high  : 'Alta',
  medium: 'Media',
  low   : 'Baja',
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high  : 'bg-green-100 text-green-800',
  medium: 'bg-amber-100 text-amber-800',
  low   : 'bg-red-100 text-red-700',
};

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

function SuggestionCard({
  sug,
  suggestionId,
  onApply,
}: {
  sug          : CompanySuggestion;
  suggestionId : string | undefined;
  onApply      : (data: ApplyData) => void;
}) {
  const [expanded, setExpanded]   = useState(false);
  const [applying, setApplying]   = useState(false);
  const [applied,  setApplied]    = useState(false);

  const handleApply = async () => {
    setApplying(true);
    if (suggestionId) {
      await fetch('/api/company/resolve', {
        method : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ suggestionId }),
      }).catch(() => null);
    }
    onApply({
      company   : sug.name,
      taxId     : sug.taxId,
      address   : sug.registeredAddress,
      city      : sug.city,
      postalCode: sug.postalCode,
      province  : sug.province,
    });
    setApplying(false);
    setApplied(true);
  };

  return (
    <div className="rounded-xl border border-[#d8cbb5] bg-[#faf9f6] p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#07111d] truncate">{sug.name ?? '—'}</p>
          {sug.taxId && <p className="text-xs text-[#29384a]/70">{sug.taxId}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CONFIDENCE_COLORS[sug.confidence] ?? ''}`}>
            {CONFIDENCE_LABELS[sug.confidence] ?? sug.confidence}
          </span>
          <span className="rounded-full bg-[#f0e8d8] px-2 py-0.5 text-[10px] font-medium text-[#7a5c2e]">
            {SOURCE_LABELS[sug.source] ?? sug.source}
          </span>
        </div>
      </div>

      {/* Address summary */}
      {(sug.registeredAddress || sug.city) && (
        <p className="text-xs text-[#29384a]">
          {[sug.registeredAddress, sug.postalCode, sug.city, sug.province].filter(Boolean).join(', ')}
        </p>
      )}

      {/* Retrieval date */}
      <p className="text-[10px] text-[#29384a]/60">Consultado: {formatDate(sug.retrievedAt)}</p>

      {/* Expandable details */}
      <button
        type="button"
        onClick={() => setExpanded((x) => !x)}
        className="flex items-center gap-1 text-[10px] font-medium text-[#c88b25] hover:text-[#b57a1e]"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? 'Ocultar detalles' : 'Ver más datos'}
      </button>

      {expanded && (
        <div className="space-y-1 border-t border-[#e8dfc8] pt-3 text-xs text-[#29384a]">
          {sug.shareCapital      && <p><span className="font-medium">Capital:</span> {sug.shareCapital}</p>}
          {sug.representativeName && <p><span className="font-medium">{sug.representativeRole ?? 'Representante'}:</span> {sug.representativeName}</p>}
          {sug.incorporationDate  && <p><span className="font-medium">Constitución:</span> {sug.incorporationDate}</p>}
          {sug.companyStatus      && <p><span className="font-medium">Estado:</span> {sug.companyStatus}</p>}
          {sug.sourceUrl && (
            <a href={sug.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#c88b25] hover:underline">
              Ver fuente <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {sug.warnings.length > 0 && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 space-y-0.5">
              {sug.warnings.map((w, i) => (
                <p key={i} className="text-[10px] text-amber-700">{w}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      <div className="flex items-center gap-3 pt-1">
        {applied ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700">
            <CheckCircle2 className="h-4 w-4" /> Datos aplicados
          </span>
        ) : (
          <button
            type="button"
            onClick={() => void handleApply()}
            disabled={applying}
            className="inline-flex items-center gap-2 rounded-full bg-[#c88b25] px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-[#061321] transition hover:bg-[#b57a1e] disabled:opacity-60"
          >
            {applying ? 'Aplicando...' : 'Usar estos datos'}
          </button>
        )}
      </div>
    </div>
  );
}

export function CompanyDataLookup({ company, taxId, onApply }: Props) {
  const [loading,     setLoading]     = useState(false);
  const [response,    setResponse]    = useState<ResolveResponse | null>(null);
  const [error,       setError]       = useState<string | null>(null);

  const handleSearch = async () => {
    if (!company && !taxId) return;
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/company/resolve', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ name: company || undefined, taxId: taxId || undefined }),
      });
      const data = await res.json() as ResolveResponse;

      if (!res.ok) {
        setError(data.error ?? 'Error al buscar datos de empresa');
        return;
      }
      setResponse(data);
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const canSearch = Boolean(company || taxId);

  return (
    <div className="space-y-3">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => void handleSearch()}
        disabled={loading || !canSearch}
        className="inline-flex items-center gap-2 rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-2.5 text-xs font-semibold text-[#29384a] transition hover:border-[#c88b25] hover:text-[#07111d] disabled:opacity-50"
      >
        <Search className="h-3.5 w-3.5" />
        {loading ? 'Buscando...' : 'Buscar datos de empresa'}
      </button>

      {!canSearch && (
        <p className="text-[10px] text-[#29384a]/60">
          Introduce el nombre de la sociedad o el CIF para buscar datos.
        </p>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Note (e.g. RGPD for NIF/NIE) */}
      {response?.note && (
        <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <p className="text-xs text-blue-700">{response.note}</p>
        </div>
      )}

      {/* No results */}
      {response && !response.note && response.suggestions.length === 0 && (
        <p className="text-xs text-[#29384a]">
          No se encontraron datos públicos para esta empresa. Introduce los datos manualmente.
        </p>
      )}

      {/* Suggestions */}
      {response && response.suggestions.length > 0 && (
        <div className="space-y-3">
          {/* Disclaimer */}
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
            <p className="text-[10px] text-amber-700 leading-relaxed">
              Estos datos proceden de fuentes públicas y deben ser revisados antes de guardarse. No han sido verificados individualmente.
            </p>
          </div>

          {response.suggestions.map((sug, i) => (
            <SuggestionCard
              key={i}
              sug={sug}
              suggestionId={response.suggestionIds?.[i]}
              onApply={onApply}
            />
          ))}

          {response.meta && (
            <p className="text-[10px] text-[#29384a]/50">
              Fuentes: {response.meta.sources.join(', ')} · {response.suggestions.length} resultado(s)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
