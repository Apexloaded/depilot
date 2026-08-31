import { firestore } from '../../config/firebase.config.js';
import { estateSchema, type Estate } from '../../collections/estates/schemas/index.js';

const estateSeedData: Estate[] = [
  {
    id: 'estate-greenview-001',
    name: 'Greenview Gardens',
    developer: {
      id: 'developer-greenview',
      name: 'Greenview Developments Ltd',
    },
    price: 50_000_000,
    status: 'ACTIVE',
    location: {
      state: 'Lagos',
      lga: 'Epe',
      city: 'Epe',
      locality: 'Ibeju-Lekki',
      address: 'Along Lekki-Epe Expressway, Ibeju-Lekki, Lagos',
      coordinates: {
        latitude: 6.4667,
        longitude: 3.7333,
      },
    },
    landInformation: {
      landSize: {
        value: 12.5,
        unit: 'HECTARE',
      },
      landUse: 'Residential',
      titleType: 'GOVERNOR_CONSENT',
      titleReference: 'LAG/GRANT/2024/001',
    },
    development: {
      totalPlots: 240,
      blocks: ['A', 'B', 'C', 'D'],
      phases: ['Phase 1', 'Phase 2'],
      infrastructureStatus: 'IN_PROGRESS',
    },
    verification: {
      status: 'VERIFIED',
      lastVerifiedAt: new Date('2026-01-15T09:00:00.000Z'),
      verifiedBy: 'land-verification-team',
      verificationSource: 'Lagos State Land Registry',
    },
    createdAt: new Date('2026-01-10T09:00:00.000Z'),
    updatedAt: new Date('2026-01-15T09:00:00.000Z'),
  },
  {
    id: 'estate-hillcrest-002',
    name: 'Hillcrest Terraces',
    developer: {
      id: 'developer-hillcrest',
      name: 'Hillcrest Property Group',
    },
    price: 20_000_000,
    status: 'PLANNING',
    location: {
      state: 'FCT',
      lga: 'Kuje',
      city: 'Abuja',
      locality: 'Kuje',
      address: 'Kuje-Airport Road, Abuja',
      coordinates: {
        latitude: 8.8795,
        longitude: 7.2276,
      },
    },
    landInformation: {
      landSize: {
        value: 8,
        unit: 'HECTARE',
      },
      landUse: 'Mixed residential',
      titleType: 'C_OF_O',
      titleReference: 'FCT/KN/2025/118',
    },
    development: {
      totalPlots: 128,
      blocks: ['A', 'B'],
      phases: ['Initial development'],
      infrastructureStatus: 'NOT_STARTED',
    },
    verification: {
      status: 'PARTIALLY_VERIFIED',
      lastVerifiedAt: new Date('2026-02-03T10:30:00.000Z'),
      verifiedBy: 'land-verification-team',
      verificationSource: 'FCT Geographic Information Systems',
    },
    createdAt: new Date('2026-02-01T10:30:00.000Z'),
    updatedAt: new Date('2026-02-03T10:30:00.000Z'),
  },
];

export async function seedEstates() {
  const batch = firestore.batch();

  for (const estate of estateSeedData) {
    const validatedEstate = estateSchema.parse(estate);
    const estateReference = firestore.collection('estates').doc(estate.id);

    batch.set(estateReference, validatedEstate);
  }

  await batch.commit();
  console.log(`Seeded ${estateSeedData.length} estate(s).`);
}
