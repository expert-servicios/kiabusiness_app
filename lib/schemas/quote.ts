import { z } from 'zod';

export const quoteSchema = z.object({
  leadId: z.string().uuid(),
  title: z.string().min(3),
  description: z.string().min(10),
  totalAmount: z.number().positive(),
  currency: z.literal('EUR'),
  expiresAt: z.string().datetime()
});

export type QuoteInput = z.infer<typeof quoteSchema>;
