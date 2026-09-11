-- Environment-bound production triggers captured for issue #143.
-- DO NOT activate these in a disposable/fresh branch while their target
-- functions still hardcode the production Supabase project URL.

CREATE TRIGGER on_new_service_request_notify
AFTER INSERT ON public.client_service_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_service_request();

CREATE TRIGGER on_new_contact_request
AFTER INSERT ON public.contact_requests
FOR EACH ROW EXECUTE FUNCTION public.handle_new_contact_request();
