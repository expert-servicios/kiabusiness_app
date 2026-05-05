import type { ReactNode } from 'react';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* PWA manifest injected only for authenticated routes */}
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#0D1B2A" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="EXPERT Portal" />
      {children}
    </>
  );
}
