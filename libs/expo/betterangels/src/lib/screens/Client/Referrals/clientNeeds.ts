import { isNonNullish, unique } from 'remeda';
import {
  INTAKE_FIELDS,
  type IntakeFieldDefinition,
  type StoredIntake,
} from '../../../draft/intakeFields';

/** Only explicitly matched fields contribute needs; unknown legacy values do not. */
export function needLabelsFromIntake(
  intake: StoredIntake | null | undefined,
  definitions: readonly IntakeFieldDefinition[] = INTAKE_FIELDS,
  opts?: { includeSensitive?: boolean },
): string[] {
  if (!intake) return [];
  const includeSensitive = opts?.includeSensitive ?? true;

  return unique(
    definitions.flatMap((field) => {
      if (field.control !== 'multiselect' || !field.matching) return [];
      // A card that masks a sensitive answer in its summary must not print the
      // same answer as a need tag beside it. The picker still ranks on it.
      if (!includeSensitive && field.sensitive) return [];
      const answer = intake[field.key];
      if (!Array.isArray(answer)) return [];
      return answer
        .map((value) => field.options.find((o) => o.value === value)?.label)
        .filter(isNonNullish);
    }),
  );
}
