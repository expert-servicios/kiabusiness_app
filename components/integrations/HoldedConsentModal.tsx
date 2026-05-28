'use client';

/**
 * HoldedConsentModal
 *
 * Muestra antes de guardar la API key de Holded:
 *  - Permisos requeridos (bloqueados) y opcionales (togglables)
 *  - Política de privacidad + Términos de servicio
 *  - Nota de solo lectura
 *
 * El botón "Conectar" solo se habilita cuando todas las casillas están marcadas.
 * Los permisos opcionales que el usuario desactiva se guardan como
 * `permissionsEnabled` y se pasan al endpoint /api/integrations/holded/connect.
 */

import { useState } from 'react';
import {
  X, Shield, Lock, ToggleLeft, ToggleRight, FileText,
  ChevronRight, AlertTriangle, Loader2,
} from 'lucide-react';
import type { HoldedPermissions } from './HoldedPermissionStatus';

// ── Permission definitions ────────────────────────────────────────────────────

interface PermissionDef {
  key         : keyof HoldedPermissions;
  label       : string;
  description : string;
  required    : boolean;
  defaultOn   : boolean;
}

const PERMISSION_DEFS: PermissionDef[] = [
  {
    key        : 'salesInvoices',
    label      : 'Facturas emitidas',
    description: 'Para calcular el IVA repercutido y estimar el Modelo 303.',
    required   : true,
    defaultOn  : true,
  },
  {
    key        : 'purchaseInvoices',
    label      : 'Facturas recibidas / compras',
    description: 'Para calcular el IVA soportado y las deducciones.',
    required   : true,
    defaultOn  : true,
  },
  {
    key        : 'taxes',
    label      : 'Configuración de impuestos',
    description: 'Tipos de IVA definidos en tu cuenta (21 %, 10 %, exento…).',
    required   : true,
    defaultOn  : true,
  },
  {
    key        : 'contacts',
    label      : 'Contactos y clientes',
    description: 'Para vincular facturas con tus clientes y proveedores.',
    required   : false,
    defaultOn  : true,
  },
  {
    key        : 'bankAccounts',
    label      : 'Cuentas bancarias',
    description: 'Saldos de tesorería para el panel de liquidez.',
    required   : false,
    defaultOn  : true,
  },
  {
    key        : 'bankMovements',
    label      : 'Movimientos bancarios',
    description: 'Para conciliación automática y detectar cobros pendientes.',
    required   : false,
    defaultOn  : true,
  },
  {
    key        : 'inboxDocuments',
    label      : 'Bandeja de documentos',
    description: 'Documentos recibidos en Holded para revisión contable.',
    required   : false,
    defaultOn  : false,
  },
];

const CONSENT_VERSION = '1.0';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ConsentResult {
  permissionsEnabled: HoldedPermissions;
  consentVersion    : string;
  consentAt         : string;
}

interface Props {
  detectedPermissions : HoldedPermissions;
  warnings            : string[];
  apiKey              : string;
  companyId          ?: string | null;
  onConnected         : (integration: Record<string, unknown>) => void;
  onCancel            : () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildInitialEnabled(detected: HoldedPermissions): Record<keyof HoldedPermissions, boolean> {
  const result = {} as Record<keyof HoldedPermissions, boolean>;
  for (const def of PERMISSION_DEFS) {
    // Use Boolean() to handle any falsy value (0, '', undefined) from the API
    result[def.key] = def.required ? true : (def.defaultOn && Boolean(detected[def.key]));
  }
  return result;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HoldedConsentModal({
  detectedPermissions,
  warnings,
  apiKey,
  companyId,
  onConnected,
  onCancel,
}: Props) {
  const [enabled,   setEnabled]   = useState(() => buildInitialEnabled(detectedPermissions));
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedTerms,   setAcceptedTerms]   = useState(false);
  const [acceptedReadonly, setAcceptedReadonly] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const allConsented = acceptedPrivacy && acceptedTerms && acceptedReadonly;
  const canConnect   = allConsented && !saving;

  function toggleOptional(key: keyof HoldedPermissions) {
    if (PERMISSION_DEFS.find(d => d.key === key)?.required) return;
    setEnabled(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleConnect() {
    if (!canConnect) return;
    setSaving(true);
    setError('');

    const permissionsEnabled = Object.fromEntries(
      PERMISSION_DEFS.map(d => [d.key, enabled[d.key]])
    ) as unknown as HoldedPermissions;

    try {
      const body: Record<string, unknown> = {
        apiKey,
        permissionsEnabled,
        consentVersion: CONSENT_VERSION,
        consentAt     : new Date().toISOString(),
      };
      if (companyId) body.companyId = companyId;

      const res  = await fetch('/api/integrations/holded/connect', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error conectando con Holded');
        return;
      }

      onConnected(data.integration);
    } catch {
      setError('No se pudo conectar con el servidor. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  const required = PERMISSION_DEFS.filter(d => d.required);
  const optional  = PERMISSION_DEFS.filter(d => !d.required);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-0 pb-0 backdrop-blur-sm sm:items-center sm:px-4 sm:pb-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      {/* Dialog */}
      <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between border-b border-[#f0e8d5] px-6 py-5">
          <div className="flex items-center gap-3">
            {/* Holded → EXPERT visual */}
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-[#e8dfc8] bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/catalog/holded.png" alt="Holded" className="h-6 w-6 object-contain" />
              </div>
              <ChevronRight size={14} className="text-[#c8b89a]" />
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c88b25]/10">
                <Shield size={16} className="text-[#c88b25]" />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-[#3d3528]">Conectar Holded con EXPERT</p>
              <p className="text-xs text-[#7a6e5f]">Revisa y acepta los permisos antes de continuar</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-[#a89880] hover:bg-[#f8f4ed] hover:text-[#3d3528]"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Scrollable body ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-6 max-h-[70vh]">

          {/* Warnings from test */}
          {warnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              {warnings.map((w, i) => (
                <p key={i} className="flex items-start gap-2 text-xs text-amber-800">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                  {w}
                </p>
              ))}
            </div>
          )}

          {/* ── Required permissions ──────────────────────────────────────── */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Lock size={13} className="text-[#c88b25]" />
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#7a6e5f]">
                Acceso requerido
              </p>
            </div>
            <ul className="space-y-2">
              {required.map((def) => {
                const detected = detectedPermissions[def.key];
                return (
                  <li key={def.key} className="flex items-start gap-3">
                    {/* Fixed toggle — always on */}
                    <span className="mt-0.5 flex h-5 w-9 shrink-0 cursor-not-allowed items-center rounded-full bg-[#c88b25]/20 px-0.5">
                      <span className="h-4 w-4 translate-x-4 rounded-full bg-[#c88b25] shadow-sm" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${detected ? 'text-[#3d3528]' : 'text-amber-700'}`}>
                        {def.label}
                        {!detected && (
                          <span className="ml-1.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                            No detectado
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[#a89880]">{def.description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* ── Optional permissions ──────────────────────────────────────── */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <ToggleRight size={13} className="text-[#7a6e5f]" />
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#7a6e5f]">
                Acceso opcional
              </p>
              <span className="text-[10px] text-[#a89880]">(puedes cambiar esto más tarde)</span>
            </div>
            <ul className="space-y-2">
              {optional.map((def) => {
                const detected  = detectedPermissions[def.key];
                const isEnabled = enabled[def.key];
                return (
                  <li key={def.key} className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleOptional(def.key)}
                      disabled={!detected}
                      aria-label={isEnabled ? `Desactivar ${def.label}` : `Activar ${def.label}`}
                      className={`mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors ${
                        !detected
                          ? 'cursor-not-allowed bg-[#e8dfc8]'
                          : isEnabled
                            ? 'bg-[#c88b25] cursor-pointer'
                            : 'bg-[#e8dfc8] cursor-pointer'
                      }`}
                    >
                      <span className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                        isEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        !detected ? 'text-[#c8b89a]' : isEnabled ? 'text-[#3d3528]' : 'text-[#a89880]'
                      }`}>
                        {def.label}
                        {!detected && (
                          <span className="ml-1.5 rounded-md bg-[#f0e8d5] px-1.5 py-0.5 text-[10px] font-semibold text-[#a89880]">
                            No disponible
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[#a89880]">{def.description}</p>
                    </div>
                    {!detected
                      ? <ToggleLeft size={14} className="mt-1 shrink-0 text-[#c8b89a]" />
                      : isEnabled
                        ? <ToggleRight size={14} className="mt-1 shrink-0 text-[#c88b25]" />
                        : <ToggleLeft size={14} className="mt-1 shrink-0 text-[#a89880]" />
                    }
                  </li>
                );
              })}
            </ul>
          </section>

          {/* ── Terms & privacy ───────────────────────────────────────────── */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <FileText size={13} className="text-[#7a6e5f]" />
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#7a6e5f]">
                Términos y privacidad
              </p>
            </div>
            <div className="rounded-xl border border-[#e8dfc8] bg-[#faf9f6] divide-y divide-[#f0e8d5]">
              <ConsentCheckbox
                id="consent-privacy"
                checked={acceptedPrivacy}
                onChange={setAcceptedPrivacy}
                label={
                  <>
                    He leído y acepto la{' '}
                    <a
                      href="/legal/privacidad"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-[#c88b25] hover:text-[#b07820]"
                    >
                      Política de Privacidad
                    </a>{' '}
                    de EXPERT
                  </>
                }
              />
              <ConsentCheckbox
                id="consent-terms"
                checked={acceptedTerms}
                onChange={setAcceptedTerms}
                label={
                  <>
                    Acepto los{' '}
                    <a
                      href="/legal/terminos"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-[#c88b25] hover:text-[#b07820]"
                    >
                      Términos del Servicio
                    </a>{' '}
                    de EXPERT
                  </>
                }
              />
              <ConsentCheckbox
                id="consent-readonly"
                checked={acceptedReadonly}
                onChange={setAcceptedReadonly}
                label="Entiendo que EXPERT accede a Holded en modo solo lectura y nunca realiza cambios en mi contabilidad sin mi confirmación explícita"
              />
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 border-t border-[#f0e8d5] bg-[#faf9f6] px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[#e8dfc8] bg-white px-5 py-2.5 text-sm font-medium text-[#7a6e5f] transition hover:border-[#c88b25] hover:text-[#3d3528]"
          >
            Cancelar
          </button>

          {!allConsented && (
            <p className="flex-1 text-right text-xs text-[#a89880]">
              Acepta los términos para continuar
            </p>
          )}

          <button
            type="button"
            onClick={handleConnect}
            disabled={!canConnect}
            className="inline-flex items-center gap-2 rounded-xl bg-[#c88b25] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b07820] disabled:pointer-events-none disabled:opacity-40"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Conectando…
              </>
            ) : (
              <>
                <Shield size={14} />
                Conectar con Holded
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Checkbox helper ───────────────────────────────────────────────────────────

function ConsentCheckbox({
  id,
  checked,
  onChange,
  label,
}: {
  id      : string;
  checked : boolean;
  onChange: (v: boolean) => void;
  label   : React.ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-[#f5f0e8] transition-colors"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-[#c8b89a] accent-[#c88b25]"
      />
      <span className="text-xs text-[#3d3528] leading-relaxed">{label}</span>
    </label>
  );
}
