import { firestore } from '../../config/firebase.config';
import { type CreateUserInput, type UpdateUserInput } from './user.type';
import { parseUser } from './user.utils';
import { userSchema, type User } from './schemas/user.schema';

const usersCollection = firestore.collection('users');

class UsersStore {
  async create(input: CreateUserInput): Promise<User> {
    const userReference = usersCollection.doc();
    const now = new Date();
    const user = userSchema.parse({
      ...input,
      id: userReference.id,
      createdAt: now,
      updatedAt: now,
    });

    await userReference.set(user);
    return user;
  }

  async read(id: string): Promise<User | null> {
    const snapshot = await usersCollection.doc(id).get();

    if (!snapshot.exists) {
      return null;
    }

    return parseUser(snapshot.id, snapshot.data() ?? {});
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const current = await this.read(id);

    if (!current) {
      throw new Error(`User ${id} does not exist`);
    }

    const updatedUser = userSchema.parse({
      ...current,
      ...input,
      id,
      createdAt: current.createdAt,
      updatedAt: new Date(),
    });

    await usersCollection.doc(id).set(updatedUser);
    return updatedUser;
  }

  async delete(id: string): Promise<void> {
    await usersCollection.doc(id).delete();
  }
}

export const usersStore = new UsersStore();
