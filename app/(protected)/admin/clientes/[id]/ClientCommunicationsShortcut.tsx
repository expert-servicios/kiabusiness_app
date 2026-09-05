'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardCheck, FileText, Mail } from 'lucide-react';

export function ClientCommunicationsShortcut({ clientId }: { clientId: string }) {
  const pathname = usePathname();
  const inCommunications = pathname.endsWith('/comunicaciones');
  const inDocuments = pathname.endsWith('/documentos');
  const inChecklist = pathname.endsWith('/documentos/checklist');

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {!inChecklist && (
        <Link
          href={`/admin/clientes/${clientId}/documentos/checklist`}
          className="flex items-center gap-2 rounded-full border border-[#d8cbb5] bg-white px-4 py-3 text-sm font-bold text-[#07111d] shadow-lg transition hover:border-[#D4A017] focus:outline-none focus:ring-2 focus:ring-[#D4A017] focus:ring-offset-2"
          aria-label="Abrir checklist documental del cliente"
        >
          <ClipboardCheck className="h-4 w-4 text-[#D4A017]" />
          Checklist
        </Link>
      )}
      {!inDocuments && (
        <Link
          href={`/admin/clientes/${clientId}/documentos`}
          className="flex items-center gap-2 rounded-full border border-[#d8cbb5] bg-white px-4 py-3 text-sm font-bold text-[#07111d] shadow-lg transition hover:border-[#D4A017] focus:outline-none focus:ring-2 focus:ring-[#D4A017] focus:ring-offset-2"
          aria-label="Abrir documentos del cliente"
        >
          <FileText className="h-4 w-4 text-[#D4A017]" />
          Documentos
        </Link>
      )}
      {!inCommunications && (
        <Link
          href={`/admin/clientes/${clientId}/comunicaciones`}
          className="flex items-center gap-2 rounded-full bg-[#07111d] px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#142235] focus:outline-none focus:ring-2 focus:ring-[#D4A017] focus:ring-offset-2"
          aria-label="Abrir comunicaciones del cliente"
        >
          <Mail className="h-4 w-4 text-[#D4A017]" />
          Comunicaciones
        </Link>
      )}
    </div>
  );
}
