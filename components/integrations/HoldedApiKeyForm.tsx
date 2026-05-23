'use client';

import { useState, useRef } from 'react';
import { Eye, EyeOff, Loader2, Check, AlertCircle } from 'lucide-react';
import { HoldedPermissionStatus, type HoldedPermissions } from './HoldedPermissionStatus';

interface TestResult {
  ok         : boolean;
  permissions: HoldedPermissions;
  warnings   : string[];
}

interface Props {
  companyId  ?: string | null;
  onConnected : (integration: Record<string, unknown>) => void;
}

export function HoldedApiKeyForm({ companyId, onConnected }: Props) {
  const [showKey,   setShowKey]   = useState(false);
  const [apiKey,    setApiKey]    = useState('');
  const [testing,   setTesting]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error,     setError]    = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmedKey = apiKey.trim();
  const canSubmit  = trimmedKey.length >= 8;

  function clearSensitive() {
    setApiKey('');
    setShowKey(false);
  }

  async function handleTest() {
    if (!canSubmit) return;
    setTesting(true);
    setError('');
    setTestResult(null);

    try {
      const res = await fetch('/api/integrations/holded/test', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ apiKey: trimmedKey }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error verificando la clave');
        return;
      }

      setTestResult(data as TestResult);
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setTesting(false);
    }
  }

  async function handleConnect() {
    if (!canSubmit) return;
    setSaving(true);
    setError('');

    try {
      const body: Record<string, string> = { apiKey: trimmedKey };
      if (companyId) body.companyId = companyId;

      const res = await fetch('/api/integrations/holded/connect', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error conectando con Holded');
        return;
      }

      clearSensitive();
      onConnected(data.integration);
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* API key input */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#3d3528]">
          API key de Holded
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); setTestResult(null); setError(''); }}
            placeholder="Pega aquí tu API key de Holded"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-xl border border-[#e8dfc8] bg-white px-4 py-3 pr-11 text-sm text-[#3d3528] placeholder:text-[#c8b89a] focus:border-[#c88b25] focus:outline-none focus:ring-2 focus:ring-[#c88b25]/20"
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a89880] hover:text-[#3d3528]"
            aria-label={showKey ? 'Ocultar clave' : 'Mostrar clave'}
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="mt-1 text-xs text-[#a89880]">
          La clave se cifra en el servidor antes de guardarse. No se muestra completa después.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Test result */}
      {testResult && (
        <div className={`rounded-xl border px-4 py-4 ${testResult.ok ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
          {testResult.ok && (
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <Check size={14} />
              Conexión verificada correctamente
            </p>
          )}
          <HoldedPermissionStatus permissions={testResult.permissions} warnings={testResult.warnings} />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleTest}
          disabled={!canSubmit || testing || saving}
          className="rounded-xl border border-[#e8dfc8] bg-white px-5 py-2.5 text-sm font-medium text-[#3d3528] transition hover:border-[#c88b25] hover:text-[#c88b25] disabled:pointer-events-none disabled:opacity-50"
        >
          {testing ? (
            <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Verificando…</span>
          ) : 'Verificar conexión'}
        </button>

        <button
          type="button"
          onClick={handleConnect}
          disabled={!canSubmit || testing || saving}
          className="rounded-xl bg-[#c88b25] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b07820] disabled:pointer-events-none disabled:opacity-50"
        >
          {saving ? (
            <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Conectando…</span>
          ) : 'Verificar y Conectar'}
        </button>
      </div>
    </div>
  );
}
