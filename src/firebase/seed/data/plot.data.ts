import { firestore } from '../../config/firebase.config.js';
import {
  type Plot,
  plotSchema,
} from '../../collections/plots/schemas/plot.schema.js';

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
    id: 'plot-greenview-a-002',
    propertyId: 'property-greenview-a-002',
    estateId: 'estate-greenview-001',
    canonicalNumber: 'A-002',
    identifiers: {
      block: 'A',
      phase: 'Phase 1',
      plotNumber: '002',
      surveyPlanReference: 'SURV-GV-A-002',
      beaconReferences: ['GV-A-002-B1', 'GV-A-002-B2'],
      allocationReference: 'ALLOC-GV-A-002',
    },
    dimensions: {
      size: { value: 500, unit: 'SQM' },
      frontage: 20,
      depth: 25,
    },
    location: {
      latitude: 6.4673,
      longitude: 3.734,
      boundaryDescription: 'Standard plot adjacent to A-001 on main avenue.',
    },
    allocation: { status: 'UNALLOCATED' },
    title: {
      status: 'VERIFIED',
      titleType: 'GOVERNOR_CONSENT',
      titleReference: 'LAG/GRANT/2024/002',
    },
    verification: {
      status: 'VERIFIED',
      lastCheckedAt: new Date('2026-01-15T09:00:00.000Z'),
    },
    createdAt: new Date('2026-01-10T09:00:00.000Z'),
    updatedAt: new Date('2026-01-15T09:00:00.000Z'),
  },
  {
    id: 'plot-greenview-a-003',
    propertyId: 'property-greenview-a-003',
    estateId: 'estate-greenview-001',
    canonicalNumber: 'A-003',
    identifiers: {
      block: 'A',
      phase: 'Phase 1',
      plotNumber: '003',
      surveyPlanReference: 'SURV-GV-A-003',
      beaconReferences: ['GV-A-003-B1', 'GV-A-003-B2'],
    },
    dimensions: {
      size: { value: 600, unit: 'SQM' },
      frontage: 20,
      depth: 30,
    },
    location: {
      latitude: 6.4675,
      longitude: 3.7342,
      boundaryDescription: 'Prime plot overlooking the central green area.',
    },
    allocation: {
      status: 'RESERVED',
      allocationReference: 'RES-GV-A-003',
      allocationDate: new Date('2026-02-01T10:00:00.000Z'),
      allocatedBy: 'user-admin-001',
    },
    title: {
      status: 'VERIFIED',
      titleType: 'GOVERNOR_CONSENT',
      titleReference: 'LAG/GRANT/2024/003',
    },
    verification: {
      status: 'VERIFIED',
      lastCheckedAt: new Date('2026-01-15T09:00:00.000Z'),
    },
    createdAt: new Date('2026-01-10T09:00:00.000Z'),
    updatedAt: new Date('2026-02-01T10:00:00.000Z'),
  },
  {
    id: 'plot-greenview-b-001',
    propertyId: 'property-greenview-b-001',
    estateId: 'estate-greenview-001',
    canonicalNumber: 'B-001',
    identifiers: {
      block: 'B',
      phase: 'Phase 1',
      plotNumber: '001',
      surveyPlanReference: 'SURV-GV-B-001',
      beaconReferences: ['GV-B-001-B1', 'GV-B-001-B2'],
    },
    dimensions: {
      size: { value: 450, unit: 'SQM' },
      frontage: 18,
      depth: 25,
    },
    location: {
      latitude: 6.468,
      longitude: 3.7345,
      boundaryDescription: 'Block B introductory corner plot.',
    },
    allocation: { status: 'UNALLOCATED' },
    title: {
      status: 'VERIFIED',
      titleType: 'GOVERNOR_CONSENT',
      titleReference: 'LAG/GRANT/2024/004',
    },
    verification: {
      status: 'VERIFIED',
      lastCheckedAt: new Date('2026-01-15T09:00:00.000Z'),
    },
    createdAt: new Date('2026-01-12T09:00:00.000Z'),
    updatedAt: new Date('2026-01-15T09:00:00.000Z'),
  },
  {
    id: 'plot-greenview-b-002',
    propertyId: 'property-greenview-b-002',
    estateId: 'estate-greenview-001',
    canonicalNumber: 'B-002',
    identifiers: {
      block: 'B',
      phase: 'Phase 1',
      plotNumber: '002',
      surveyPlanReference: 'SURV-GV-B-002',
      beaconReferences: ['GV-B-002-B1', 'GV-B-002-B2'],
      allocationReference: 'ALLOC-GV-B-002',
    },
    dimensions: {
      size: { value: 500, unit: 'SQM' },
      frontage: 20,
      depth: 25,
    },
    location: {
      latitude: 6.4682,
      longitude: 3.7347,
      boundaryDescription: 'Mid-block residential plot along Boulevard street.',
    },
    allocation: {
      status: 'ALLOCATED',
      allocationReference: 'ALLOC-GV-B-002',
      allocationDate: new Date('2026-02-10T14:00:00.000Z'),
      allocatedBy: 'user-admin-001',
    },
    title: {
      status: 'VERIFIED',
      titleType: 'GOVERNOR_CONSENT',
      titleReference: 'LAG/GRANT/2024/005',
    },
    verification: {
      status: 'VERIFIED',
      lastCheckedAt: new Date('2026-01-15T09:00:00.000Z'),
    },
    createdAt: new Date('2026-01-12T09:00:00.000Z'),
    updatedAt: new Date('2026-02-10T14:00:00.000Z'),
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
  {
    id: 'plot-hillcrest-a-002',
    propertyId: 'property-hillcrest-a-002',
    estateId: 'estate-hillcrest-002',
    canonicalNumber: 'A-002',
    identifiers: {
      block: 'A',
      phase: 'Initial development',
      plotNumber: '002',
      surveyPlanReference: 'SURV-HT-A-002',
    },
    dimensions: {
      size: { value: 450, unit: 'SQM' },
      frontage: 18,
      depth: 25,
    },
    location: {
      latitude: 8.8801,
      longitude: 7.2283,
      boundaryDescription: 'Residential plot adjacent to A-001.',
    },
    allocation: { status: 'UNALLOCATED' },
    title: { status: 'PENDING', titleType: 'C_OF_O' },
    verification: { status: 'UNVERIFIED' },
    createdAt: new Date('2026-02-01T10:30:00.000Z'),
    updatedAt: new Date('2026-02-01T10:30:00.000Z'),
  },
  {
    id: 'plot-hillcrest-a-003',
    propertyId: 'property-hillcrest-a-003',
    estateId: 'estate-hillcrest-002',
    canonicalNumber: 'A-003',
    identifiers: {
      block: 'A',
      phase: 'Initial development',
      plotNumber: '003',
      surveyPlanReference: 'SURV-HT-A-003',
    },
    dimensions: {
      size: { value: 500, unit: 'SQM' },
      frontage: 20,
      depth: 25,
    },
    location: {
      latitude: 8.8803,
      longitude: 7.2285,
      boundaryDescription: 'Corner plot with dual road access.',
    },
    allocation: { status: 'UNALLOCATED' },
    title: { status: 'PENDING', titleType: 'C_OF_O' },
    verification: { status: 'UNVERIFIED' },
    createdAt: new Date('2026-02-01T10:30:00.000Z'),
    updatedAt: new Date('2026-02-01T10:30:00.000Z'),
  },
  {
    id: 'plot-hillcrest-b-001',
    propertyId: 'property-hillcrest-b-001',
    estateId: 'estate-hillcrest-002',
    canonicalNumber: 'B-001',
    identifiers: {
      block: 'B',
      phase: 'Initial development',
      plotNumber: '001',
      surveyPlanReference: 'SURV-HT-B-001',
      beaconReferences: ['HT-B-001-B1', 'HT-B-001-B2'],
    },
    dimensions: {
      size: { value: 600, unit: 'SQM' },
      frontage: 20,
      depth: 30,
    },
    location: {
      latitude: 8.881,
      longitude: 7.229,
      boundaryDescription: 'Elevated plot offering scenic valley views.',
    },
    allocation: {
      status: 'ALLOCATED',
      allocationReference: 'ALLOC-HT-B-001',
      allocationDate: new Date('2026-02-12T09:30:00.000Z'),
      allocatedBy: 'user-admin-001',
    },
    title: {
      status: 'VERIFIED',
      titleType: 'C_OF_O',
      titleReference: 'FCT/COFO/2025/088',
    },
    verification: {
      status: 'VERIFIED',
      lastCheckedAt: new Date('2026-02-10T08:00:00.000Z'),
    },
    createdAt: new Date('2026-02-02T11:00:00.000Z'),
    updatedAt: new Date('2026-02-12T09:30:00.000Z'),
  },
  {
    id: 'plot-hillcrest-b-002',
    propertyId: 'property-hillcrest-b-002',
    estateId: 'estate-hillcrest-002',
    canonicalNumber: 'B-002',
    identifiers: {
      block: 'B',
      phase: 'Initial development',
      plotNumber: '002',
      surveyPlanReference: 'SURV-HT-B-002',
    },
    dimensions: {
      size: { value: 450, unit: 'SQM' },
      frontage: 18,
      depth: 25,
    },
    location: {
      latitude: 8.8812,
      longitude: 7.2292,
      boundaryDescription: 'Block B standard residential plot.',
    },
    allocation: { status: 'UNALLOCATED' },
    title: { status: 'PENDING', titleType: 'C_OF_O' },
    verification: { status: 'UNVERIFIED' },
    createdAt: new Date('2026-02-02T11:00:00.000Z'),
    updatedAt: new Date('2026-02-02T11:00:00.000Z'),
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
