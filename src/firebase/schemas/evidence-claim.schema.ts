import { z } from 'zod';

export const evidenceClaimSchema = z.object({
  field: z.string(),

  value: z.unknown(),

  normalizedValue: z.unknown().optional(),

  confidence: z.number().min(0).max(1),

  location: z
    .object({
      page: z.number().int().positive().optional(),

      section: z.string().optional(),

      boundingBox: z
        .object({
          x: z.number(),
          y: z.number(),
          width: z.number().positive(),
          height: z.number().positive(),
        })
        .optional(),
    })
    .optional(),
});

export type EvidenceClaim = z.infer<typeof evidenceClaimSchema>;
