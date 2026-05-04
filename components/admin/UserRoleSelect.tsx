'use client';

import { useState } from 'react';

interface Props {
  userId: string;
  currentRole: string;
}

export function UserRoleSelect({ userId, currentRole }: Props) {
  const [role, setRole] = useState(currentRole);
  const [saving, setSaving] = useState(false);

  const handleChange = async (newRole: string) => {
    if (newRole === role) return;
    setSaving(true);
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      });
      setRole(newRole);
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      value={role}
      onChange={(e) => handleChange(e.target.value)}
      disabled={saving}
      className={`rounded-full px-3 py-1 text-xs font-semibold outline-none transition disabled:opacity-60 ${
        role === 'admin'
          ? 'bg-[#07111d] text-white'
          : 'bg-[#d7a33a]/10 text-[#07111d]'
      }`}
    >
      <option value="client">Cliente</option>
      <option value="admin">Admin</option>
    </select>
  );
}
