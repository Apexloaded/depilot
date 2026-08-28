import { toDate } from '../../utils';
import { userSchema } from './schemas/user.schema';

export function parseUser(id: string, data: FirebaseFirestore.DocumentData) {
  return userSchema.parse({
    id,
    ...data,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  });
}
