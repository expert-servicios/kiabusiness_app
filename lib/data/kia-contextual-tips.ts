export interface KiaTip {
  id         : string;
  text       : string;
  serviceSlug?: string;
  validFrom  ?: string; // ISO date YYYY-MM-DD
  validTo    ?: string; // ISO date YYYY-MM-DD
}

export const kiaContextualTips: KiaTip[] = [
  // ── Campaña renta IRPF (1 abr – 30 jun) ──
  {
    id      : 'irpf-campana-2026',
    text    : 'Estamos en plena campaña de la renta. Presenta tu declaración IRPF antes del 30 de junio y evita recargos.',
    serviceSlug: 'irpf',
    validFrom: '2026-04-01',
    validTo  : '2026-06-30',
  },

  // ── Arraigo social — documentación ──
  {
    id      : 'arraigo-social-empadronamiento',
    text    : 'Para el arraigo social necesitas empadronamiento continuo de 2 años. Solicítalo en tu ayuntamiento cuanto antes.',
    serviceSlug: 'arraigo-social',
  },

  // ── Renovación residencia — plazo ──
  {
    id      : 'renovacion-residencia-plazo',
    text    : 'Puedes solicitar la renovación de residencia hasta 60 días antes de que caduque tu tarjeta. No esperes al último momento.',
    serviceSlug: 'renovacion-residencia',
  },

  // ── Autonomo — alta ──
  {
    id      : 'alta-autonomo-cotizacion',
    text    : 'En 2025 la cuota de autónomos depende de tus rendimientos netos reales. El primer año tienes tarifa plana de 80 €/mes.',
    serviceSlug: 'alta-autonomo',
  },

  // ── Genérico bienvenida ──
  {
    id  : 'bienvenida-kia',
    text: 'Soy Kia, tu asistente de EXPERT. Puedo ayudarte a saber si tu caso es viable antes de que contrates cualquier servicio.',
  },
];

export function getActiveTips(serviceSlug?: string, date = new Date()): KiaTip[] {
  const today = date.toISOString().slice(0, 10);
  return kiaContextualTips.filter((tip) => {
    if (serviceSlug && tip.serviceSlug && tip.serviceSlug !== serviceSlug) return false;
    if (tip.validFrom && today < tip.validFrom) return false;
    if (tip.validTo   && today > tip.validTo)   return false;
    return true;
  });
}
