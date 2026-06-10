import { z } from 'zod';
import type { BedFormData } from '../formTypes';

const formSchema = z.object({
  fees: z
    .number()
    .int('Fees must be a whole number')
    .min(0, 'Fees must be zero or greater')
    .optional()
    .nullable(),
});

export type FormErrors = Partial<Record<keyof BedFormData, string>>;

export function validateBedForm(data: BedFormData): {
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
    if (typeof field === 'string' && !errors[field as keyof BedFormData]) {
      errors[field as keyof BedFormData] = issue.message;
    }
  }
  return { isValid: false, errors };
}

export function validateField<K extends keyof BedFormData>(
  field: K,
  value: BedFormData[K]
): string | undefined {
  const result = formSchema.safeParse({ [field]: value });
  if (result.success) return undefined;
  const issue = result.error.issues.find((i) => i.path[0] === field);
  return issue?.message;
}
