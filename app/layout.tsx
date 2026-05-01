import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';

export const metadata: Metadata = {
  icons: {
    icon: [{ url: '/logos/expert-favicon.png', type: 'image/png' }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
