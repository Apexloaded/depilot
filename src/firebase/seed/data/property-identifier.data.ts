import { firestore } from '../../config/firebase.config.js';
import {
  propertyIdentifierSchema,
  type PropertyIdentifier,
} from '../../schemas/property-identifier.schema.js';

const propertyIdentifierSeedData: PropertyIdentifier[] = [
  {
    id: 'identifier-greenview-a-001-plot',
    propertyId: 'property-greenview-a-001',
    type: 'PLOT_NUMBER',
    value: 'A-001',
    normalizedValue: 'a-001',
    source: 'MASTER_RECORD',
    status: 'ACTIVE',
    observedAt: new Date('2026-01-15T09:00:00.000Z'),
    createdAt: new Date('2026-01-15T09:00:00.000Z'),
  },
  {
    id: 'identifier-greenview-a-001-survey',
    propertyId: 'property-greenview-a-001',
    type: 'SURVEY_REFERENCE',
    value: 'SURV-GV-A-001',
    normalizedValue: 'surv-gv-a-001',
    source: 'SURVEYOR',
    sourceDocumentId: 'document-survey-greenview-001',
    status: 'ACTIVE',
    observedAt: new Date('2026-01-14T14:00:00.000Z'),
    createdAt: new Date('2026-01-14T14:00:00.000Z'),
  },
  {
    id: 'identifier-hillcrest-a-001-plot',
    propertyId: 'property-hillcrest-a-001',
    type: 'PLOT_NUMBER',
    value: 'A-001',
    normalizedValue: 'a-001',
    source: 'MASTER_RECORD',
    status: 'ACTIVE',
    observedAt: new Date('2026-02-01T10:30:00.000Z'),
    createdAt: new Date('2026-02-01T10:30:00.000Z'),
  },
];

export async function seedPropertyIdentifiers() {
  const batch = firestore.batch();

  for (const identifier of propertyIdentifierSeedData) {
    const validatedIdentifier = propertyIdentifierSchema.parse(identifier);
    const identifierReference = firestore
      .collection('propertyIdentifiers')
      .doc(identifier.id);

    batch.set(identifierReference, validatedIdentifier);
  }

  await batch.commit();
  console.log(
    `Seeded ${propertyIdentifierSeedData.length} property identifier(s).`,
  );
}
