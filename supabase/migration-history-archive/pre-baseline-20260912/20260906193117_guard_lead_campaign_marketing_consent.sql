create or replace function public.enforce_lead_campaign_marketing_status()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_segment text;
  v_allowed boolean;
begin
  select c.segment into v_segment
  from public.campaigns c
  where c.id = new.campaign_id;

  if v_segment = 'leads' then
    select exists (
      select 1
      from public.leads l
      where lower(trim(l.email)) = lower(trim(new.recipient_email))
        and l.marketing_status = 'consented'
    ) into v_allowed;

    if not coalesce(v_allowed, false) then
      raise exception 'Recipient is not consented for lead marketing campaigns';
    end if;
  end if;

  return new;
end;
$function$;

revoke all on function public.enforce_lead_campaign_marketing_status() from public;
grant execute on function public.enforce_lead_campaign_marketing_status() to service_role;

drop trigger if exists campaign_sends_guard_lead_marketing on public.campaign_sends;
create trigger campaign_sends_guard_lead_marketing
before insert or update of recipient_email, campaign_id
on public.campaign_sends
for each row
execute function public.enforce_lead_campaign_marketing_status();
