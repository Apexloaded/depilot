import { toDate } from '../../utils/index.js';
import { userSchema } from './schemas/user.schema.js';

export function parseUser(id: string, data: FirebaseFirestore.DocumentData) {
  return userSchema.parse({
    id,
    ...data,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  });
}
