import Link from 'next/link';
import { CalendarCheck, CheckCircle2 } from 'lucide-react';
import { CalendlyButton } from '@/components/site/CalendlyButton';
import { getCalAcademyUrl } from '@/lib/utils/cal';
import { EventTracker } from '@/components/site/EventTracker';

// Success redirect for the external Stripe Payment Link of "Gestión Laboral
// Integral" (configured in the Stripe Dashboard, not via our own Checkout
// Session — see docs/courses/gestion-laboral/STRIPE_AND_CONVERSION.md).
// Deliberately does NOT claim the enrollment is active — that requires a
// webhook-confirmed academy_enrollments row, which doesn't exist yet for
// Payment Link purchases (Fase 2, pending).
export default function GraciasGestionLaboralPage() {
  const calAcademyUrl = getCalAcademyUrl();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F8F6F1] px-6 py-20 text-center">
      <EventTracker event="course_checkout_success" eventProps={{ program_slug: 'gestion-laboral-integral' }} />
      <div className="mx-auto max-w-md">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D4A017]/15">
            <CheckCircle2 className="h-8 w-8 text-[#D4A017]" />
          </div>
        </div>
        <h1 className="mt-6 font-serif text-3xl font-bold text-[#0D1B2A]">¡Pago recibido!</h1>
        <p className="mt-4 text-sm leading-7 text-[#374151]">
          Hemos recibido tu pago del <strong>Programa personalizado de Gestión Laboral Integral</strong>. Nuestro
          equipo revisará tu inscripción y te contactará en menos de <strong>24 horas hábiles</strong> para
          confirmar el acceso y organizar el calendario de formación.
        </p>

        {calAcademyUrl && (
          <div className="mt-8">
            {/* Reuses the same Academy informational-meeting slot as the landing
                page — there is no dedicated post-purchase training-session
                calendar yet, so the label stays consistent with what the link
                actually books instead of implying a course session. */}
            <CalendlyButton
              url={calAcademyUrl}
              fallbackHref="/cita"
              className="inline-flex items-center gap-2 bg-[#D4A017] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              <CalendarCheck className="h-4 w-4" />
              Reservar reunión informativa
            </CalendlyButton>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center border border-[#0D1B2A]/20 px-6 py-3 text-sm font-semibold text-[#0D1B2A] transition hover:border-[#D4A017]"
          >
            Volver al inicio
          </Link>
          <Link
            href="/contacto"
            className="inline-flex items-center justify-center bg-[#0D1B2A] px-6 py-3 text-sm font-bold text-[#F8F6F1] transition hover:bg-[#23364D]"
          >
            Contactar con EXPERT
          </Link>
        </div>
      </div>
    </main>
  );
}
