'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Palette, Eye } from 'lucide-react';

interface BrandingSettings {
  brand_name?: string;
  tagline?: string;
  logo_url?: string;
  primary_color?: string;
  support_email?: string;
}

interface Props {
  tenantId: string;
  settings: Record<string, unknown>;
}

export function TenantBrandingForm({ tenantId, settings }: Props) {
  const router = useRouter();
  const branding = settings as BrandingSettings;

  const [brandName, setBrandName] = useState(branding.brand_name ?? '');
  const [tagline, setTagline] = useState(branding.tagline ?? '');
  const [logoUrl, setLogoUrl] = useState(branding.logo_url ?? '');
  const [color, setColor] = useState(branding.primary_color ?? '#d7a33a');
  const [supportEmail, setSupportEmail] = useState(branding.support_email ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const newSettings: Record<string, unknown> = {
        ...settings,
        brand_name:    brandName.trim() || undefined,
        tagline:       tagline.trim()   || undefined,
        logo_url:      logoUrl.trim()   || undefined,
        primary_color: color,
        support_email: supportEmail.trim() || undefined,
      };
      // Remove undefined keys
      for (const k of Object.keys(newSettings)) {
        if (newSettings[k] === undefined) delete newSettings[k];
      }

      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: newSettings }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al guardar'); return; }
      setSaved(true);
      router.refresh();
    } catch {
      setError('Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Preview strip */}
      <div
        className="flex items-center gap-3 rounded-xl p-4"
        style={{ backgroundColor: `${color}18`, borderLeft: `3px solid ${color}` }}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Logo" className="h-8 w-8 rounded-lg object-contain" />
        ) : (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {(brandName || 'T').charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm font-bold text-[#07111d]" style={{ color }}>
            {brandName || 'Nombre de la marca'}
          </p>
          <p className="text-xs text-[#29384a]">{tagline || 'Tagline opcional'}</p>
        </div>
        <Eye className="ml-auto h-4 w-4 text-[#29384a]/40" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[#07111d]" htmlFor="b-name">
            Nombre de marca <span className="font-normal text-[#29384a]">(portal cliente)</span>
          </label>
          <input
            id="b-name"
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="Gestoría López"
            className="w-full rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-2.5 text-sm text-[#07111d] placeholder-[#29384a]/40 focus:border-[#d7a33a] focus:outline-none focus:ring-1 focus:ring-[#d7a33a]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[#07111d]" htmlFor="b-tagline">
            Tagline <span className="font-normal text-[#29384a]">(opcional)</span>
          </label>
          <input
            id="b-tagline"
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Tu gestoría de confianza"
            className="w-full rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-2.5 text-sm text-[#07111d] placeholder-[#29384a]/40 focus:border-[#d7a33a] focus:outline-none focus:ring-1 focus:ring-[#d7a33a]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[#07111d]" htmlFor="b-logo">
            URL del logo <span className="font-normal text-[#29384a]">(https://…)</span>
          </label>
          <input
            id="b-logo"
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://cdn.asesoria.com/logo.png"
            className="w-full rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-2.5 text-sm text-[#07111d] placeholder-[#29384a]/40 focus:border-[#d7a33a] focus:outline-none focus:ring-1 focus:ring-[#d7a33a]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[#07111d]" htmlFor="b-color">
            Color primario
          </label>
          <div className="flex items-center gap-3">
            <input
              id="b-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-16 cursor-pointer rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] p-1"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColor(v);
              }}
              className="flex-1 rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-2.5 font-mono text-sm text-[#07111d] focus:border-[#d7a33a] focus:outline-none focus:ring-1 focus:ring-[#d7a33a]"
            />
            <button
              type="button"
              onClick={() => setColor('#d7a33a')}
              className="flex items-center gap-1 rounded-lg border border-[#d8cbb5] px-2 py-2 text-xs text-[#29384a] hover:bg-[#f0e8d5]"
              title="Restaurar color EXPERT"
            >
              <Palette className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-semibold text-[#07111d]" htmlFor="b-email">
            Email de soporte del tenant
          </label>
          <input
            id="b-email"
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            placeholder="soporte@asesoria.com"
            className="w-full rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-2.5 text-sm text-[#07111d] placeholder-[#29384a]/40 focus:border-[#d7a33a] focus:outline-none focus:ring-1 focus:ring-[#d7a33a]"
          />
          <p className="mt-1 text-xs text-[#29384a]/60">Se mostrará en emails transaccionales enviados a los clientes de este tenant.</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">Branding guardado correctamente.</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-[#d7a33a] px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-[#061321] transition hover:bg-[#c88b25] disabled:opacity-50"
      >
        {saving ? 'Guardando…' : 'Guardar branding'}
      </button>
    </form>
  );
}
