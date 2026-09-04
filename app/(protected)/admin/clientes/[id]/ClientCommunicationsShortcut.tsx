'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail } from 'lucide-react';

export function ClientCommunicationsShortcut({ clientId }: { clientId: string }) {
  const pathname = usePathname();
  if (pathname.endsWith('/comunicaciones')) return null;

  return (
    <Link
      href={`/admin/clientes/${clientId}/comunicaciones`}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[#07111d] px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#142235] focus:outline-none focus:ring-2 focus:ring-[#D4A017] focus:ring-offset-2"
      aria-label="Abrir comunicaciones del cliente"
    >
      <Mail className="h-4 w-4 text-[#D4A017]" />
      Comunicaciones
    </Link>
  );
}
