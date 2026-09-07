'use client';

import { useEffect, useState } from 'react';

type TeamMember = { id: string; email: string; full_name: string | null; role: string };

const STAFF_ROLES = new Set(['owner', 'admin', 'tenant_admin']);

let cachedMembers: TeamMember[] | null = null;

async function loadStaffMembers(): Promise<TeamMember[]> {
  if (cachedMembers) return cachedMembers;
  const res = await fetch('/api/admin/team', { cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  const members = (json.members ?? []) as TeamMember[];
  cachedMembers = members.filter((m) => STAFF_ROLES.has(m.role));
  return cachedMembers;
}

export default function StaffAssigneeSelect({
  value,
  onChange,
  disabled,
  className,
}: {
  value: string | null;
  onChange: (assigneeId: string | null) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [members, setMembers] = useState<TeamMember[]>(cachedMembers ?? []);

  useEffect(() => {
    let active = true;
    void loadStaffMembers().then((list) => { if (active) setMembers(list); });
    return () => { active = false; };
  }, []);

  return (
    <select
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value || null)}
      className={className ?? 'rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm'}
    >
      <option value="">Sin asignar</option>
      {members.map((m) => (
        <option key={m.id} value={m.id}>{m.full_name ?? m.email}</option>
      ))}
    </select>
  );
}
