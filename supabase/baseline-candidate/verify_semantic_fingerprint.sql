-- #143 semantic schema fingerprint
--
-- Hard-gate intent:
--   * compare logical/current schema state across independently-created Supabase projects;
--   * never compare internal PostgreSQL OIDs;
--   * ignore column ordinal order;
--   * ignore extension-owned functions/types (extension presence is checked separately);
--   * exclude app.assign_master_admin() from portable function parity because the current
--     production body embeds an environment-specific identity and has no active trigger.
--
-- function_source_hash_advisory is intentionally NOT a hard gate: PostgreSQL preserves
-- comments/formatting in prosrc and semantically equivalent bodies may hash differently.

with target_schemas(schema_name) as (
  values ('public'::text), ('app'::text)
),
rels as (
  select n.nspname as schema_name,
         c.oid,
         c.relowner,
         c.relname,
         c.relkind::text as relkind,
         pg_get_userbyid(c.relowner) as owner_name,
         c.relrowsecurity,
         c.relforcerowsecurity,
         coalesce(array_to_string(c.reloptions, ','), '') as reloptions
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join target_schemas s on s.schema_name = n.nspname
  where c.relkind in ('r', 'p', 'v', 'm', 'S')
),
cols as (
  select n.nspname as schema_name,
         c.relname,
         a.attname,
         pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
         a.attnotnull,
         coalesce(pg_get_expr(ad.adbin, ad.adrelid), '') as default_expr,
         a.attidentity::text as identity_kind,
         a.attgenerated::text as generated_kind
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join target_schemas s on s.schema_name = n.nspname
  join pg_attribute a
    on a.attrelid = c.oid
   and a.attnum > 0
   and not a.attisdropped
  left join pg_attrdef ad
    on ad.adrelid = c.oid
   and ad.adnum = a.attnum
  where c.relkind in ('r', 'p')
),
cons as (
  select n.nspname as schema_name,
         c.relname,
         con.conname,
         con.contype::text as contype,
         pg_get_constraintdef(con.oid, true) as definition
  from pg_constraint con
  join pg_class c on c.oid = con.conrelid
  join pg_namespace n on n.oid = c.relnamespace
  join target_schemas s on s.schema_name = n.nspname
),
idx as (
  select schemaname as schema_name, tablename, indexname, indexdef
  from pg_indexes
  where schemaname in ('public', 'app')
),
pol as (
  select schemaname as schema_name,
         tablename,
         policyname,
         permissive,
         cmd,
         array_to_string(roles, ',') as roles_s,
         coalesce(qual, '') as qual,
         coalesce(with_check, '') as with_check
  from pg_policies
  where schemaname in ('public', 'app')
),
tr as (
  select n.nspname as schema_name,
         c.relname as table_name,
         t.tgname,
         t.tgenabled::text as enabled,
         regexp_replace(pg_get_triggerdef(t.oid, true), '[[:space:]]+', ' ', 'g') as definition
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  join target_schemas s on s.schema_name = n.nspname
  where not t.tgisinternal
),
views as (
  select n.nspname as schema_name,
         c.relname,
         coalesce(array_to_string(c.reloptions, ','), '') as options,
         regexp_replace(pg_get_viewdef(c.oid, true), '[[:space:]]+', ' ', 'g') as definition
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join target_schemas s on s.schema_name = n.nspname
  where c.relkind = 'v'
),
seqs as (
  select n.nspname as schema_name,
         c.relname,
         ps.seqstart,
         ps.seqincrement,
         ps.seqmax,
         ps.seqmin,
         ps.seqcache,
         ps.seqcycle
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join target_schemas s on s.schema_name = n.nspname
  join pg_sequence ps on ps.seqrelid = c.oid
),
types as (
  select n.nspname as schema_name,
         t.typname,
         t.typtype::text as typtype,
         case
           when t.typtype = 'e' then coalesce((
             select string_agg(e.enumlabel, ',' order by e.enumsortorder)
             from pg_enum e
             where e.enumtypid = t.oid
           ), '')
           when t.typtype = 'd' then
             pg_catalog.format_type(t.typbasetype, t.typtypmod)
             || '|' || t.typnotnull::text
             || '|' || coalesce(t.typdefault, '')
           else ''
         end as definition
  from pg_type t
  join pg_namespace n on n.oid = t.typnamespace
  join target_schemas s on s.schema_name = n.nspname
  where t.typtype in ('e', 'd')
    and not exists (
      select 1
      from pg_depend d
      join pg_extension e on e.oid = d.refobjid
      where d.classid = 'pg_type'::regclass
        and d.objid = t.oid
        and d.deptype = 'e'
    )
),
funcs0 as (
  select n.nspname as schema_name,
         p.oid,
         p.proowner,
         p.proacl,
         p.proname,
         pg_get_function_identity_arguments(p.oid) as args,
         pg_get_function_result(p.oid) as result_type,
         l.lanname as language_name,
         p.prosecdef,
         p.provolatile::text as volatility,
         p.proparallel::text as parallel_mode,
         p.proleakproof,
         p.proisstrict,
         p.procost,
         p.prorows,
         coalesce(array_to_string(p.proconfig, ','), '') as proconfig,
         regexp_replace(
           regexp_replace(p.prosrc, '--[^\n\r]*', '', 'g'),
           '[[:space:]]+', ' ', 'g'
         ) as normalized_source,
         pg_get_userbyid(p.proowner) as owner_name
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join target_schemas s on s.schema_name = n.nspname
  join pg_language l on l.oid = p.prolang
  where not exists (
    select 1
    from pg_depend d
    join pg_extension e on e.oid = d.refobjid
    where d.classid = 'pg_proc'::regclass
      and d.objid = p.oid
      and d.deptype = 'e'
  )
),
funcs as (
  select *
  from funcs0
  where not (
    schema_name = 'app'
    and proname = 'assign_master_admin'
    and args = ''
  )
),
rel_acl as (
  select r.schema_name,
         r.relname,
         r.relkind,
         pg_get_userbyid((a).grantor) as grantor,
         case when (a).grantee = 0 then 'PUBLIC' else pg_get_userbyid((a).grantee) end as grantee,
         (a).privilege_type as privilege_type,
         (a).is_grantable as is_grantable
  from rels r,
       lateral aclexplode(
         coalesce(
           (select c.relacl from pg_class c where c.oid = r.oid),
           acldefault(case when r.relkind = 'S' then 'S'::"char" else 'r'::"char" end, r.relowner)
         )
       ) a
),
func_acl as (
  select f.schema_name,
         f.proname,
         f.args,
         pg_get_userbyid((a).grantor) as grantor,
         case when (a).grantee = 0 then 'PUBLIC' else pg_get_userbyid((a).grantee) end as grantee,
         (a).privilege_type as privilege_type,
         (a).is_grantable as is_grantable
  from funcs f,
       lateral aclexplode(coalesce(f.proacl, acldefault('f', f.proowner))) a
),
schema_acl as (
  select n.nspname as schema_name,
         pg_get_userbyid((a).grantor) as grantor,
         case when (a).grantee = 0 then 'PUBLIC' else pg_get_userbyid((a).grantee) end as grantee,
         (a).privilege_type as privilege_type,
         (a).is_grantable as is_grantable
  from pg_namespace n
  join target_schemas s on s.schema_name = n.nspname,
       lateral aclexplode(coalesce(n.nspacl, acldefault('n', n.nspowner))) a
)
select
  s.schema_name,

  (select count(*) from rels r where r.schema_name = s.schema_name) as relation_count,
  (select md5(string_agg(relname || '|' || relkind || '|' || owner_name, E'\n' order by relname, relkind))
     from rels r where r.schema_name = s.schema_name) as relation_hash,

  (select count(*) from cols c where c.schema_name = s.schema_name) as column_count,
  (select md5(string_agg(relname || '|' || attname || '|' || data_type || '|' || attnotnull::text || '|' || default_expr || '|' || identity_kind || '|' || generated_kind, E'\n' order by relname, attname))
     from cols c where c.schema_name = s.schema_name) as column_hash,

  (select count(*) from cons c where c.schema_name = s.schema_name) as constraint_count,
  (select md5(string_agg(relname || '|' || conname || '|' || contype || '|' || definition, E'\n' order by relname, conname))
     from cons c where c.schema_name = s.schema_name) as constraint_hash,

  (select count(*) from idx i where i.schema_name = s.schema_name) as index_count,
  (select md5(string_agg(tablename || '|' || indexname || '|' || indexdef, E'\n' order by tablename, indexname))
     from idx i where i.schema_name = s.schema_name) as index_hash,

  (select count(*) from rels r where r.schema_name = s.schema_name and relkind in ('r', 'p') and relrowsecurity) as rls_enabled_count,
  (select md5(string_agg(relname || '|' || relrowsecurity::text || '|' || relforcerowsecurity::text, E'\n' order by relname))
     from rels r where r.schema_name = s.schema_name and relkind in ('r', 'p')) as rls_flags_hash,

  (select count(*) from pol p where p.schema_name = s.schema_name) as policy_count,
  (select md5(string_agg(tablename || '|' || policyname || '|' || permissive || '|' || cmd || '|' || roles_s || '|' || qual || '|' || with_check, E'\n' order by tablename, policyname))
     from pol p where p.schema_name = s.schema_name) as policy_hash,

  (select count(*) from tr t where t.schema_name = s.schema_name) as trigger_count,
  (select md5(string_agg(table_name || '|' || tgname || '|' || enabled || '|' || definition, E'\n' order by table_name, tgname))
     from tr t where t.schema_name = s.schema_name) as trigger_hash,

  (select count(*) from views v where v.schema_name = s.schema_name) as view_count,
  (select md5(string_agg(relname || '|' || options || '|' || definition, E'\n' order by relname))
     from views v where v.schema_name = s.schema_name) as view_hash,

  (select count(*) from seqs q where q.schema_name = s.schema_name) as sequence_count,
  (select md5(string_agg(relname || '|' || seqstart || '|' || seqincrement || '|' || seqmax || '|' || seqmin || '|' || seqcache || '|' || seqcycle::text, E'\n' order by relname))
     from seqs q where q.schema_name = s.schema_name) as sequence_hash,

  (select count(*) from types y where y.schema_name = s.schema_name) as portable_type_count,
  (select md5(string_agg(typname || '|' || typtype || '|' || definition, E'\n' order by typname))
     from types y where y.schema_name = s.schema_name) as portable_type_hash,

  (select count(*) from funcs f where f.schema_name = s.schema_name) as portable_function_count,
  (select md5(string_agg(
       proname || '(' || args || ')|' || result_type || '|' || language_name || '|'
       || prosecdef::text || '|' || volatility || '|' || parallel_mode || '|'
       || proleakproof::text || '|' || proisstrict::text || '|'
       || procost || '|' || prorows || '|' || proconfig || '|' || owner_name,
       E'\n' order by proname, args
     )) from funcs f where f.schema_name = s.schema_name) as function_contract_hash,
  (select md5(string_agg(proname || '(' || args || ')|' || normalized_source, E'\n' order by proname, args))
     from funcs f where f.schema_name = s.schema_name) as function_source_hash_advisory,

  (select count(*) from rel_acl a where a.schema_name = s.schema_name) as relation_acl_count,
  (select md5(string_agg(relname || '|' || relkind || '|' || grantor || '|' || grantee || '|' || privilege_type || '|' || is_grantable::text, E'\n' order by relname, grantor, grantee, privilege_type, is_grantable))
     from rel_acl a where a.schema_name = s.schema_name) as relation_acl_hash,

  (select count(*) from func_acl a where a.schema_name = s.schema_name) as function_acl_count,
  (select md5(string_agg(proname || '(' || args || ')|' || grantor || '|' || grantee || '|' || privilege_type || '|' || is_grantable::text, E'\n' order by proname, args, grantor, grantee, privilege_type, is_grantable))
     from func_acl a where a.schema_name = s.schema_name) as function_acl_hash,

  (select count(*) from schema_acl a where a.schema_name = s.schema_name) as schema_acl_count,
  (select md5(string_agg(grantor || '|' || grantee || '|' || privilege_type || '|' || is_grantable::text, E'\n' order by grantor, grantee, privilege_type, is_grantable))
     from schema_acl a where a.schema_name = s.schema_name) as schema_acl_hash
from target_schemas s
order by s.schema_name;

-- Required application-level extension presence.
-- Versions are reported but intentionally not used as hard equality gates because
-- Supabase Development Branches may receive newer managed extension patch/minor versions.
select required.extname,
       required.expected_schema,
       e.extversion as installed_version,
       n.nspname as installed_schema,
       (e.oid is not null and n.nspname = required.expected_schema) as present_in_expected_schema
from (values
  ('citext'::text, 'app'::text),
  ('vector'::text, 'extensions'::text),
  ('pg_net'::text, 'extensions'::text)
) as required(extname, expected_schema)
left join pg_extension e on e.extname = required.extname
left join pg_namespace n on n.oid = e.extnamespace
order by required.extname;
