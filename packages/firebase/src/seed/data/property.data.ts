import { firestore } from '../../config/firebase.config';
import { propertySchema, type Property } from '../../schemas/property.schema';

const propertySeedData: Property[] = [
  {
    id: 'property-greenview-a-001',
    reference: 'PROP-EST-LAG-0001-A001',
    estateId: 'estate-greenview-001',
    type: 'PLOT',
    status: 'AVAILABLE',
    identification: {
      block: 'A',
      plotNumber: '001',
      phase: 'Phase 1',
      internalReference: 'GV-A-001',
    },
    physical: {
      size: {
        value: 500,
        unit: 'SQM',
      },
      frontage: 20,
      depth: 25,
      dimensions: '20m x 25m',
      coordinates: {
        latitude: 6.4671,
        longitude: 3.7338,
      },
    },
    pricing: {
      askingPrice: 25000000,
      currency: 'NGN',
      pricePerUnit: 50000,
      pricingVersion: 1,
      effectiveFrom: new Date('2026-01-10T09:00:00.000Z'),
    },
    ownership: {
      currentHolderType: 'DEVELOPER',
      currentHolderId: 'developer-greenview',
      ownershipStatus: 'DEVELOPER_HELD',
    },
    verification: {
      identityStatus: 'VERIFIED',
      verifiedIdentifiers: ['GV-A-001', 'SURV-GV-A-001'],
      lastVerifiedAt: new Date('2026-01-15T09:00:00.000Z'),
    },
    createdAt: new Date('2026-01-10T09:00:00.000Z'),
    updatedAt: new Date('2026-01-15T09:00:00.000Z'),
  },
  {
    id: 'property-hillcrest-a-001',
    reference: 'PROP-EST-ABJ-0001-A001',
    estateId: 'estate-hillcrest-002',
    type: 'PLOT',
    status: 'RESERVED',
    identification: {
      block: 'A',
      plotNumber: '001',
      phase: 'Initial development',
      internalReference: 'HT-A-001',
    },
    physical: {
      size: {
        value: 450,
        unit: 'SQM',
      },
      frontage: 18,
      depth: 25,
      dimensions: '18m x 25m',
      coordinates: {
        latitude: 8.8799,
        longitude: 7.2281,
      },
    },
    pricing: {
      askingPrice: 18000000,
      currency: 'NGN',
      pricePerUnit: 40000,
      pricingVersion: 1,
      effectiveFrom: new Date('2026-02-01T10:30:00.000Z'),
    },
    ownership: {
      currentHolderType: 'DEVELOPER',
      currentHolderId: 'developer-hillcrest',
      ownershipStatus: 'DEVELOPER_HELD',
    },
    verification: {
      identityStatus: 'UNVERIFIED',
    },
    createdAt: new Date('2026-02-01T10:30:00.000Z'),
    updatedAt: new Date('2026-02-01T10:30:00.000Z'),
  },
];

export async function seedProperties() {
  const batch = firestore.batch();

  for (const property of propertySeedData) {
    const validatedProperty = propertySchema.parse(property);
    const propertyReference = firestore.collection('properties').doc(property.id);

    batch.set(propertyReference, validatedProperty);
  }

  await batch.commit();
  console.log(`Seeded ${propertySeedData.length} propert(ies).`);
}
