import { z } from 'zod';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => value || null);

export const saasLeadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(220),
  phone: optionalText(40),
  companyName: z.string().trim().min(2).max(180),
  clientCountRange: z.string().trim().min(1).max(80),
  currentTools: optionalText(600),
  operationalProblem: z.string().trim().min(10).max(1500),
  pilotInterest: z.string().trim().min(1).max(120),
  consent: z.literal(true),
  source: z.string().trim().max(80).optional().default('para-asesorias'),
  hp_url: z.string().optional()
});

export type SaasLeadInput = z.infer<typeof saasLeadSchema>;
