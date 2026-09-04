-- Atomic claim guarding the first Holded contact creation for a company.
-- No existing mappings, contacts, invoices or financial rows are modified.

create table if not exists public.holded_contact_creation_claims (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  owner_token uuid not null,
  state text not null default 'claimed' check (state in ('claimed','creating','completed','released','manual_review')),
  holded_contact_id text null,
  lease_expires_at timestamptz not null default (now() + interval '2 minutes'),
  last_error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists holded_contact_creation_claims_active_company_uidx
  on public.holded_contact_creation_claims(company_id)
  where state in ('claimed','creating','completed','manual_review');

alter table public.holded_contact_creation_claims enable row level security;
revoke all on table public.holded_contact_creation_claims from public, anon, authenticated;
grant all on table public.holded_contact_creation_claims to service_role;

create or replace function public.claim_holded_contact_creation(
  p_company_id uuid,
  p_owner_token uuid,
  p_lease_seconds integer default 120
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.holded_contact_creation_claims%rowtype;
  v_lease interval;
begin
  if p_company_id is null or p_owner_token is null then
    raise exception 'invalid Holded contact claim arguments';
  end if;
  v_lease := make_interval(secs => greatest(30, least(coalesce(p_lease_seconds,120),600)));

  begin
    insert into public.holded_contact_creation_claims(company_id,owner_token,state,lease_expires_at)
    values(p_company_id,p_owner_token,'claimed',now()+v_lease)
    returning * into v_row;
    return jsonb_build_object('acquired',true,'claim_id',v_row.id,'state',v_row.state,'holded_contact_id',v_row.holded_contact_id);
  exception when unique_violation then null; end;

  select * into v_row
    from public.holded_contact_creation_claims
   where company_id=p_company_id
     and state in ('claimed','creating','completed','manual_review')
   order by created_at desc limit 1 for update;

  if not found then return jsonb_build_object('acquired',false,'state','retry'); end if;

  -- Only a pre-POST claim can be leased to a new worker. `creating` is never
  -- auto-reclaimed because the remote POST may already have succeeded.
  if v_row.state='claimed' and v_row.lease_expires_at <= now() then
    update public.holded_contact_creation_claims
       set owner_token=p_owner_token, lease_expires_at=now()+v_lease, updated_at=now(), last_error=null
     where id=v_row.id returning * into v_row;
    return jsonb_build_object('acquired',true,'claim_id',v_row.id,'state',v_row.state,'holded_contact_id',v_row.holded_contact_id);
  end if;

  return jsonb_build_object('acquired',false,'claim_id',v_row.id,'state',v_row.state,'holded_contact_id',v_row.holded_contact_id);
end;
$$;

create or replace function public.mark_holded_contact_creation_started(p_claim_id uuid,p_owner_token uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  update public.holded_contact_creation_claims
     set state='creating', lease_expires_at=now(), updated_at=now()
   where id=p_claim_id and owner_token=p_owner_token and state='claimed';
  if not found then raise exception 'Holded contact claim ownership lost'; end if;
end;
$$;

create or replace function public.complete_holded_contact_creation(p_claim_id uuid,p_owner_token uuid,p_holded_contact_id text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  update public.holded_contact_creation_claims
     set state='completed', holded_contact_id=p_holded_contact_id, updated_at=now(), last_error=null
   where id=p_claim_id and owner_token=p_owner_token and state='creating';
  if not found then raise exception 'Holded contact claim ownership lost'; end if;
end;
$$;

create or replace function public.release_holded_contact_creation_claim(p_claim_id uuid,p_owner_token uuid,p_error text default null)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  update public.holded_contact_creation_claims
     set state='released', lease_expires_at=now(), updated_at=now(), last_error=left(p_error,500)
   where id=p_claim_id and owner_token=p_owner_token and state='claimed';
  if not found then raise exception 'Holded contact claim ownership lost'; end if;
end;
$$;

create or replace function public.flag_holded_contact_creation_review(p_claim_id uuid,p_owner_token uuid,p_error text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  update public.holded_contact_creation_claims
     set state='manual_review', lease_expires_at=now(), updated_at=now(), last_error=left(p_error,500)
   where id=p_claim_id and owner_token=p_owner_token and state in ('claimed','creating');
  if not found then raise exception 'Holded contact claim ownership lost'; end if;
end;
$$;

revoke all on function public.claim_holded_contact_creation(uuid,uuid,integer) from public,anon,authenticated;
revoke all on function public.mark_holded_contact_creation_started(uuid,uuid) from public,anon,authenticated;
revoke all on function public.complete_holded_contact_creation(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.release_holded_contact_creation_claim(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.flag_holded_contact_creation_review(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.claim_holded_contact_creation(uuid,uuid,integer) to service_role;
grant execute on function public.mark_holded_contact_creation_started(uuid,uuid) to service_role;
grant execute on function public.complete_holded_contact_creation(uuid,uuid,text) to service_role;
grant execute on function public.release_holded_contact_creation_claim(uuid,uuid,text) to service_role;
grant execute on function public.flag_holded_contact_creation_review(uuid,uuid,text) to service_role;
