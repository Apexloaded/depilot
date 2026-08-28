import { z } from 'zod';
import { locationSchema } from '../../../schemas';

export const estateLocationSchema = locationSchema.extend({
  coordinates: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
});

export type EstateLocation = z.infer<typeof estateLocationSchema>;
