-- Candidate current-schema baseline for issue #143.
-- 41 portable public triggers at snapshot gate 20260911174615.
-- Two outbound-network triggers are isolated under environment-bound/.

CREATE TRIGGER trg_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_admin_users_updated_at();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER campaign_sends_guard_lead_marketing BEFORE INSERT OR UPDATE OF recipient_email, campaign_id ON campaign_sends FOR EACH ROW EXECUTE FUNCTION enforce_lead_campaign_marketing_status();
CREATE TRIGGER cases_inherit_quote_company BEFORE INSERT OR UPDATE OF quote_id, company_id ON cases FOR EACH ROW EXECUTE FUNCTION inherit_quote_company_id();
CREATE TRIGGER checkout_subscription_admin_followup AFTER INSERT OR UPDATE OF status ON checkout_sessions FOR EACH ROW EXECUTE FUNCTION sync_checkout_subscription_admin_followup();
CREATE TRIGGER trg_checkout_sessions_sync_subscription_claim AFTER UPDATE OF status ON checkout_sessions FOR EACH ROW EXECUTE FUNCTION sync_subscription_checkout_claim_status();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON client_portal_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER handle_client_service_requests_updated_at BEFORE UPDATE ON client_service_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_companies_updated_at();
CREATE TRIGGER trg_connector_instances_updated_at BEFORE UPDATE ON connector_instances FOR EACH ROW EXECUTE FUNCTION update_connector_instances_updated_at();
CREATE TRIGGER trg_email_queue_updated_at BEFORE UPDATE ON email_queue FOR EACH ROW EXECUTE FUNCTION set_email_queue_updated_at();
CREATE TRIGGER handle_express_consultations_updated_at BEFORE UPDATE ON express_consultations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER handle_files_updated_at BEFORE UPDATE ON files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER fiscal_obligations_updated_at BEFORE UPDATE ON fiscal_obligations FOR EACH ROW EXECUTE FUNCTION set_fiscal_obligations_updated_at();
CREATE TRIGGER handle_free_trial_requests_updated_at BEFORE UPDATE ON free_trial_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON implementation_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER handle_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER kia_reports_updated_at BEFORE UPDATE ON kia_reports FOR EACH ROW EXECUTE FUNCTION kia_reports_set_updated_at();
CREATE TRIGGER trg_kia_sessions_updated_at BEFORE UPDATE ON kia_sessions FOR EACH ROW EXECUTE FUNCTION set_kia_session_updated_at();
CREATE TRIGGER obligations_calendar_sync_task AFTER INSERT OR UPDATE OF status, title, kind, due_date, client_id, company_id, model_code, period_key, notes ON obligations_calendar FOR EACH ROW EXECUTE FUNCTION sync_fiscal_obligation_task();
CREATE TRIGGER orders_inherit_quote_company BEFORE INSERT OR UPDATE OF quote_id, company_id ON orders FOR EACH ROW EXECUTE FUNCTION inherit_quote_company_id();
CREATE TRIGGER trg_orders_complete_checkout_session AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION complete_checkout_session_from_order();
CREATE TRIGGER trg_orders_inherit_checkout_company BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION inherit_checkout_company_to_order();
CREATE TRIGGER update_pagos_expert_updated_at BEFORE UPDATE ON pagos_expert FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER handle_public_support_tickets_updated_at BEFORE UPDATE ON public_support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_sra_updated_at BEFORE UPDATE ON service_readiness_assessments FOR EACH ROW EXECUTE FUNCTION set_updated_at_sra();
CREATE TRIGGER handle_service_reviews_updated_at BEFORE UPDATE ON service_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER handle_site_config_updated_at BEFORE UPDATE ON site_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_entitlements_updated_at BEFORE UPDATE ON subscription_entitlements FOR EACH ROW EXECUTE FUNCTION update_entitlements_updated_at();
CREATE TRIGGER subscription_trials_updated_at_trigger BEFORE UPDATE ON subscription_trials FOR EACH ROW EXECUTE FUNCTION update_subscription_trials_updated_at();
CREATE TRIGGER link_pending_subscription_commercial_benefits_trg AFTER INSERT OR UPDATE OF client_id, company_id, updated_at ON subscriptions FOR EACH ROW EXECUTE FUNCTION link_pending_subscription_commercial_benefits();
CREATE TRIGGER subscriptions_guard_stripe_ownership BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION guard_stripe_subscription_ownership();
CREATE TRIGGER subscriptions_onboarding_admin_followup AFTER INSERT OR UPDATE OF status, post_purchase_onboarding_at ON subscriptions FOR EACH ROW EXECUTE FUNCTION sync_subscription_onboarding_admin_followup();
CREATE TRIGGER handle_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_orders_updated_at BEFORE UPDATE ON training_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON training_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON user_profiles_ext FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON user_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER handle_user_training_credits_updated_at BEFORE UPDATE ON user_training_credits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tg_usuarios_updated BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION set_updated_at();
