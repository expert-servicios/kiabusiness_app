import { z } from 'zod';

export const leadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  clientType: z.enum(['persona_fisica', 'autonomo', 'empresa']),
  category: z.string().min(2),
  service: z.string().min(2),
  country: z.string().min(2),
  urgency: z.enum(['baja', 'media', 'alta', 'urgente']),
  message: z.string().min(10),
  state: z.enum(['new', 'contacted', 'quoted', 'converted']).optional()
});

export type LeadInput = z.infer<typeof leadSchema>;
