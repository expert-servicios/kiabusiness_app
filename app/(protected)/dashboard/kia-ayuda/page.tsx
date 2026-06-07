import Link from 'next/link';
import { ArrowLeft, Bot, CheckCircle2, Info, MessageSquare, XCircle } from 'lucide-react';

const PUEDO: { icon: string; title: string; desc: string }[] = [
  {
    icon: '📋',
    title: 'Orientar sobre trámites',
    desc: 'Explica los pasos, plazos y documentación para IRPF, IVA, autónomos, extranjería, certificados digitales y muchos otros procedimientos.',
  },
  {
    icon: '📊',
    title: 'Informar sobre servicios EXPERT',
    desc: 'Describe qué incluye cada plan o gestión, da precios públicos y guía para solicitar presupuesto o reservar cita.',
  },
  {
    icon: '🏛️',
    title: 'Compartir fuentes oficiales',
    desc: 'Cita enlaces de la AEAT, Seguridad Social, Agencia Tributaria y otros organismos cuando la información está disponible.',
  },
  {
    icon: '📅',
    title: 'Recordar obligaciones fiscales',
    desc: 'Orienta sobre plazos de presentación de declaraciones, calendarios tributarios y fechas clave para autónomos y empresas.',
  },
  {
    icon: '🌍',
    title: 'Atender en español y ruso',
    desc: 'Detecta automáticamente el idioma del mensaje y responde en el mismo idioma.',
  },
  {
    icon: '🔗',
    title: 'Redirigir a donde corresponde',
    desc: 'Para trámites formales, contratos o datos sensibles, deriva al portal seguro, cita o presupuesto online.',
  },
];

const NO_PUEDO: { title: string; desc: string }[] = [
  {
    title: 'Dar asesoramiento legal o fiscal vinculante',
    desc: 'Kia orienta, pero no sustituye a un asesor colegiado. Para decisiones con consecuencias legales o económicas, reserva una consulta con el equipo EXPERT.',
  },
  {
    title: 'Acceder a tu expediente ni a datos personales',
    desc: 'Kia no ve tus documentos, estado de expediente ni información de cuenta. Para eso, usa el portal seguro o contacta por WhatsApp con tu asesor.',
  },
  {
    title: 'Mantener conversaciones sin relación con EXPERT',
    desc: 'Preguntas de entretenimiento, filosofía, política u otros temas ajenos a trámites o servicios están fuera de su ámbito. Kia responde brevemente y redirige.',
  },
  {
    title: 'Garantizar exactitud en normativas recientes',
    desc: 'La legislación cambia con frecuencia. Para casos sensibles o urgentes, contrasta siempre con el equipo EXPERT o las fuentes oficiales.',
  },
];

const BUENAS: { num: string; title: string; desc: string }[] = [
  {
    num: '01',
    title: 'Sé específico sobre tu situación',
    desc: '"Soy autónomo en régimen simplificado de IVA y me llega una notificación de la AEAT" es mucho más útil que "tengo un problema con impuestos". Cuantos más detalles relevantes aportes, más concreta y útil será la orientación.',
  },
  {
    num: '02',
    title: 'Una pregunta cada vez',
    desc: 'Kia responde mejor cuando el hilo se centra en un tema. Si tienes varias consultas independientes, trátala de una en una para obtener respuestas más completas.',
  },
  {
    num: '03',
    title: 'Usa el portal para gestiones formales',
    desc: 'WhatsApp es ideal para orientación y primeras preguntas. Para solicitar un servicio, compartir documentos o ver el estado de tu expediente, accede siempre al portal seguro.',
  },
  {
    num: '04',
    title: 'Si la respuesta no es clara, pide reformulación',
    desc: 'Escribe "explícamelo de otra forma" o "¿qué significa eso en mi caso?". Kia intentará dar una respuesta desde otro ángulo.',
  },
  {
    num: '05',
    title: 'Para urgencias, reserva llamada',
    desc: 'Requerimientos, sanciones, embargos o inspecciones requieren atención humana inmediata. Usa el enlace de cita express para hablar con un asesor.',
  },
  {
    num: '06',
    title: 'Respeta el alcance de Kia',
    desc: 'Kia no debate, no opina de política ni responde a provocaciones. Mensajes repetitivos o fuera de contexto darán lugar a un cierre cortés de la conversación.',
  },
];

export default function KiaAyudaPage() {
  return (
    <main className="min-h-screen bg-[#f8f4eb]">

      {/* Header */}
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#5f7282] hover:text-[#29384a]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al panel
          </Link>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d7a33a]/10">
              <Bot className="h-5 w-5 text-[#c88b25]" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#07111d]">Cómo usar Kia</h1>
              <p className="mt-0.5 text-sm text-[#29384a]">
                Guía de buenas prácticas y límites del asistente virtual de EXPERT
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-10 px-6 py-8">

        {/* Qué es Kia */}
        <section className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info className="h-4 w-4 text-[#c88b25]" />
            <h2 className="font-serif text-lg font-bold text-[#07111d]">¿Qué es Kia?</h2>
          </div>
          <p className="text-sm text-[#29384a] leading-relaxed">
            Kia es la asistente virtual de EXPERT Consulting. Responde por WhatsApp y desde el panel de cliente
            para orientarte sobre trámites, impuestos, gestoría y los servicios de EXPERT. Kia usa inteligencia
            artificial y está diseñada para dar información útil, redirigir a las personas adecuadas y facilitar
            el primer contacto — no para tomar decisiones legales o fiscales por ti.
          </p>
          <p className="mt-3 text-sm text-[#29384a] leading-relaxed">
            El asistente opera bajo las mismas políticas de uso responsable que guían a los grandes modelos de
            lenguaje (como los de Anthropic o OpenAI): respeta la privacidad, no proporciona asesoramiento
            vinculante, rechaza contenido dañino y redirige cuando el caso supera su alcance.
          </p>
        </section>

        {/* Qué puede hacer */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <h2 className="font-serif text-lg font-bold text-[#07111d]">Lo que Kia puede hacer</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {PUEDO.map((item) => (
              <div
                key={item.title}
                className="flex gap-3 rounded-xl border border-[#d8cbb5] bg-white p-4"
              >
                <span className="text-xl leading-none">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-[#07111d]">{item.title}</p>
                  <p className="mt-1 text-xs text-[#5f7282] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Qué no puede hacer */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <XCircle className="h-4 w-4 text-red-500" />
            <h2 className="font-serif text-lg font-bold text-[#07111d]">Límites de Kia</h2>
          </div>
          <div className="space-y-3">
            {NO_PUEDO.map((item) => (
              <div
                key={item.title}
                className="flex gap-3 rounded-xl border border-red-100 bg-red-50/50 p-4"
              >
                <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                <div>
                  <p className="text-sm font-semibold text-[#07111d]">{item.title}</p>
                  <p className="mt-1 text-xs text-[#5f7282] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Buenas prácticas */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <MessageSquare className="h-4 w-4 text-[#c88b25]" />
            <h2 className="font-serif text-lg font-bold text-[#07111d]">Buenas prácticas</h2>
          </div>
          <div className="space-y-4">
            {BUENAS.map((item) => (
              <div
                key={item.num}
                className="flex gap-4 rounded-xl border border-[#d8cbb5] bg-white p-5"
              >
                <span className="font-mono text-xs font-bold text-[#c88b25] mt-0.5 shrink-0">{item.num}</span>
                <div>
                  <p className="text-sm font-semibold text-[#07111d]">{item.title}</p>
                  <p className="mt-1.5 text-xs text-[#5f7282] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Conversaciones fuera de contexto */}
        <section className="rounded-2xl border border-[#d7a33a]/30 bg-[#d7a33a]/5 p-6">
          <h2 className="font-serif text-base font-bold text-[#07111d] mb-3">
            ¿Qué pasa si la conversación se desvía?
          </h2>
          <p className="text-sm text-[#29384a] leading-relaxed">
            Si los mensajes no tienen relación con EXPERT (saludos prolongados, preguntas filosóficas,
            bromas, insultos…), Kia responde una sola vez de forma amable y redirige. Si el patrón
            continúa, Kia cerrará la conversación cortésmente y la marcará para revisión humana.
          </p>
          <p className="mt-3 text-sm text-[#29384a] leading-relaxed">
            Este comportamiento sigue las directrices de uso responsable de IA de Anthropic y OpenAI:
            los asistentes deben evitar loops de conversación inútiles, respetar el alcance para el que
            están diseñados y escalar al equipo humano cuando sea necesario.
          </p>
        </section>

        {/* Privacidad */}
        <section className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
          <h2 className="font-serif text-base font-bold text-[#07111d] mb-3">Privacidad y datos</h2>
          <ul className="space-y-2 text-sm text-[#29384a]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
              Los mensajes de WhatsApp se almacenan en servidores de EXPERT bajo cifrado.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
              Kia no solicita NIF, contraseñas ni datos bancarios por WhatsApp. Si alguien te los
              pide en nombre de EXPERT, no lo facilites y contacta directamente con el equipo.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
              Las conversaciones pueden ser revisadas por el equipo EXPERT para control de calidad
              y mejora del servicio.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
              Para formalizar cualquier operación, usa siempre el portal seguro (expertconsulting.es).
            </li>
          </ul>
        </section>

        {/* CTA */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/dashboard/citas"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d7a33a] px-5 py-2.5 text-sm font-bold text-[#061321] hover:bg-[#f0bf54] transition"
          >
            Reservar cita con asesor
          </Link>
          <Link
            href="/solicitar-presupuesto"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d8cbb5] bg-white px-5 py-2.5 text-sm font-semibold text-[#07111d] hover:bg-[#f8f4eb] transition"
          >
            Solicitar presupuesto
          </Link>
        </div>

        <p className="text-center text-xs text-[#8899aa] pb-2">
          Versión de política: junio 2026 · EXPERT Consulting · Kia AI Assistant
        </p>

      </div>
    </main>
  );
}
