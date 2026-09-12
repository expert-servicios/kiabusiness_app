alter view public.v_servicios_con_pagos
set (security_invoker = true);

revoke all privileges
on table public.v_servicios_con_pagos
from public, anon, authenticated, service_role;

grant select
on table public.v_servicios_con_pagos
to authenticated, service_role;
