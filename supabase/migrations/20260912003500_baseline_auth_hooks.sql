-- Candidate operational bootstrap hooks for issue #143.
-- auth is a Supabase-managed schema, so these hooks are tracked separately
-- from declarative public/app/private schema state.

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER trg_handle_new_user
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.fn_handle_new_user();
