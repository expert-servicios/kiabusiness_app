import { type ReactNode } from 'react';
import Script from 'next/script';
import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';
import { InstallPwaPrompt } from '@/components/InstallPwaPrompt';
import { WhatsAppChatWidget } from '@/components/site/WhatsAppChatWidget';
import { CartProvider } from '@/contexts/CartContext';
import { CartSidebar } from '@/components/cart/CartSidebar';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
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
        <WhatsAppChatWidget />
      </div>
      {/* Cart sidebar — rendered above floating buttons */}
      <CartSidebar />
    </CartProvider>
  );
}
