import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield, MessageCircle, FileText, CreditCard, Globe,
  AlertTriangle, CheckCircle2, HelpCircle, BookOpen, Phone,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cómo usar Kia, la asistente virtual de EXPERT',
  description: 'Guía de buenas prácticas para interactuar con Kia de forma segura y eficaz. Qué puede hacer, qué no hace, cómo proteger tus datos y cómo contratar servicios de forma segura.',
};

const WA_NUMBER   = '34696550480';
const PORTAL_URL  = '/dashboard';
const VIABILITY_URL = '/solicitar-presupuesto';
const CALENDLY_URL = (process.env.NEXT_PUBLIC_CALENDLY_DEMO_URL ?? '') + '?hide_event_type_details=1';

export default function KiaGuiaPage() {
  return (
    <div className="min-h-screen bg-[#f8f4eb]">
      {/* Hero */}
      <section className="border-b border-[#e8dfc9] bg-[#07111d] py-16 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4A017]">Guía de usuario</p>
          <h1 className="mt-3 font-serif text-3xl font-bold text-white sm:text-4xl">
            Cómo usar Kia de forma segura
          </h1>
          <p className="mt-4 text-base text-white/70 leading-relaxed max-w-2xl mx-auto">
            Kia es la asistente virtual de EXPERT. Te ayuda a elegir servicios, comprobar viabilidad, preparar documentación y seguir tus expedientes, siempre de forma segura y con el respaldo del equipo profesional.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-10 px-6 py-12">

        {/* Security alert — always first */}
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">Aviso de seguridad importante</p>
              <p className="mt-1 text-sm text-red-700">
                Nunca envíes contraseñas, claves API, códigos de verificación, datos completos de tarjetas ni credenciales por WhatsApp o email. Kia <strong>nunca</strong> te los pedirá por estos canales.
              </p>
            </div>
          </div>
        </div>

        {/* Section 1 — What Kia can do */}
        <Section icon={CheckCircle2} title="Qué puede hacer Kia" color="text-emerald-700">
          <ul className="space-y-2">
            {[
              'Orientarte sobre servicios de gestión, fiscal, extranjería y empresa.',
              'Ayudarte a comprobar la viabilidad de un trámite antes de contratarlo.',
              'Preparar la contratación de servicios y guiarte en el proceso.',
              'Indicar qué datos o documentos son necesarios para cada gestión.',
              'Ayudarte a completar tu perfil en el Portal Cliente.',
              'Guiarte para conectar Holded desde el Panel Cliente de forma segura.',
              'Explicar el Estado de empresa si tienes plan mensual de gestión.',
              'Avisarte de documentos pendientes o anomalías en tu expediente.',
              'Ayudarte a reservar una llamada de 15 minutos antes de contratar.',
              'Responder en español o en ruso.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-[#29384a]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        {/* Section 2 — What Kia does NOT do */}
        <Section icon={AlertTriangle} title="Qué no hace Kia" color="text-red-700">
          <ul className="space-y-2">
            {[
              'No sustituye la revisión profesional del equipo de EXPERT.',
              'No presenta impuestos automáticamente.',
              'No modifica contabilidad sin validación del equipo.',
              'No guarda claves API por WhatsApp, email ni chat.',
              'No recibe contraseñas, códigos de verificación ni datos completos de tarjetas.',
              'No decide sola expedientes complejos con implicaciones jurídicas o fiscales.',
              'No muestra datos de otros clientes.',
              'No ejecuta pagos directamente sin enlace seguro de EXPERT.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-[#29384a]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        {/* Section 3 — How to ask correctly */}
        <Section icon={MessageCircle} title="Cómo pedir ayuda correctamente" color="text-blue-700">
          <ul className="space-y-2">
            {[
              'Indica el servicio que necesitas o el trámite que quieres hacer.',
              'Explica tu situación en una frase clara.',
              'Si ya eres cliente, usa el mismo teléfono o email con el que te registraste.',
              'Sube documentos solo cuando Kia o el equipo te los pidan.',
              'Para dudas antes de contratar, reserva una llamada de 15 minutos.',
              'Para contratar servicios, usa siempre los enlaces seguros de EXPERT.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-[#29384a]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        {/* Section 4 — Security */}
        <Section icon={Shield} title="Seguridad de tus datos" color="text-[#07111d]">
          <div className="space-y-4">
            <InfoCard color="red">
              <p className="text-sm text-[#29384a]">
                <strong>Datos que nunca debes enviar por WhatsApp o email:</strong> contraseñas, claves API, tokens de acceso, códigos 2FA, números completos de tarjeta, credenciales bancarias.
              </p>
            </InfoCard>
            <p className="text-sm text-[#29384a]">
              Si recibes un mensaje sospechoso pidiendo datos sensibles que afirme ser de EXPERT, no respondas y contacta con nosotros directamente. Los enlaces auténticos de EXPERT siempre empiezan por <code className="rounded bg-[#e8dfc9] px-1 text-[#07111d]">expertconsulting.es</code>.
            </p>
          </div>
        </Section>

        {/* Section 5 — Holded */}
        <Section icon={Globe} title="Conectar Holded de forma segura" color="text-[#07111d]">
          <div className="space-y-3 text-sm text-[#29384a]">
            <p>
              Para los planes mensuales de gestión, necesitas una cuenta Holded y conectar tu API key. Kia puede explicarte cómo obtenerla, pero <strong>nunca te pedirá que la pegues en WhatsApp</strong>.
            </p>
            <InfoCard color="amber">
              <p className="text-sm text-[#29384a]">
                La conexión de Holded se hace siempre desde el <strong>Panel Cliente seguro</strong>. Kia te enviará el enlace cuando estés listo/a.
              </p>
            </InfoCard>
          </div>
        </Section>

        {/* Section 6 — Payments */}
        <Section icon={CreditCard} title="Pagos seguros" color="text-[#07111d]">
          <div className="space-y-3 text-sm text-[#29384a]">
            <p>
              Los pagos se realizan siempre desde <strong>enlaces seguros de EXPERT</strong>. Kia puede enviarte el enlace de pago cuando hayas completado tu perfil y datos de facturación.
            </p>
            <InfoCard color="amber">
              <p className="text-sm text-[#29384a]">
                No pagues a través de mensajes no verificados. Si tienes dudas sobre un enlace de pago, contacta con el equipo antes de proceder.
              </p>
            </InfoCard>
          </div>
        </Section>

        {/* Section 7 — Documents */}
        <Section icon={FileText} title="Envío de documentos" color="text-[#07111d]">
          <p className="text-sm text-[#29384a]">
            Kia clasifica automáticamente los documentos que envías por WhatsApp para asociarlos a tu expediente. Si hay dudas sobre el tipo de documento, el equipo de EXPERT los revisará manualmente.
          </p>
          <div className="mt-3 space-y-1 text-sm text-[#29384a]">
            <p>→ Envía los documentos que el equipo te solicite expresamente.</p>
            <p>→ Puedes subir documentos también desde el Portal Cliente.</p>
            <p>→ Los documentos se guardan de forma segura y cifrada.</p>
          </div>
        </Section>

        {/* Section 8 — Languages */}
        <Section icon={Globe} title="Idiomas" color="text-[#07111d]">
          <p className="text-sm text-[#29384a]">
            Puedes escribir a Kia en <strong>español</strong> o en <strong>ruso</strong>. Kia detecta el idioma automáticamente y responde en el mismo idioma.
          </p>
        </Section>

        {/* Section 9 — Professional disclaimer */}
        <Section icon={BookOpen} title="Aviso profesional" color="text-[#07111d]">
          <div className="rounded-xl border border-[#d8cbb5] bg-white p-4 text-sm text-[#29384a] leading-relaxed">
            Las respuestas de Kia ayudan a organizar y preparar trámites, y a orientarte sobre los servicios de EXPERT. Las decisiones fiscales, jurídicas o administrativas relevantes requieren siempre revisión profesional por el equipo de EXPERT. Kia no sustituye el criterio profesional.
          </div>
        </Section>

        {/* CTAs */}
        <section className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25] mb-4">¿Listo/a para empezar?</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hola Kia, quiero información sobre los servicios de EXPERT.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white hover:bg-[#20b858] transition"
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              Hablar con Kia por WhatsApp
            </a>
            <Link
              href={VIABILITY_URL}
              className="flex items-center gap-3 rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-3 text-sm font-semibold text-[#07111d] hover:border-[#c88b25] transition"
            >
              <HelpCircle className="h-4 w-4 shrink-0" />
              Comprobar viabilidad
            </Link>
            <Link
              href={PORTAL_URL}
              className="flex items-center gap-3 rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-3 text-sm font-semibold text-[#07111d] hover:border-[#c88b25] transition"
            >
              <Shield className="h-4 w-4 shrink-0" />
              Acceder al Panel Cliente
            </Link>
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-[#D4A017] bg-[#D4A017]/10 px-4 py-3 text-sm font-semibold text-[#07111d] hover:bg-[#D4A017]/20 transition"
            >
              <Phone className="h-4 w-4 shrink-0" />
              Reservar llamada de 15 minutos
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}

// ── Internal layout components ────────────────────────────────────────────────

function Section({ icon: Icon, title, color, children }: {
  icon: React.ElementType;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`h-5 w-5 shrink-0 ${color}`} />
        <h2 className="font-serif text-xl font-bold text-[#07111d]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function InfoCard({ color, children }: { color: 'red' | 'amber' | 'blue'; children: React.ReactNode }) {
  const styles = {
    red:   'border-red-200 bg-red-50',
    amber: 'border-amber-200 bg-amber-50',
    blue:  'border-blue-100 bg-blue-50',
  };
  return (
    <div className={`rounded-xl border p-4 ${styles[color]}`}>
      {children}
    </div>
  );
}
