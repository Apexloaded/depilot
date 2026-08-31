import { z } from 'zod';

export const estateVerificationSchema = z.object({
  status: z.enum(['UNVERIFIED', 'PARTIALLY_VERIFIED', 'VERIFIED', 'DISPUTED']),
  lastVerifiedAt: z.date().optional(),
  verifiedBy: z.string().optional(),
  verificationSource: z.string().optional(),
});

export type EstateVerification = z.infer<typeof estateVerificationSchema>;
