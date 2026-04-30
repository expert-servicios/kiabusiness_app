import { trustItems } from '@/config/brand';

export function TrustBar() {
  return (
    <section className="bg-brand-cream py-10">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-6 sm:flex-row sm:flex-wrap sm:justify-between">
        {trustItems.map(({ label, Icon }) => (
          <div
            key={label}
            className="flex min-w-[220px] items-center gap-3 rounded-3xl border border-brand-navy/10 bg-white/90 px-5 py-4 text-sm text-brand-navy shadow-sm"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gold/10 text-brand-gold">
              <Icon className="h-5 w-5" />
            </span>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
