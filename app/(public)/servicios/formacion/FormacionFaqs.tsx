'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: '¿Puedo hacer la sesión desde el móvil o tablet?',
    a: 'No. La formación requiere un ordenador de sobremesa o portátil. Las sedes electrónicas de la AEAT, Seguridad Social y otros organismos no funcionan correctamente en móvil y el certificado digital instalado en el navegador tampoco está disponible en dispositivos móviles.'
  },
  {
    q: '¿Qué pasa si no tengo certificado digital?',
    a: 'Podemos orientarte para obtenerlo antes de la sesión. Como Punto de Registro Autorizado de Camerfirma, tramitamos certificados digitales para personas físicas y representantes de empresa. Reserva primero una llamada gratuita y te explicamos cómo.'
  },
  {
    q: '¿Necesito tener Holded contratado para todas las sesiones?',
    a: 'Solo para la sesión de Holded (contabilidad y facturación). El resto de sesiones — AEAT, Seguridad Social, alta de autónomo, etc. — no requieren Holded. Si estás pensando en contratar Holded, podemos orientarte también en esa decisión.'
  },
  {
    q: '¿Puedo elegir el contenido concreto dentro de un área?',
    a: 'Sí. Antes de la sesión te preguntamos exactamente qué quieres aprender y adaptamos el contenido a tu situación. Por ejemplo, dentro de "Sede Electrónica AEAT" podemos centrarnos en cómo presentar un escrito de recurso, en cómo descargar tus declaraciones o en cómo atender un requerimiento concreto.'
  },
  {
    q: '¿Se graba la sesión?',
    a: 'Sí. Si la sesión es online por videollamada, te enviamos la grabación al finalizar junto con un resumen escrito de los puntos tratados. Así puedes repasar cualquier paso cuando lo necesites.'
  },
  {
    q: '¿Cuántas sesiones necesito para aprender a usar la sede electrónica de la AEAT?',
    a: 'Depende de tu punto de partida y de las gestiones que quieras hacer. Para usuarios sin experiencia previa, con 1 sesión de 2 horas se cubren las operaciones más habituales: consultar datos, descargar declaraciones y atender notificaciones. Para gestiones más avanzadas como presentar recursos o modelos tributarios, puede ser útil una segunda sesión.'
  },
  {
    q: '¿Puedo hacer la sesión con más de una persona de mi empresa?',
    a: 'La sesión está diseñada para ser individual, pero pueden asistir 2-3 personas del mismo equipo si lo necesitáis. Si sois más, podemos valorar un formato adaptado. Consúltanos antes de reservar.'
  },
  {
    q: '¿Qué ocurre si no puedo asistir el día acordado?',
    a: 'Puedes reprogramar la sesión con al menos 24 horas de antelación sin ningún coste. Si cancelas con menos de 24 horas de antelación o no asistes sin avisar, la sesión se considera realizada.'
  }
];

export function FormacionFaqs() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="divide-y divide-[#D4A017]/20 border border-[#D4A017]/20">
      {faqs.map((faq, i) => (
        <div key={i}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-start justify-between gap-4 bg-white px-6 py-5 text-left transition hover:bg-[#F8F6F1]"
            aria-expanded={open === i}
          >
            <span className="text-sm font-semibold text-[#0D1B2A]">{faq.q}</span>
            <ChevronDown
              className={`mt-0.5 h-4 w-4 shrink-0 text-[#D4A017] transition-transform ${open === i ? 'rotate-180' : ''}`}
            />
          </button>
          {open === i && (
            <div className="bg-[#F8F6F1] px-6 pb-5 pt-3">
              <p className="text-sm leading-7 text-[#23364D]">{faq.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
