'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leadSchema, type LeadInput } from '@/lib/schemas/lead';

export function LeadForm() {
  const form = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      clientType: 'persona_fisica',
      category: '',
      service: '',
      country: 'España',
      urgency: 'media',
      message: '',
      state: 'new'
    }
  });

  return (
    <form className="grid gap-4 rounded-2xl bg-white p-6 shadow">
      <input placeholder="Nombre" {...form.register('name')} className="rounded border p-2" />
      <input placeholder="Email" {...form.register('email')} className="rounded border p-2" />
      <textarea placeholder="Mensaje" {...form.register('message')} className="rounded border p-2" />
      <button type="submit" className="rounded bg-brand-gold px-4 py-2 text-brand-navy">Enviar</button>
    </form>
  );
}
