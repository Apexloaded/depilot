import { z } from 'zod';

export const landInformationSchema = z.object({
  landSize: z
    .object({
      value: z.number().positive(),
      unit: z.enum(['SQM', 'HECTARE', 'ACRE']),
    })
    .optional(),
  landUse: z.string().optional(),
  titleType: z
    .enum([
      'C_OF_O',
      'GOVERNOR_CONSENT',
      'DEED_OF_ASSIGNMENT',
      'SURVEY',
      'EXCISION',
      'GAZETTE',
      'OTHER',
    ])
    .optional(),
  titleReference: z.string().optional(),
});

export type LandInformation = z.infer<typeof landInformationSchema>;
