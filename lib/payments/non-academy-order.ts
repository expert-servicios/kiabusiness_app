export type OrderInsertError = { message?: string | null } | null | undefined;

export function legacyOrderFields(amountEur: number, packName?: string | null) {
  return {
    amount: amountEur,
    pack_name: packName?.trim() || 'Servicio EXPERT',
  };
}

export function requireCreatedOrderId(
  context: 'quote' | 'catalog',
  error: OrderInsertError,
  orderId?: string | null,
): string {
  if (error) {
    throw new Error(
      `[stripe webhook] ${context} order insert failed: ${error.message ?? 'unknown database error'}`,
    );
  }

  if (!orderId) {
    throw new Error(`[stripe webhook] ${context} order insert returned no id`);
  }

  return orderId;
}
