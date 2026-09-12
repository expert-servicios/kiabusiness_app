-- Candidate current-schema baseline for issue #143.
-- Public ACL/grants at production snapshot gate 20260911174615.
-- Environment-bound network function grants are isolated separately.
-- Apply only after tables, views and portable functions exist.

set search_path = public, extensions, pg_temp;

-- Normalize API-role ACLs first. Object-owner ACLs are intentionally left alone.
revoke all privileges on all tables in schema public from anon, authenticated, service_role;
revoke all privileges on all sequences in schema public from anon, authenticated, service_role;
revoke execute on all functions in schema public from PUBLIC, anon, authenticated, service_role;
revoke all on schema public from anon, authenticated, service_role;

grant usage on schema public to anon, authenticated, service_role;

-- Production default relation ACL: API roles receive the standard table grant,
-- with the hardened exceptions below removed explicitly.
grant all privileges on all tables in schema public to anon, authenticated, service_role;

revoke all privileges on table
  public.activities,
  public.aeat_credentials,
  public.assets_realestate,
  public.assets_vehicles,
  public.audit_log,
  public.certificates,
  public.client_integration_secrets,
  public.companies,
  public.company_stripe_customers,
  public.customers,
  public.doc_templates,
  public.documents,
  public.establishments,
  public.holded_contact_creation_claims,
  public.invoice_lines,
  public.kia_auditor_reviews,
  public.kia_auditor_rule_results,
  public.kia_behavior_anomalies,
  public.kia_decision_logs,
  public.kia_health_check_results,
  public.kia_health_runs,
  public.lead_stripe_customers,
  public.memberships,
  public.obligations_calendar,
  public.representatives,
  public.settings,
  public.shareholders,
  public.stripe_accounts,
  public.stripe_invoice_company_attributions,
  public.stripe_processed_events,
  public.subscription_checkout_claims,
  public.users,
  public.v_invoice_documents,
  public.v_servicios_con_pagos,
  public.verifactu_queue
from anon, authenticated;

-- Authenticated-only exceptions present in production.
grant insert, select on table public.documents to authenticated;
grant select on table
  public.kia_auditor_reviews,
  public.kia_auditor_rule_results,
  public.kia_behavior_anomalies,
  public.kia_decision_logs,
  public.kia_health_check_results,
  public.kia_health_runs,
  public.lead_stripe_customers,
  public.v_servicios_con_pagos
to authenticated;

-- service_role is broad by default, with three deliberately narrower objects.
revoke all privileges on table
  public.stripe_invoice_company_attributions,
  public.v_invoice_documents,
  public.v_servicios_con_pagos
from service_role;
grant insert, select, update on table public.stripe_invoice_company_attributions to service_role;
grant select on table public.v_invoice_documents, public.v_servicios_con_pagos to service_role;

-- Four public sequences have the same API-role ACL in production.
grant all privileges on all sequences in schema public to anon, authenticated, service_role;

-- Portable public functions. These 27 signatures are executable by PUBLIC and
-- also have explicit anon/authenticated EXECUTE ACL entries in production.
grant execute on function
  public._ensure_updated_trigger(tbl regclass, trig_name text),
  public.complete_checkout_session_from_order(),
  public.fn_check_asiento_cuadrado(),
  public.guard_stripe_subscription_ownership(),
  public.inherit_checkout_company_to_order(),
  public.inherit_quote_company_id(),
  public.is_admin_or_gestor(),
  public.is_gestor(),
  public.kia_memories_search(query_embedding vector, client_id_filter uuid, lead_id_filter uuid, phone_filter text, similarity_threshold double precision, match_count integer),
  public.kia_reports_set_updated_at(),
  public.link_pending_subscription_commercial_benefits(),
  public.set_email_queue_updated_at(),
  public.set_fiscal_obligations_updated_at(),
  public.set_kia_session_updated_at(),
  public.set_updated_at(),
  public.set_updated_at_sra(),
  public.sync_checkout_subscription_admin_followup(),
  public.sync_fiscal_obligation_task(),
  public.sync_subscription_checkout_claim_status(),
  public.sync_subscription_onboarding_admin_followup(),
  public.update_admin_users_updated_at(),
  public.update_companies_updated_at(),
  public.update_connector_instances_updated_at(),
  public.update_entitlements_updated_at(),
  public.update_subscription_trials_updated_at(),
  public.update_updated_at_column(),
  public.whoami()
to PUBLIC, anon, authenticated;

-- Five RLS/helper functions are executable by authenticated API roles but not PUBLIC.
grant execute on function
  public.auth_tenant_id(),
  public.is_admin(),
  public.is_admin_email(),
  public.is_admin_user(),
  public.is_tenant_admin()
to anon, authenticated;

-- service_role can execute every portable public function.
grant execute on all functions in schema public to service_role;
