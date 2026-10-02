import type { CreateReferralInput } from '../../../apollo';
import {
  enumDisplayAccessibilityChoices,
  enumDisplayDemographics,
  enumDisplayParkingChoices,
  enumDisplayPetChoices,
  enumDisplaySpecialSituationRestrictionChoices,
  enumDisplayStorageChoices,
} from '../../../static';
import type { SheltersQuery } from './__generated__/Shelters.generated';

export type IntakeOption<TValue extends string = string> = {
  readonly value: TValue;
  readonly label: string;
};

function optionsFrom<TValue extends string>(
  labels: Record<TValue, string>,
): IntakeOption<TValue>[] {
  const options: IntakeOption<TValue>[] = [];
  for (const value in labels) {
    options.push({ value, label: labels[value] });
  }
  return options.sort((a, b) => a.label.localeCompare(b.label));
}

// Only destinations supported by the current notes adapter are expressible.
// A new API destination needs an adapter implementation as well as codegen.
type NotesField = Extract<keyof CreateReferralInput, 'notes'>;
export type IntakeBackendMapping =
  | { readonly mode: 'unmapped' }
  | { readonly mode: 'direct'; readonly field: NotesField }
  | {
      readonly mode: 'notesSidecar';
      readonly field: NotesField;
      readonly payloadKey: string;
    };

type QueriedShelter = SheltersQuery['shelters']['results'][number];
export type ShelterMatchCategory = Extract<
  keyof QueriedShelter,
  'pets' | 'demographics' | 'accessibility'
>;

type FieldMetadata = {
  readonly key: string;
  readonly label: string;
  readonly section: 'needs' | 'additional';
  readonly sensitive: boolean;
  readonly persistence: { readonly localDraft: boolean };
  // Pending requirements retain their marker but do not block the prototype.
  readonly requirement: 'optional' | 'pending' | 'required';
  readonly help?: string;
};

export type IntakeFieldDefinition = FieldMetadata &
  (
    | {
        readonly control: 'text' | 'textarea';
        readonly backend: IntakeBackendMapping;
      }
    | ({
        // Direct notes accept text; structured answers need the sidecar.
        readonly backend: Exclude<IntakeBackendMapping, { mode: 'direct' }>;
      } & (
        | { readonly control: 'yesno' }
        | { readonly control: 'checkbox'; readonly checkboxLabel: string }
        | {
            readonly control: 'multiselect';
            readonly options: readonly IntakeOption[];
            readonly matching?: {
              readonly shelterAttribute: ShelterMatchCategory;
            };
          }
      ))
  );

/**
 * Frontend intake contract. Order is form order, including the order of matches.
 * Enum values are wire values; labels are presentation only. Sensitive answers
 * use the legacy PII buckets in both drafts and the v1 notes sidecar.
 */
export const INTAKE_FIELDS = [
  {
    key: 'substances',
    label: 'Substances',
    section: 'needs',
    control: 'text',
    sensitive: true,
    requirement: 'optional',
    help: 'Abstinent for how many days?',
    persistence: { localDraft: true },
    backend: { mode: 'notesSidecar', field: 'notes', payloadKey: 'substances' },
  },
  {
    key: 'pets',
    label: 'Animals with the client',
    section: 'needs',
    control: 'multiselect',
    options: optionsFrom(enumDisplayPetChoices),
    matching: { shelterAttribute: 'pets' },
    sensitive: false,
    requirement: 'optional',
    help: 'Matched against what each shelter accepts',
    persistence: { localDraft: true },
    backend: { mode: 'notesSidecar', field: 'notes', payloadKey: 'pets' },
  },
  {
    key: 'demographics',
    label: 'Household / demographic fit',
    section: 'needs',
    control: 'multiselect',
    options: optionsFrom(enumDisplayDemographics),
    matching: { shelterAttribute: 'demographics' },
    sensitive: false,
    requirement: 'optional',
    help: 'Matched against who each shelter serves',
    persistence: { localDraft: true },
    backend: {
      mode: 'notesSidecar',
      field: 'notes',
      payloadKey: 'demographics',
    },
  },
  {
    key: 'accessibility',
    label: 'Accessibility needs',
    section: 'needs',
    control: 'multiselect',
    options: optionsFrom(enumDisplayAccessibilityChoices),
    matching: { shelterAttribute: 'accessibility' },
    sensitive: false,
    requirement: 'optional',
    help: 'Matched against what each shelter provides',
    persistence: { localDraft: true },
    backend: {
      mode: 'notesSidecar',
      field: 'notes',
      payloadKey: 'accessibility',
    },
  },
  {
    key: 'storage',
    label: 'Storage needed',
    section: 'needs',
    control: 'multiselect',
    options: optionsFrom(enumDisplayStorageChoices),
    sensitive: false,
    requirement: 'pending',
    persistence: { localDraft: true },
    backend: { mode: 'notesSidecar', field: 'notes', payloadKey: 'storage' },
  },
  {
    key: 'transportation',
    label: 'Vehicle needing parking',
    section: 'needs',
    control: 'multiselect',
    options: optionsFrom(enumDisplayParkingChoices),
    sensitive: false,
    requirement: 'optional',
    help: 'The shelter records parking by vehicle type',
    persistence: { localDraft: true },
    backend: {
      mode: 'notesSidecar',
      field: 'notes',
      payloadKey: 'transportation',
    },
  },
  {
    key: 'selfcare',
    label: 'Able to practice self-care',
    section: 'needs',
    control: 'yesno',
    sensitive: false,
    requirement: 'optional',
    help: 'No shelter-side counterpart yet — recorded for the referral only',
    persistence: { localDraft: true },
    backend: { mode: 'notesSidecar', field: 'notes', payloadKey: 'selfcare' },
  },
  {
    key: 'special',
    label: 'Special Situations',
    section: 'needs',
    control: 'multiselect',
    options: optionsFrom(enumDisplaySpecialSituationRestrictionChoices),
    sensitive: true,
    requirement: 'optional',
    persistence: { localDraft: true },
    backend: { mode: 'notesSidecar', field: 'notes', payloadKey: 'special' },
  },
  {
    key: 'consent',
    label: 'DHS data-sharing consent',
    section: 'additional',
    control: 'checkbox',
    checkboxLabel: 'Client gave consent',
    sensitive: false,
    requirement: 'optional',
    help: 'Records that the client consented to DHS data sharing (a plain yes/no — not PII). Consent content, signer, and delivery are unresolved — see GAP-21.',
    persistence: { localDraft: true },
    backend: { mode: 'notesSidecar', field: 'notes', payloadKey: 'consent' },
  },
  {
    key: 'notes',
    label: 'Staff Observations / Notes',
    section: 'additional',
    control: 'textarea',
    sensitive: false,
    requirement: 'optional',
    help: 'Saved to referral.notes — include anything affecting placement',
    persistence: { localDraft: true },
    backend: { mode: 'direct', field: 'notes' },
  },
] as const satisfies readonly IntakeFieldDefinition[];

type DefinedField = (typeof INTAKE_FIELDS)[number];
export type IntakeFieldKey = DefinedField['key'];
type ValueFor<TField> = TField extends {
  control: 'multiselect';
  options: readonly IntakeOption<infer TValue>[];
}
  ? TValue[]
  : TField extends { control: 'checkbox' }
    ? boolean
    : TField extends { control: 'yesno' }
      ? 'Yes' | 'No'
      : string;

export type IntakeValues = {
  [TField in DefinedField as TField['key']]?: ValueFor<TField>;
};

export type IntakeAnswers = {
  readonly [K in IntakeFieldKey]?: Readonly<IntakeValues[K]>;
};

// A union of key/value pairs keeps their types correlated, even for union keys.
export type IntakeFieldWrite = {
  [K in IntakeFieldKey]: [
    key: K,
    value: Readonly<NonNullable<IntakeValues[K]>>,
  ];
}[IntakeFieldKey];

// Stored records also contain older formats and fields absent from this version.
// Keep them intact at the persistence boundary; only narrow values for controls.
export type StoredIntake = Record<string, unknown>;
export type IntakeControlValue = string | string[] | boolean;

export function getIntakeField(
  key: string,
  definitions: readonly IntakeFieldDefinition[] = INTAKE_FIELDS,
): IntakeFieldDefinition | undefined {
  return definitions.find((field) => field.key === key);
}

export function isIntakeControlValue(
  field: IntakeFieldDefinition,
  value: unknown,
): value is IntakeControlValue {
  switch (field.control) {
    case 'checkbox':
      return typeof value === 'boolean';
    case 'yesno':
      return value === 'Yes' || value === 'No';
    case 'multiselect':
      return (
        Array.isArray(value) &&
        value.every((item) =>
          field.options.some((option) => option.value === item),
        )
      );
    default:
      return typeof value === 'string';
  }
}

export function isIntakeFieldValue<K extends IntakeFieldKey>(
  key: K,
  value: unknown,
): value is NonNullable<IntakeValues[K]> {
  const field = getIntakeField(key);
  return !!field && isIntakeControlValue(field, value);
}

/** Current control values; the original stored record remains unchanged. */
export function readIntakeAnswers(
  values: Readonly<StoredIntake>,
): IntakeAnswers {
  const answers: IntakeValues = {};
  const readField = <K extends IntakeFieldKey>(key: K) => {
    const field = getIntakeField(key);
    let value = values[key];
    // Keep valid selections visible when an older draft also has retired ones.
    if (field?.control === 'multiselect' && Array.isArray(value)) {
      value = value.filter((item) =>
        field.options.some((option) => option.value === item),
      );
    }
    if (isIntakeFieldValue(key, value)) {
      if (Array.isArray(value)) Object.freeze(value);
      answers[key] = value;
    }
  };
  INTAKE_FIELDS.forEach((field) => readField(field.key));
  return Object.freeze(answers);
}

export function missingRequiredIntakeFields(
  values: StoredIntake,
  definitions: readonly IntakeFieldDefinition[] = INTAKE_FIELDS,
): IntakeFieldDefinition[] {
  return definitions.filter((field) => {
    if (field.requirement !== 'required') return false;
    const value = values[field.key];
    if (!isIntakeControlValue(field, value)) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    return !value;
  });
}
