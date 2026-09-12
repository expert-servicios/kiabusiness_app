-- Candidate current-schema baseline for issue #143.
-- Bootstrap dependency prelude.
-- public.is_admin_or_gestor() is defined in the 021-030 block and requires
-- public.is_gestor() to exist at CREATE FUNCTION time because it is SQL-language.
-- The canonical definition is repeated later in the ordered portable-function set.

CREATE OR REPLACE FUNCTION public.is_gestor()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists(
    select 1 from public.usuarios u
    where u.id = auth.uid() and (u.roles ? 'gestor')
  );
$function$;
