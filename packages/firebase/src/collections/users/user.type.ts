import { type User } from './schemas/user.schema';

export type UserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

export type CreateUserInput = UserInput;

export type UpdateUserInput = Partial<UserInput>;
