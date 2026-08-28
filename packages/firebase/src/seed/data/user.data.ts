import { firestore } from '../../config/firebase.config';
import { UserRole, userSchema, type User } from '../../collections/users/schemas';

const userSeedData: User[] = [
  {
    id: 'user-admin-001',
    firstName: 'Amara',
    lastName: 'Okafor',
    email: 'amara.okafor@eplotone.example',
    role: UserRole.ADMIN,
    createdAt: new Date('2026-01-05T09:00:00.000Z'),
  },
  {
    id: 'user-surveyor-001',
    firstName: 'Tunde',
    lastName: 'Adeyemi',
    email: 'tunde.adeyemi@eplotone.example',
    role: UserRole.SURVEYOR,
    createdAt: new Date('2026-01-06T09:00:00.000Z'),
  },
  {
    id: 'user-client-001',
    firstName: 'Femi',
    lastName: 'Oyalede',
    email: 'femi.oyalede@eplotone.example',
    role: UserRole.CLIENT,
    createdAt: new Date('2026-01-03T09:00:00.000Z'),
  },
];

export async function seedUsers() {
  const batch = firestore.batch();

  for (const user of userSeedData) {
    const validatedUser = userSchema.parse(user);
    const userReference = firestore.collection('users').doc(user.id);

    batch.set(userReference, validatedUser);
  }

  await batch.commit();
  console.log(`Seeded ${userSeedData.length} user(s).`);
}
