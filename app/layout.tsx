import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import Script from 'next/script';
import { type ReactNode } from 'react';
import { PwaRegister } from '@/components/PwaRegister';

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#07111d',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://expertconsulting.es'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EXPERT',
  },
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
    url: 'https://expertconsulting.es'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EXPERT | Asesoría fiscal, legal y administrativa',
    description: 'Asesoría fiscal en España para empresas, autónomos y personas físicas.'
  },
  icons: {
    icon: [
      { url: '/logos/EXPERT_logo/expert-favicon.png', type: 'image/png', sizes: '32x32' },
      { url: '/logos/EXPERT_logo/expert-favicon.png', type: 'image/png', sizes: '96x96' },
      { url: '/logos/EXPERT_logo/expert-favicon.png', type: 'image/png', sizes: '192x192' },
      { url: '/logos/EXPERT_logo/expert-favicon.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/logos/EXPERT_logo/expert-favicon.png',
    apple: { url: '/logos/EXPERT_logo/expert-favicon.png', sizes: '180x180', type: 'image/png' },
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        {/* GTM noscript fallback — must be first in body */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            className="gtm-noscript"
          />
        </noscript>
        {/* GTM — manages GA4 internally; do NOT add standalone gtag.js to avoid double-tracking */}
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
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
