'use client';

import Link from 'next/link';
import { CalendarClock, FileText, Gauge, Gift, ListTodo, Mail, Plug } from 'lucide-react';

export function ClientOperationsNav({ clientId }: { clientId: string }) {
  return (
    <nav className="border-b border-[#e6dfd2] bg-[#faf8f2]">
      <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-6 py-2.5">
        <Link href={`/admin/clientes/${clientId}/operaciones`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] bg-white px-3 py-1.5 text-xs font-bold text-[#07111d] hover:border-[#c88b25]">
          <Gauge className="h-3.5 w-3.5" /> Operaciones
        </Link>
        <Link href={`/admin/clientes/${clientId}/obligaciones`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] bg-white px-3 py-1.5 text-xs font-bold text-[#07111d] hover:border-[#c88b25]">
          <CalendarClock className="h-3.5 w-3.5" /> Fiscal
        </Link>
        <Link href={`/admin/clientes/${clientId}/beneficios`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] bg-white px-3 py-1.5 text-xs font-bold text-[#07111d] hover:border-[#c88b25]">
          <Gift className="h-3.5 w-3.5" /> Beneficios
        </Link>
        <Link href={`/admin/clientes/${clientId}/comunicaciones`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] bg-white px-3 py-1.5 text-xs font-bold text-[#07111d] hover:border-[#c88b25]">
          <Mail className="h-3.5 w-3.5" /> Comunicaciones
        </Link>
        <Link href={`/admin/clientes/${clientId}/documentos`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] bg-white px-3 py-1.5 text-xs font-bold text-[#07111d] hover:border-[#c88b25]">
          <FileText className="h-3.5 w-3.5" /> Documentos
        </Link>
        <Link href={`/admin/tareas?clientId=${clientId}`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] bg-white px-3 py-1.5 text-xs font-bold text-[#07111d] hover:border-[#c88b25]">
          <ListTodo className="h-3.5 w-3.5" /> Tareas
        </Link>
        <Link href={`/admin/clientes/${clientId}/integraciones`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] bg-white px-3 py-1.5 text-xs font-bold text-[#07111d] hover:border-[#c88b25]">
          <Plug className="h-3.5 w-3.5" /> Integraciones
        </Link>
      </div>
    </nav>
  );
}
