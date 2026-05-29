'use client';

import { Check, X, AlertTriangle } from 'lucide-react';

export interface HoldedPermissions {
  contacts          : boolean;
  salesInvoices     : boolean;
  purchaseInvoices  : boolean;
  taxes             : boolean;
  bankAccounts      : boolean;
  bankMovements     : boolean;
  inboxDocuments    : boolean;
  writeInbox        : boolean;
  accountingReports : boolean;
  accountingEntries : boolean;
}

const PERMISSION_LABELS: Array<{ key: keyof HoldedPermissions; label: string; required: boolean }> = [
  { key: 'salesInvoices',     label: 'Facturas emitidas',               required: true  },
  { key: 'purchaseInvoices',  label: 'Facturas recibidas',              required: true  },
  { key: 'taxes',             label: 'Impuestos configurados',          required: true  },
  { key: 'accountingReports', label: 'Informes contables (IVA, P&G, Balance)', required: true  },
  { key: 'accountingEntries', label: 'Asientos contables',              required: true  },
  { key: 'contacts',          label: 'Contactos y clientes',            required: false },
  { key: 'bankAccounts',      label: 'Cuentas bancarias',               required: false },
  { key: 'bankMovements',     label: 'Movimientos bancarios',           required: false },
  { key: 'inboxDocuments',    label: 'Bandeja de entrada',              required: false },
];

interface Props {
  permissions : HoldedPermissions;
  warnings   ?: string[];
}

export function HoldedPermissionStatus({ permissions, warnings = [] }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6e5f]">Permisos detectados</p>

      <ul className="space-y-1.5">
        {PERMISSION_LABELS.map(({ key, label, required }) => {
          const granted = permissions[key];
          return (
            <li key={key} className="flex items-center gap-2 text-sm">
              {granted ? (
                <Check size={14} className="shrink-0 text-emerald-600" />
              ) : (
                <X size={14} className={`shrink-0 ${required ? 'text-red-500' : 'text-[#c8b89a]'}`} />
              )}
              <span className={granted ? 'text-[#3d3528]' : required ? 'text-red-600 font-medium' : 'text-[#a89880]'}>
                {label}
                {required && !granted && ' (requerido)'}
              </span>
            </li>
          );
        })}
      </ul>

      {warnings.length > 0 && (
        <ul className="space-y-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          {warnings.map((w, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              {w}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
