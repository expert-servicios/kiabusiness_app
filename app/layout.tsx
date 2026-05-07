import './globals.css';
import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import Script from 'next/script';
import { MessageCircle } from 'lucide-react';
import { type ReactNode } from 'react';
import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';

const GTM_ID = 'GTM-MKZ522HP';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap'
});

export const metadata: Metadata = {
  metadataBase: new URL('https://kseniailicheva.com'),
  title: 'EXPERT | Asesoría fiscal, legal y administrativa',
  description:
    'Asesoría fiscal en España para empresas, autónomos y personas físicas. Impuestos, extranjería, trámites y gestión administrativa.',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'EXPERT — Asesoría Fiscal y Legal',
    title: 'EXPERT | Asesoría fiscal, legal y administrativa',
    description:
      'Asesoría fiscal en España para empresas, autónomos y personas físicas. Impuestos, extranjería, trámites y gestión administrativa.',
    url: 'https://kseniailicheva.com'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EXPERT | Asesoría fiscal, legal y administrativa',
    description: 'Asesoría fiscal en España para empresas, autónomos y personas físicas.'
  },
  icons: {
    icon: [
      { url: '/logos/EXPERT_logo/expert-favicon.png', type: 'image/png', sizes: '32x32' },
      { url: '/logos/EXPERT_logo/expert-favicon.png', type: 'image/png', sizes: '192x192' },
      { url: '/logos/EXPERT_logo/expert-favicon.png', type: 'image/png', sizes: '512x512' },
      { url: '/logos/EXPERT_logo/expert-favicon.png', type: 'image/png', sizes: '1024x1024' }
    ],
    shortcut: [{ url: '/logos/EXPERT_logo/expert-favicon.png', type: 'image/png', sizes: '1024x1024' }],
    apple: [
      { url: '/logos/EXPERT_logo/expert-favicon.png', type: 'image/png', sizes: '180x180' },
      { url: '/logos/EXPERT_logo/expert-favicon.png', type: 'image/png', sizes: '1024x1024' }
    ]
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`
          }}
        />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            className="gtm-noscript"
          />
        </noscript>
        <Header />
        {children}
        <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#D4A017] to-transparent" />
        <Footer />
        <a
          href="https://wa.me/34696550480"
          aria-label="Abrir WhatsApp"
          className="fixed bottom-5 right-5 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_16px_35px_rgba(0,0,0,0.25)] transition hover:scale-105 hover:bg-[#1ebe5d] focus:outline-none focus:ring-4 focus:ring-[#25D366]/30"
        >
          <MessageCircle className="h-7 w-7" aria-hidden="true" />
        </a>
      </body>
    </html>
  );
}
