type RpcClient = {
  rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{
    data: Array<Record<string, unknown>> | Record<string, unknown> | null;
    error: { message: string; code?: string } | null;
  }>;
};

export type AcademyFulfillmentResult = {
  orderId: string;
  enrollmentId?: string;
  created: boolean;
};

function firstRow(data: Array<Record<string, unknown>> | Record<string, unknown> | null) {
  return Array.isArray(data) ? data[0] : data;
}

async function requiredRpc(client: RpcClient, name: string, args: Record<string, unknown>) {
  const { data, error } = await client.rpc(name, args);
  if (error) throw new Error(`${name} failed: ${error.message}`);
  const row = firstRow(data);
  if (!row) throw new Error(`${name} returned no result`);
  return row;
}

export async function persistAcademyProgramPayment(client: RpcClient, input: {
  paymentId: string; sessionId: string; clientId: string | null; customerEmail: string | null;
  programSlug: string; programName: string; amountEur: number; currency: string;
}): Promise<AcademyFulfillmentResult> {
  const row = await requiredRpc(client, 'fulfill_academy_program_payment', {
    p_payment_id: input.paymentId, p_session_id: input.sessionId, p_client_id: input.clientId,
    p_customer_email: input.customerEmail, p_program_slug: input.programSlug,
    p_program_name: input.programName, p_amount_eur: input.amountEur, p_currency: input.currency,
  });
  return { orderId: String(row.order_id), enrollmentId: row.enrollment_id ? String(row.enrollment_id) : undefined, created: row.created === true };
}

export async function persistAcademyCertificationPayment(client: RpcClient, input: {
  paymentId: string; sessionId: string; enrollmentId: string; clientId: string | null;
  customerEmail: string | null; programSlug: string; amountEur: number; currency: string;
}): Promise<AcademyFulfillmentResult> {
  const row = await requiredRpc(client, 'fulfill_academy_certification_payment', {
    p_payment_id: input.paymentId, p_session_id: input.sessionId, p_enrollment_id: input.enrollmentId,
    p_client_id: input.clientId, p_customer_email: input.customerEmail, p_program_slug: input.programSlug,
    p_amount_eur: input.amountEur, p_currency: input.currency,
  });
  return { orderId: String(row.order_id), created: row.created === true };
}

export async function linkAcademyOrderToClient(client: RpcClient, orderId: string, clientId: string) {
  const row = await requiredRpc(client, 'link_academy_order', { p_order_id: orderId, p_client_id: clientId });
  return { enrollmentId: String(row.enrollment_id), created: row.created === true };
}
