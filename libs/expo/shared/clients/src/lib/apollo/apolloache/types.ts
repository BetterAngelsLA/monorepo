import { FieldPolicy } from '@apollo/client';

export type TCachePolicy = {
  modelName: string;
  modelPK?: string;
  fieldPolicy: FieldPolicy<Record<string, unknown>, Record<string, unknown>>;
};

export type TCachePoliyConfig = Record<string, TCachePolicy>;
