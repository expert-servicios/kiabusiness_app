import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
      <Link href="/" className="inline-flex items-center gap-1 transition hover:text-[#D4A017]">
        <Home className="h-3.5 w-3.5" />
        <span className="sr-only">Inicio</span>
      </Link>
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3 shrink-0 text-[#9CA3AF]/50" />
          {item.href && i < items.length - 1 ? (
            <Link href={item.href} className="transition hover:text-[#D4A017]">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-[#23364D]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
