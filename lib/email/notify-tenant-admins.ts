import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { tenantAdminDocUploaded, tenantAdminStatusChanged, type TenantBrand } from '@/lib/email/templates';
import { getPublicAppUrl } from '@/lib/utils/app-url';

async function getTenantAdminEmails(
  tenantId: string
): Promise<Array<{ email: string; name: string }>> {
  const admin = getSupabaseAdmin();
  const { data: admins } = await admin
    .from('profiles')
    .select('id, full_name')
    .eq('tenant_id', tenantId)
    .eq('role', 'tenant_admin');

  if (!admins?.length) return [];

  const results: Array<{ email: string; name: string }> = [];
  for (const a of admins) {
    const { data: authUser } = await admin.auth.admin.getUserById(a.id);
    const email = authUser?.user?.email;
    if (email) results.push({ email, name: a.full_name ?? email });
  }
  return results;
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

    await Promise.all(
      recipients.map(({ email, name }) => {
        const tpl = tenantAdminDocUploaded({ adminName: name, clientName, service, docName, portalUrl }, brand);
        return sendEmail({ to: email, eventType: 'tenant.doc_uploaded', ...tpl });
      })
    );
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

    await Promise.all(
      recipients.map(({ email, name }) => {
        const tpl = tenantAdminStatusChanged({ adminName: name, clientName, service, statusLabel, portalUrl }, brand);
        return sendEmail({ to: email, eventType: `tenant.case_status.${newStatus}`, ...tpl });
      })
    );
  } catch (err) {
    console.error('[notifyTenantAdminStatusChanged]', err);
  }
}
