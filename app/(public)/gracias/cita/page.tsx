import Link from 'next/link';
import { Calendar, CheckCircle2 } from 'lucide-react';

export default function GraciasCitaPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F8F6F1] px-6 py-20 text-center">
      <div className="mx-auto max-w-md">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D4A017]/15">
            <CheckCircle2 className="h-8 w-8 text-[#D4A017]" />
          </div>
        </div>
        <h1 className="mt-6 font-serif text-3xl font-bold text-[#0D1B2A]">¡Solicitud recibida!</h1>
        <p className="mt-4 text-sm leading-7 text-[#374151]">
          Hemos recibido tu solicitud de cita. Te confirmaremos el día y la hora exacta en menos de <strong>24 horas hábiles</strong> por email.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-[#D4A017]/30 bg-[#D4A017]/5 px-5 py-3 text-sm text-[#374151]">
          <Calendar className="h-4 w-4 text-[#D4A017]" />
          Revisa tu bandeja de entrada para el email de confirmación.
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center border border-[#0D1B2A]/20 px-6 py-3 text-sm font-semibold text-[#0D1B2A] transition hover:border-[#D4A017]"
          >
            Volver al inicio
          </Link>
          <Link
            href="/servicios"
            className="inline-flex items-center justify-center bg-[#D4A017] px-6 py-3 text-sm font-bold text-[#0D1B2A] transition hover:bg-[#F2C14E]"
          >
            Ver nuestros servicios
          </Link>
        </div>
      </div>
    </main>
  );
}
