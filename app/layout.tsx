import './globals.css';
import { ReactNode } from 'react';
import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';

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
