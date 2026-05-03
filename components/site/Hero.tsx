import Image from 'next/image';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Briefcase, FileCheck, Globe2, ShieldCheck, Star } from 'lucide-react';

const heroBackgroundImage = '/hero/home-hero-background.png';

const trustItems: Array<{ title: string; text: string; Icon: LucideIcon }> = [
  { title: '+20 años', text: 'experiencia fiscal y legal', Icon: Star },
  { title: 'AEAT', text: 'colaboradora social', Icon: ShieldCheck },
  { title: 'Red PAE', text: 'apoyo a empresas', Icon: Briefcase },
  { title: 'Camerfirma', text: 'certificados digitales', Icon: FileCheck },
  { title: 'Expatriados', text: 'residencia y fiscalidad', Icon: Globe2 }
];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#0D1B2A] text-[#F8F6F1] lg:min-h-[760px]">
      <Image
        src={heroBackgroundImage}
        alt="Asesoría fiscal y legal"
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-30 object-cover object-[64%_center] lg:object-[58%_center]"
      />
      <div className="absolute inset-0 -z-20 bg-gradient-to-r from-[#0D1B2A]/94 via-[#0D1B2A]/62 to-[#0D1B2A]/8" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0D1B2A]/75 via-transparent to-[#0D1B2A]/18" />

      <div className="mx-auto flex min-h-[650px] w-full max-w-7xl items-center px-6 py-20 lg:min-h-[650px] lg:px-20 lg:pb-32">
        <div className="max-w-xl">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.32em] text-[#D4A017]">Asesoría premium en España</p>

          <h1 className="font-serif text-[2.35rem] font-semibold leading-[1.05] text-[#F8F6F1] md:text-5xl xl:text-[3.65rem]">
            <span className="block">Asesoría fiscal</span>
            <span className="block">y legal</span>
            <span className="block text-[#D4A017]">sin complicaciones</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-[#F8F6F1]/88 md:text-xl">
            Contrata online, sube tu documentación y recibe tu trámite resuelto con seguimiento profesional.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/servicios/empresas-autonomos"
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#D4A017] px-7 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              Soy empresa
            </Link>
            <Link
              href="/servicios/declaraciones-impuestos"
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#D4A017] px-7 py-3 text-sm font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
            >
              Soy particular
            </Link>
          </div>

          <p className="mt-6 text-sm text-[#F8F6F1]/70">Sin desplazamientos · Gestión completa · Resultados claros</p>
        </div>
      </div>

      <div className="relative z-10 border-y border-[#D4A017]/25 bg-[#0D1B2A]/90 backdrop-blur-md lg:absolute lg:inset-x-0 lg:bottom-0">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-[#D4A017]/18 px-6 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5 lg:px-20">
          {trustItems.map(({ Icon, title, text }) => (
            <div key={title} className="flex min-h-24 items-center gap-4 py-4 sm:px-5">
              <Icon className="h-9 w-9 shrink-0 stroke-[#D4A017]" strokeWidth={1.6} />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#F8F6F1]">{title}</p>
                <p className="mt-1 text-xs leading-5 text-[#9CA3AF]">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
