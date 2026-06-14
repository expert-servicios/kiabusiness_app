import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { AUTOMATION_CATALOG } from '@/lib/automations/catalog';
import { AutomationToggle } from '@/components/admin/AutomationToggle';
import { Zap, Mail, Clock } from 'lucide-react';

async function getSettings(): Promise<Record<string, boolean>> {
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin.from('automation_settings').select('key, enabled');
    return Object.fromEntries((data ?? []).map((r) => [r.key, r.enabled as boolean]));
  } catch {
    return {};
  }
}

export default async function AutomatizacionesPage() {
  const settings = await getSettings();

  const groups = ['Expedientes', 'Admin'] as const;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#07111d]">Automatizaciones</h1>
        <p className="mt-1 text-sm text-[#29384a]">
          Activa o desactiva cada automatización. Los cambios se aplican en el siguiente evento que la dispare.
        </p>
      </div>

      {groups.map((group) => {
        const items = AUTOMATION_CATALOG.filter((a) => a.group === group);
        return (
          <section key={group}>
            <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#29384a]">
              {group === 'Admin' ? <Clock className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
              {group}
            </h2>
            <div className="space-y-3">
              {items.map((def) => {
                const enabled = settings[def.key] ?? true;
                return (
                  <div
                    key={def.key}
                    className="flex items-start gap-4 rounded-2xl border border-[#d8cbb5] bg-white p-5"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f8f4eb]">
                      <Mail className="h-4 w-4 text-[#d7a33a]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#07111d]">{def.title}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            enabled
                              ? 'bg-green-100 text-green-700'
                              : 'bg-[#f0e8d5] text-[#7a6a50]'
                          }`}
                        >
                          {enabled ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#29384a]">
                        <span className="font-medium">Cuando:</span> {def.trigger}
                      </p>
                      <p className="mt-0.5 text-xs text-[#29384a]">
                        <span className="font-medium">Acción:</span> {def.action}
                      </p>
                      <p className="mt-1 rounded-md bg-[#f8f4eb] px-2 py-0.5 text-[10px] text-[#7a6a50] inline-block">
                        {def.channel}
                      </p>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      <AutomationToggle automationKey={def.key} initialEnabled={enabled} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <p className="text-xs text-[#29384a]/50">
        Las automatizaciones desactivadas no envían emails pero no afectan al resto del flujo del expediente.
      </p>
    </div>
  );
}
