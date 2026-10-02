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

  const labels: string[] = [];
  for (const field of definitions) {
    if (field.control !== 'multiselect' || !field.matching) continue;
    const answer = intake[field.key];
    if (!Array.isArray(answer)) continue;

    for (const value of answer) {
      const label = field.options.find(
        (option) => option.value === value,
      )?.label;
      if (label && !labels.includes(label)) labels.push(label);
    }
  }
  return labels;
}

export {
  AccessibilityChoices,
  DemographicChoices,
  ParkingChoices,
  PetChoices,
  SpecialSituationRestrictionChoices,
  StorageChoices,
} from '../../../apollo';
