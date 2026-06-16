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
    url: 'https://expertconsulting.es',
    images: [{ url: '/branding/expert%20servicios.png', width: 1200, height: 630, alt: 'EXPERT — Asesoría Fiscal y Legal' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EXPERT | Asesoría fiscal, legal y administrativa',
    description: 'Asesoría fiscal en España para empresas, autónomos y personas físicas.',
    images: ['/branding/expert%20servicios.png']
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
        {/* Cal.com embed — enables modal and inline booking across the site */}
        <Script id="cal-embed" strategy="lazyOnload" dangerouslySetInnerHTML={{ __html: `(function(C,A,L){let p=function(a,ar){a.q.push(ar)};let d=C.document;C.Cal=C.Cal||function(){let cal=C.Cal;let ar=arguments;if(!cal.loaded){cal.ns={};cal.q=cal.q||[];d.head.appendChild(d.createElement("script")).src=A;cal.loaded=true}if(ar[0]===L){const api=function(){p(api,arguments)};const namespace=ar[1];api.q=api.q||[];typeof namespace==="string"?(cal.ns[namespace]=api)&&p(api,ar):p(cal,ar);return}p(cal,ar)}})(window,"https://app.cal.com/embed/embed.js","init");Cal("init",{origin:"https://app.cal.com"});Cal("ui",{styles:{branding:{brandColor:"#f2c14e"}},hideEventTypeDetails:false,layout:"month_view"});` }} />
      </body>
    </html>
  );
}
