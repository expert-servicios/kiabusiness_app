import { type ReactNode } from 'react';
import { CalendarClock, MessageCircle } from 'lucide-react';
import Script from 'next/script';
import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';
import { InstallPwaPrompt } from '@/components/InstallPwaPrompt';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {RECAPTCHA_SITE_KEY && (
        <Script
          id="recaptcha-v3"
          src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`}
          strategy="afterInteractive"
        />
      )}
      <Header />
      {children}
      <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#D4A017] to-transparent" />
      <Footer />
      <InstallPwaPrompt variant="banner" />
      {/* Floating action buttons */}
      <div className="fixed bottom-5 right-5 z-[70] flex flex-col items-center gap-3">
        <a
          href={process.env.NEXT_PUBLIC_CALENDLY_REUNION_URL ?? 'https://calendly.com/soy-kseniailicheva/reunion-informativa'}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Reservar llamada gratuita 15 min"
          title="Llamada gratuita 15 min"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D4A017] text-[#0D1B2A] shadow-[0_16px_35px_rgba(0,0,0,0.25)] transition hover:scale-105 hover:bg-[#F2C14E] focus:outline-none focus:ring-4 focus:ring-[#D4A017]/30"
        >
          <CalendarClock className="h-6 w-6" aria-hidden="true" />
        </a>
        <a
          href="https://wa.me/34696550480?text=Hola%2C%20me%20gustar%C3%ADa%20obtener%20informaci%C3%B3n%20sobre%20vuestros%20servicios%20de%20asesor%C3%ADa%20y%20Holded.%20%C2%BFPod%C3%A9is%20ayudarme%3F"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escribir por WhatsApp"
          title="Escríbenos por WhatsApp"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_16px_35px_rgba(0,0,0,0.25)] transition hover:scale-105 hover:bg-[#1ebe5d] focus:outline-none focus:ring-4 focus:ring-[#25D366]/30"
        >
          <MessageCircle className="h-7 w-7" aria-hidden="true" />
        </a>
      </div>
    </>
  );
}
