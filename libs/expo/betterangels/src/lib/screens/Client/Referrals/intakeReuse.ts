import {
  INTAKE_FIELDS,
  getIntakeField,
  isIntakeControlValue,
  type IntakeFieldDefinition,
  type StoredIntake,
} from './intakeFields';

export type IntakeReuse = {
  values: StoredIntake;
  reviewKeys: string[];
  skippedKeys: string[];
};

/** A new referral uses today's definitions; its source record stays untouched. */
export function prepareIntakeReuse(
  source: Readonly<StoredIntake>,
  definitions: readonly IntakeFieldDefinition[] = INTAKE_FIELDS,
): IntakeReuse {
  const values: StoredIntake = {};
  const reviewKeys = new Set<string>();
  const skippedKeys: string[] = [];

  for (const [key, original] of Object.entries(source)) {
    if (
      original == null ||
      original === '' ||
      (Array.isArray(original) && !original.length)
    )
      continue;
    const field = getIntakeField(key, definitions);
    if (!field) {
      skippedKeys.push(key);
      continue;
    }
    if (field.reuse === 'reset' || !field.persistence.localDraft) continue;
    if (field.reuse === 'review') reviewKeys.add(key);

    let value = original;
    // Explicit legacy conversions only. Never guess a value from a similar label.
    if (field.control === 'yesno' && typeof value === 'boolean') {
      value = value ? 'Yes' : 'No';
      reviewKeys.add(key);
    }
    if (field.control === 'multiselect') {
      if (
        typeof value === 'string' &&
        field.options.some((option) => option.value === value)
      ) {
        value = [value];
        reviewKeys.add(key);
      }
      if (Array.isArray(value)) {
        const supported = value.filter((item) =>
          field.options.some((option) => option.value === item),
        );
        if (supported.length !== value.length) {
          skippedKeys.push(key);
          reviewKeys.add(key);
        }
        value = supported;
      }
    }
    if (!isIntakeControlValue(field, value)) {
      skippedKeys.push(key);
      reviewKeys.add(key);
      continue;
    }
    values[key] = value;
  }

  return { values, reviewKeys: [...reviewKeys], skippedKeys };
}
