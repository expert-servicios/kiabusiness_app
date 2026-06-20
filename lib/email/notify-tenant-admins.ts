import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { enqueueEmail } from '@/lib/email/email-queue';
import { tenantAdminDocUploaded, tenantAdminStatusChanged, type TenantBrand } from '@/lib/email/templates';
import { getPublicAppUrl } from '@/lib/utils/app-url';

async function getTenantAdminEmails(
  tenantId: string
): Promise<Array<{ email: string; name: string }>> {
  const admin = getSupabaseAdmin();
  const { data: admins } = await admin
    .from('profiles')
    .select('id, full_name, email')
    .eq('tenant_id', tenantId)
    .eq('role', 'tenant_admin');

  if (!admins?.length) return [];

  return admins
    .filter((a) => a.email)
    .map((a) => ({ email: a.email as string, name: a.full_name ?? a.email }));
}

export async function notifyTenantAdminDocUploaded({
  clientId,
  clientName,
  service,
  docName,
  brand,
}: {
  clientId: string;
  clientName: string;
  service: string;
  docName: string;
  brand?: TenantBrand;
}) {
  try {
    const admin = getSupabaseAdmin();
    const { data: clientProfile } = await admin
      .from('profiles')
      .select('tenant_id')
      .eq('id', clientId)
      .single();

    if (!clientProfile?.tenant_id) return;

    const recipients = await getTenantAdminEmails(clientProfile.tenant_id);
    const portalUrl = `${getPublicAppUrl()}/tenant/expedientes`;

    for (const { email, name } of recipients) {
      const tpl = tenantAdminDocUploaded({ adminName: name, clientName, service, docName, portalUrl }, brand);
      await enqueueEmail({ to: email, eventType: 'tenant.doc_uploaded', subject: tpl.subject, html: tpl.html });
    }
  } catch (err) {
    console.error('[notifyTenantAdminDocUploaded]', err);
  }
}

export async function notifyTenantAdminStatusChanged({
  clientId,
  clientName,
  service,
  caseId,
  newStatus,
  statusLabel,
  brand,
}: {
  clientId: string;
  clientName: string;
  service: string;
  caseId: string;
  newStatus: string;
  statusLabel: string;
  brand?: TenantBrand;
}) {
  try {
    const admin = getSupabaseAdmin();
    const { data: clientProfile } = await admin
      .from('profiles')
      .select('tenant_id')
      .eq('id', clientId)
      .single();

    if (!clientProfile?.tenant_id) return;

    const recipients = await getTenantAdminEmails(clientProfile.tenant_id);
    const portalUrl = `${getPublicAppUrl()}/tenant/expedientes/${caseId}`;

    for (const { email, name } of recipients) {
      const tpl = tenantAdminStatusChanged({ adminName: name, clientName, service, statusLabel, portalUrl }, brand);
      await enqueueEmail({ to: email, eventType: `tenant.case_status.${newStatus}`, subject: tpl.subject, html: tpl.html });
    }
  } catch (err) {
    console.error('[notifyTenantAdminStatusChanged]', err);
  }
}
