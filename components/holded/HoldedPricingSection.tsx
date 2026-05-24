'use client';

import { useState, useRef, lazy, Suspense } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  Layers,
  MonitorCheck,
  ShoppingCart,
  X as XIcon,
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { getReadinessCheck } from '@/lib/data/service-readiness-checks';

const ReadinessModal = lazy(() =>
  import('@/components/services/ReadinessModal').then(m => ({ default: m.ReadinessModal }))
);

// ── Data ──────────────────────────────────────────────────────────────────────

type Package = {
  priceId     : string;
  slug        : string;
  amountCents : number;
  name        : string;
  subtitle    : string;
  badge       : string | null;
  features    : string[];
};

const PACKAGES: Package[] = [
  {
    priceId    : 'price_1SxNObLeYwwgvux4fLN9k8YG',
    slug       : 'holded-pack-starter',
    amountCents: 49900,
    name       : 'Pack Starter',
    subtitle   : 'Onboarding a Holded',
    badge      : null,
    features   : [
      'Configuración inicial de la cuenta',
      'Setup de empresa, facturación y bancos',
      'Conexión bancaria (Open Banking)',
      'Soporte por email durante 30 días',
    ],
  },
  {
    priceId    : 'price_1SxNJcLeYwwgvux42XH9HxiJ',
    slug       : 'holded-migracion-sin-inventario',
    amountCents: 89900,
    name       : 'Migración completa',
    subtitle   : 'Sin módulo de inventario',
    badge      : 'Más popular',
    features   : [
      'Todo lo del Pack Starter',
      'Migración de clientes y proveedores',
      'Migración de facturas emitidas y recibidas',
      'Configuración contable completa (PGC)',
      'Soporte prioritario durante 60 días',
    ],
  },
  {
    priceId    : 'price_1SxNLlLeYwwgvux4IjCOgIQl',
    slug       : 'holded-migracion-con-inventario',
    amountCents: 119900,
    name       : 'Migración completa',
    subtitle   : '+ Módulo de inventario',
    badge      : null,
    features   : [
      'Todo lo de Migración completa',
      'Migración de productos y referencias',
      'Configuración de almacenes y stock inicial',
      'Integración inventario ↔ facturación',
      'Soporte prioritario durante 90 días',
    ],
  },
];

type Addon = {
  priceId     : string;
  name        : string;
  slug        : string;
  amountCents : number;
  displayPrice: string;
  Icon        : React.ComponentType<{ className?: string }>;
  description : string;
};

const ADDONS: Addon[] = [
  {
    priceId     : 'price_1TZqKbLeYwwgvux4NHtVCmEV',
    name        : 'Módulo Laboral',
    slug        : 'holded-modulo-laboral',
    amountCents : 18000,
    displayPrice: '180 € + IVA',
    Icon        : ClipboardCheck,
    description : 'Nóminas, contratos, altas y bajas en la Seguridad Social integradas con tu contabilidad en Holded.',
  },
  {
    priceId     : 'price_1SyB8ULeYwwgvux4sZbYod1B',
    name        : 'Módulo Formación',
    slug        : 'holded-modulo-formacion',
    amountCents : 18000,
    displayPrice: '180 € + IVA',
    Icon        : MonitorCheck,
    description : 'Sesión práctica de 2 horas por videollamada sobre los módulos que usas, con grabación incluida.',
  },
  {
    priceId     : 'price_1TZqKeLeYwwgvux4pkUNsDms',
    name        : 'Otras Integraciones API',
    slug        : 'holded-integraciones-api',
    amountCents : 18000,
    displayPrice: '180 € + IVA',
    Icon        : Layers,
    description : 'Conecta Holded con tu tienda online, CRM, pasarela de pago u otras herramientas mediante la API.',
  },
];

function formatPrice(cents: number) {
  return new Intl.NumberFormat('es-ES', {
    style             : 'currency',
    currency          : 'EUR',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HoldedPricingSection() {
  const { addItem } = useCart();
  const [selectedPkgId,    setSelectedPkgId]    = useState<string | null>(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());
  const [added,            setAdded]            = useState(false);
  const [readinessOpen,    setReadinessOpen]    = useState(false);
  const configuratorRef = useRef<HTMLDivElement>(null);

  const selectedPkg     = PACKAGES.find((p) => p.priceId === selectedPkgId) ?? null;
  const addonTotal      = selectedAddonIds.size * 18000;
  const total           = selectedPkg ? selectedPkg.amountCents + addonTotal : 0;
  const readinessCheck  = selectedPkg ? getReadinessCheck(selectedPkg.slug) ?? null : null;

  function handleSelectPkg(priceId: string) {
    if (selectedPkgId === priceId) return;
    setSelectedPkgId(priceId);
    setSelectedAddonIds(new Set());
    setTimeout(() => configuratorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
  }

  function toggleAddon(priceId: string) {
    setSelectedAddonIds((prev) => {
      const next = new Set(prev);
      if (next.has(priceId)) next.delete(priceId);
      else next.add(priceId);
      return next;
    });
  }

  function doAddToCart() {
    if (!selectedPkg) return;

    addItem({
      priceId     : selectedPkg.priceId,
      name        : `${selectedPkg.name} — ${selectedPkg.subtitle}`,
      displayPrice: `${formatPrice(selectedPkg.amountCents)} + IVA`,
      slug        : selectedPkg.slug,
      category    : 'holded',
    });

    for (const addonId of selectedAddonIds) {
      const addon = ADDONS.find((a) => a.priceId === addonId);
      if (addon) {
        addItem({
          priceId     : addon.priceId,
          name        : addon.name,
          displayPrice: addon.displayPrice,
          slug        : addon.slug,
          category    : 'holded',
        });
      }
    }

    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  }

  function handleAddToCart() {
    if (!selectedPkg) return;
    if (readinessCheck) {
      setReadinessOpen(true);
    } else {
      doAddToCart();
    }
  }

  return (
    <>
    {readinessOpen && readinessCheck && selectedPkg && (
      <Suspense fallback={null}>
        <ReadinessModal
          check={readinessCheck}
          serviceSlug={selectedPkg.slug}
          onApproved={doAddToCart}
          onClose={() => setReadinessOpen(false)}
        />
      </Suspense>
    )}
    <section id="precios" className="bg-white px-6 py-16 md:py-20">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Paquetes</p>
          <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl">
            Elige el paquete que se adapta a tu situación.
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#23364D]">
            Selecciona un paquete, elige los módulos opcionales que necesitas y añade todo a la cesta en un solo paso.
          </p>
        </div>

        {/* ── Plan cards ──────────────────────────────────────────────────── */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PACKAGES.map((pkg) => {
            const isSelected = selectedPkgId === pkg.priceId;
            return (
              <div
                key={pkg.priceId}
                className={[
                  'relative flex flex-col border p-7 transition-all duration-200',
                  isSelected
                    ? 'border-[#D4A017] bg-white shadow-[0_8px_32px_rgba(212,160,23,0.22)] ring-2 ring-[#D4A017]/40'
                    : pkg.badge
                      ? 'border-[#D4A017]/50 bg-white shadow-[0_4px_16px_rgba(212,160,23,0.10)] hover:border-[#D4A017]'
                      : 'border-[#D4A017]/25 bg-white hover:border-[#D4A017]/60',
                ].join(' ')}
              >
                {pkg.badge && !isSelected && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D4A017] px-4 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#0D1B2A]">
                    {pkg.badge}
                  </span>
                )}
                {isSelected && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[#D4A017] px-4 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#0D1B2A]">
                    <Check className="h-3 w-3" strokeWidth={3} />
                    Seleccionado
                  </span>
                )}

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4A017]">{pkg.name}</p>
                  <h3 className="mt-1 font-serif text-xl font-bold text-[#0D1B2A]">{pkg.subtitle}</h3>
                  <p className="mt-4 font-serif text-4xl font-bold text-[#0D1B2A]">{formatPrice(pkg.amountCents)}</p>
                  <p className="mt-1 text-xs text-[#9CA3AF]">Pago único · IVA no incluido</p>
                </div>

                <ul className="mt-6 flex-1 space-y-3">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[#23364D]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 space-y-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPkg(pkg.priceId)}
                    disabled={isSelected}
                    className={[
                      'flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-bold uppercase tracking-wide transition',
                      isSelected
                        ? 'cursor-default bg-[#D4A017] text-[#0D1B2A]'
                        : 'bg-[#0D1B2A] text-[#F8F6F1] hover:bg-[#D4A017] hover:text-[#0D1B2A]',
                    ].join(' ')}
                  >
                    {isSelected ? (
                      <><Check className="h-4 w-4" strokeWidth={3} /> Paquete seleccionado</>
                    ) : (
                      <>Seleccionar paquete <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                  {pkg.slug === 'holded-pack-starter' && (
                    <Link
                      href="/holded/pack-starter"
                      className="inline-flex w-full items-center justify-center border border-[#D4A017]/40 px-5 py-2.5 text-xs font-semibold text-[#D4A017] transition hover:border-[#D4A017] hover:bg-[#D4A017]/5"
                    >
                      Ver detalles del servicio →
                    </Link>
                  )}
                  {pkg.slug === 'holded-migracion-sin-inventario' && (
                    <Link
                      href="/holded/migracion-sin-inventario"
                      className="inline-flex w-full items-center justify-center border border-[#D4A017]/40 px-5 py-2.5 text-xs font-semibold text-[#D4A017] transition hover:border-[#D4A017] hover:bg-[#D4A017]/5"
                    >
                      Ver detalles del servicio →
                    </Link>
                  )}
                  {pkg.slug === 'holded-migracion-con-inventario' && (
                    <Link
                      href="/holded/migracion-con-inventario"
                      className="inline-flex w-full items-center justify-center border border-[#D4A017]/40 px-5 py-2.5 text-xs font-semibold text-[#D4A017] transition hover:border-[#D4A017] hover:bg-[#D4A017]/5"
                    >
                      Ver detalles del servicio →
                    </Link>
                  )}
                  <Link
                    href={`/solicitar-presupuesto?servicio=${pkg.slug}`}
                    className="inline-flex w-full items-center justify-center border border-[#0D1B2A]/20 px-5 py-3 text-sm font-semibold text-[#23364D] transition hover:border-[#D4A017] hover:text-[#0D1B2A]"
                  >
                    Solicitar información
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Hint when nothing is selected */}
        {!selectedPkg && (
          <p className="mt-6 text-center text-sm text-[#23364D]/50">
            Selecciona un paquete para elegir módulos opcionales y tramitar todo en un solo pago.
          </p>
        )}

        {/* ── Add-on configurator ──────────────────────────────────────────── */}
        <div ref={configuratorRef}>
          {selectedPkg && (
            <div className="mt-8 border border-[#D4A017]/40 bg-[#FBF8EF] p-6 md:p-8">

              {/* Panel header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4A017]">
                    Módulos opcionales · {selectedPkg.name}
                  </p>
                  <h3 className="mt-1 font-serif text-xl font-bold text-[#0D1B2A]">
                    ¿Quieres añadir módulos complementarios?
                  </h3>
                  <p className="mt-1 text-sm text-[#23364D]/70">
                    Se incluyen en el mismo pago. Puedes omitirlos si no los necesitas ahora.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedPkgId(null); setSelectedAddonIds(new Set()); }}
                  className="shrink-0 p-1.5 text-[#23364D]/40 transition hover:text-[#0D1B2A]"
                  aria-label="Cancelar selección de paquete"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Add-on toggle cards */}
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {ADDONS.map(({ priceId, name, Icon, description, displayPrice }) => {
                  const isOn = selectedAddonIds.has(priceId);
                  return (
                    <button
                      key={priceId}
                      type="button"
                      onClick={() => toggleAddon(priceId)}
                      className={[
                        'relative flex flex-col items-start gap-3 border p-5 text-left transition-all',
                        isOn
                          ? 'border-[#D4A017] bg-white shadow-[0_4px_16px_rgba(212,160,23,0.15)]'
                          : 'border-[#D4A017]/25 bg-white/70 hover:border-[#D4A017]/60 hover:bg-white',
                      ].join(' ')}
                    >
                      {/* Checkbox indicator */}
                      <span className={[
                        'absolute right-4 top-4 flex h-5 w-5 items-center justify-center border transition-all',
                        isOn ? 'border-[#D4A017] bg-[#D4A017]' : 'border-[#D4A017]/40 bg-white',
                      ].join(' ')}>
                        {isOn && <Check className="h-3 w-3 text-[#0D1B2A]" strokeWidth={3} />}
                      </span>

                      <div className="flex h-10 w-10 items-center justify-center bg-[#D4A017]/10">
                        <Icon className="h-5 w-5 text-[#D4A017]" />
                      </div>
                      <div className="pr-6">
                        <p className="font-serif text-base font-bold text-[#0D1B2A]">{name}</p>
                        <p className="mt-1 text-xs leading-5 text-[#23364D]/80">{description}</p>
                      </div>
                      <p className="mt-auto font-bold text-[#D4A017]">{displayPrice}</p>
                    </button>
                  );
                })}
              </div>

              {/* Summary + CTA */}
              <div className="mt-6 flex flex-col gap-4 border-t border-[#D4A017]/30 pt-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs text-[#23364D]/60">
                    {selectedPkg.name} — {selectedPkg.subtitle}
                    {selectedAddonIds.size > 0 && (
                      <> + {selectedAddonIds.size} módulo{selectedAddonIds.size > 1 ? 's' : ''}</>
                    )}
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-serif text-4xl font-bold text-[#0D1B2A]">{formatPrice(total)}</span>
                    <span className="text-sm text-[#9CA3AF]">+ IVA · pago único</span>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-1.5 sm:items-end">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className={[
                      'inline-flex min-w-56 items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold uppercase tracking-wide transition',
                      added
                        ? 'bg-green-600 text-white'
                        : 'bg-[#D4A017] text-[#0D1B2A] hover:bg-[#F2C14E]',
                    ].join(' ')}
                  >
                    {added ? (
                      <><Check className="h-4 w-4" strokeWidth={3} /> ¡Añadido a la cesta!</>
                    ) : (
                      <><ShoppingCart className="h-4 w-4" /> Añadir a la cesta</>
                    )}
                  </button>
                  <p className="text-[10px] text-[#23364D]/50">
                    Puedes revisar y modificar antes de pagar
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Personalised quote link */}
        <p className="mt-8 text-center text-sm text-[#23364D]/60">
          ¿Tu caso no encaja exactamente?{' '}
          <Link href="/solicitar-presupuesto?servicio=migracion-holded" className="font-semibold text-[#D4A017] hover:underline">
            Solicita un presupuesto personalizado
          </Link>
        </p>
      </div>
    </section>
    </>
  );
}
