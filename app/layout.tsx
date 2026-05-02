import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { MessageCircle } from 'lucide-react';
import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';

export const metadata: Metadata = {
  title: 'EXPERT | Asesoría fiscal, legal y administrativa',
  description:
    'Asesoría fiscal en España para empresas, autónomos y personas físicas. Impuestos, extranjería, trámites y gestión administrativa.',
  icons: {
    icon: [
      { url: '/logos/expert-isotipo.png', type: 'image/png', sizes: '512x512' },
      { url: '/logos/expert-favicon.png', type: 'image/png', sizes: '32x32' }
    ],
    shortcut: ['/logos/expert-isotipo.png'],
    apple: [{ url: '/logos/expert-isotipo.png', type: 'image/png', sizes: '512x512' }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Header />
        {children}
        <Footer />
        <a
          href="https://wa.me/34669045528"
          aria-label="Abrir WhatsApp"
          className="fixed bottom-5 right-5 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-[#c88b25] text-[#0D1B2A] shadow-[0_16px_35px_rgba(13,27,42,0.28)] transition hover:scale-105 hover:bg-[#b57a1e] focus:outline-none focus:ring-4 focus:ring-[#c88b25]/30"
        >
          <MessageCircle className="h-7 w-7" />
        </a>
      </body>
    </html>
  );
}
