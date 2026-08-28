import { firestore } from '../../config/firebase.config';
import { plotSchema, type Plot } from '../../schemas/plot.schema';

const plotSeedData: Plot[] = [
  {
    id: 'plot-greenview-a-001',
    propertyId: 'property-greenview-a-001',
    estateId: 'estate-greenview-001',
    canonicalNumber: 'A-001',
    identifiers: {
      block: 'A',
      phase: 'Phase 1',
      plotNumber: '001',
      surveyPlanReference: 'SURV-GV-A-001',
      beaconReferences: ['GV-A-001-B1', 'GV-A-001-B2'],
      allocationReference: 'ALLOC-GV-A-001',
    },
    dimensions: {
      size: {
        value: 500,
        unit: 'SQM',
      },
      frontage: 20,
      depth: 25,
    },
    location: {
      latitude: 6.4671,
      longitude: 3.7338,
      boundaryDescription: 'Corner plot beside the Phase 1 access road.',
    },
    allocation: {
      status: 'UNALLOCATED',
    },
    title: {
      status: 'VERIFIED',
      titleType: 'GOVERNOR_CONSENT',
      titleReference: 'LAG/GRANT/2024/001',
    },
    verification: {
      status: 'VERIFIED',
      lastCheckedAt: new Date('2026-01-15T09:00:00.000Z'),
    },
    createdAt: new Date('2026-01-10T09:00:00.000Z'),
    updatedAt: new Date('2026-01-15T09:00:00.000Z'),
  },
  {
    id: 'plot-hillcrest-a-001',
    propertyId: 'property-hillcrest-a-001',
    estateId: 'estate-hillcrest-002',
    canonicalNumber: 'A-001',
    identifiers: {
      block: 'A',
      phase: 'Initial development',
      plotNumber: '001',
      surveyPlanReference: 'SURV-HT-A-001',
    },
    dimensions: {
      size: {
        value: 450,
        unit: 'SQM',
      },
      frontage: 18,
      depth: 25,
    },
    location: {
      latitude: 8.8799,
      longitude: 7.2281,
      boundaryDescription: 'Residential plot along the main access road.',
    },
    allocation: {
      status: 'RESERVED',
      allocationReference: 'RES-HT-A-001',
      allocationDate: new Date('2026-02-05T11:00:00.000Z'),
      allocatedBy: 'user-admin-001',
    },
    title: {
      status: 'PENDING',
      titleType: 'C_OF_O',
    },
    verification: {
      status: 'UNVERIFIED',
    },
    createdAt: new Date('2026-02-01T10:30:00.000Z'),
    updatedAt: new Date('2026-02-05T11:00:00.000Z'),
  },
];

export async function seedPlots() {
  const batch = firestore.batch();

  for (const plot of plotSeedData) {
    const validatedPlot = plotSchema.parse(plot);
    const plotReference = firestore.collection('plots').doc(plot.id);

    batch.set(plotReference, validatedPlot);
  }

  await batch.commit();
  console.log(`Seeded ${plotSeedData.length} plot(s).`);
}
