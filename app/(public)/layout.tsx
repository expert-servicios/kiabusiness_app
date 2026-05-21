import { type ReactNode } from 'react';
import Script from 'next/script';
import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';
import { InstallPwaPrompt } from '@/components/InstallPwaPrompt';
import { CalendlyFloatingButton } from '@/components/site/CalendlyFloatingButton';
import { WhatsAppChatWidget } from '@/components/site/WhatsAppChatWidget';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const CALENDLY_REUNION = process.env.NEXT_PUBLIC_CALENDLY_REUNION_URL ?? 'https://calendly.com/soy-kseniailicheva/reunion-informativa';

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
        <CalendlyFloatingButton url={CALENDLY_REUNION} />
        <WhatsAppChatWidget />
      </div>
    </>
  );
}
