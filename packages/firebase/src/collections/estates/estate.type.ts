import { type Estate } from './schemas';

export type EstateInput = Omit<Estate, 'id' | 'createdAt' | 'updatedAt'>;

export type CreateEstateInput = EstateInput;

export type UpdateEstateInput = Partial<EstateInput>;
