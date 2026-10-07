import { isNonNullish, unique } from 'remeda';
import {
  INTAKE_FIELDS,
  type IntakeFieldDefinition,
  type StoredIntake,
} from './intakeFields';

export const MATCHED_INTAKE_KEYS = INTAKE_FIELDS.filter(
  (field) => 'matching' in field,
).map((field) => field.key);

/** Only explicitly matched fields contribute needs; unknown legacy values do not. */
export function needLabelsFromIntake(
  intake: StoredIntake | null | undefined,
  definitions: readonly IntakeFieldDefinition[] = INTAKE_FIELDS,
): string[] {
  if (!intake) return [];

  return unique(
    definitions.flatMap((field) => {
      if (field.control !== 'multiselect' || !field.matching) return [];
      const answer = intake[field.key];
      if (!Array.isArray(answer)) return [];
      return answer
        .map((value) => field.options.find((o) => o.value === value)?.label)
        .filter(isNonNullish);
    }),
  );
}
