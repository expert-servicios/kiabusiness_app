import Link from 'next/link';
import { Bell, MessageCircle, Settings2, Zap } from 'lucide-react';
import { AutomationSettingsPanel } from '@/components/admin/AutomationSettingsPanel';
import { PushSubscribeButton } from '@/components/admin/PushSubscribeButton';

export const metadata = { title: 'Configuración — Admin EXPERT' };

export default function ConfiguracionPage() {
  return (
    <main className="min-h-screen bg-[#f8f4eb] py-10">
      <div className="mx-auto max-w-2xl px-6">

        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm font-semibold text-[#061321]">
          <Settings2 className="h-4 w-4" />
          <Link href="/admin" className="underline underline-offset-4">Panel</Link>
          <span className="text-[#9ca3af]">/</span>
          <span>Configuración</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.28em] text-[#c88b25]">Sistema</p>
          <h1 className="mt-3 font-serif text-3xl font-bold text-[#07111d]">Configuración</h1>
          <p className="mt-2 text-sm text-[#7a6e5f]">
            Activa o desactiva automatizaciones de notificaciones y resúmenes.
            Los cambios se aplican de inmediato.
          </p>
        </div>

        {/* Automatizaciones */}
        <section>
          <div className="mb-5 flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#c88b25]" />
            <h2 className="font-serif text-lg font-bold text-[#07111d]">Automatizaciones</h2>
          </div>
          <AutomationSettingsPanel />
        </section>

        <section id="waba" className="mt-8 rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              <h2 className="font-serif text-lg font-bold text-[#07111d]">WhatsApp Business (WABA)</h2>
            </div>
            <Link
              href="/admin/whatsapp"
              className="rounded-lg border border-[#25D366]/30 bg-[#25D366]/10 px-3 py-1.5 text-xs font-semibold text-[#075e54] transition hover:bg-[#25D366]/20"
            >
              Abrir bandeja →
            </Link>
          </div>
          <p className="mb-4 text-sm text-[#7a6e5f]">
            Gestiona la conexión con Meta WhatsApp Business API. Desde la bandeja puedes probar la
            conexión, actualizar el perfil de Kia y enviar mensajes.
          </p>
          <div className="grid gap-2 text-xs text-[#29384a]">
            <p><span className="font-semibold">Phone ID:</span> {process.env.META_WHATSAPP_PHONE_NUMBER_ID ? '✓ configurado' : '✗ no configurado'}</p>
            <p><span className="font-semibold">WABA ID:</span> {process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID ? '✓ configurado' : '✗ no configurado'}</p>
            <p><span className="font-semibold">Token:</span> {process.env.META_WHATSAPP_ACCESS_TOKEN ? '✓ configurado' : '✗ no configurado'}</p>
          </div>
        </section>

        <section id="notificaciones" className="mt-8 rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#c88b25]" />
            <h2 className="font-serif text-lg font-bold text-[#07111d]">Notificaciones push</h2>
          </div>
          <p className="mb-4 text-sm text-[#7a6e5f]">
            Activa avisos del panel para enterarte de mensajes y alertas operativas sin tener que revisar cada módulo.
          </p>
          <PushSubscribeButton />
        </section>

      </div>
    </main>
  );
}
