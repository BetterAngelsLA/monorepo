import { z } from 'zod';
import type { RoomFormData } from '../formTypes';

const formSchema = z.object({
  name: z.string().trim().min(1, 'Room name is required'),
});

export type FormErrors = Partial<Record<keyof RoomFormData, string>>;

export function validateRoomForm(data: RoomFormData): {
  isValid: boolean;
  errors: FormErrors;
} {
  const result = formSchema.safeParse(data);
  if (result.success) {
    return { isValid: true, errors: {} };
  }

  const errors: FormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !errors[field as keyof RoomFormData]) {
      errors[field as keyof RoomFormData] = issue.message;
    }
  }
  return { isValid: false, errors };
}

export function validateField<K extends keyof RoomFormData>(
  field: K,
  value: RoomFormData[K]
): string | undefined {
  const result = formSchema.safeParse({ [field]: value });
  if (result.success) return undefined;
  const issue = result.error.issues.find((i) => i.path[0] === field);
  return issue?.message;
}
