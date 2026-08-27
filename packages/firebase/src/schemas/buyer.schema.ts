import { z } from 'zod';

export const buyerSchema = z.object({
  id: z.string(),

  reference: z.string(),

  partyType: z.enum([
    'INDIVIDUAL',
    'JOINT_BUYERS',
    'CORPORATE',
    'TRUST',
    'OTHER',
  ]),

  identity: z.object({
    firstName: z.string().optional(),

    middleName: z.string().optional(),

    lastName: z.string().optional(),

    legalName: z.string(),

    dateOfBirth: z.string().optional(),

    nationality: z.string().optional(),

    occupation: z.string().optional(),
  }),

  contact: z.object({
    email: z.string().email().optional(),

    phone: z.string().optional(),

    alternatePhone: z.string().optional(),

    address: z.string().optional(),
  }),

  identification: z.object({
    type: z.enum([
      'NIN',
      'PASSPORT',
      'DRIVERS_LICENSE',
      'VOTERS_CARD',
      'OTHER',
    ]),

    maskedNumber: z.string().optional(),

    verificationStatus: z.enum([
      'NOT_VERIFIED',
      'PENDING',
      'VERIFIED',
      'FAILED',
      'CONFLICT',
    ]),

    verifiedAt: z.date().optional(),
  }),

  address: z
    .object({
      country: z.string().optional(),

      state: z.string().optional(),

      lga: z.string().optional(),

      city: z.string().optional(),

      addressLine: z.string().optional(),
    })
    .optional(),

  kyc: z.object({
    status: z.enum([
      'NOT_STARTED',
      'PENDING',
      'IN_REVIEW',
      'VERIFIED',
      'REJECTED',
    ]),

    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),

    verifiedAt: z.date().optional(),

    verifiedBy: z.string().optional(),
  }),

  source: z
    .object({
      channel: z.enum([
        'DIRECT',
        'AGENT',
        'REFERRAL',
        'WEBSITE',
        'WALK_IN',
        'OTHER',
      ]),

      agentId: z.string().optional(),

      referralId: z.string().optional(),
    })
    .optional(),

  status: z.enum(['PROSPECT', 'ACTIVE', 'BUYER', 'SUSPENDED', 'ARCHIVED']),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Buyer = z.infer<typeof buyerSchema>;
