import { PetChoices } from '../../../apollo';
import { needLabelsFromIntake } from './clientNeeds';
import { shelterAttributeLabels } from './shelterAttributes';
import {
  INTAKE_FIELDS,
  getIntakeField,
  isIntakeControlValue,
  missingRequiredIntakeFields,
  type IntakeFieldDefinition,
  type IntakeValues,
} from './intakeFields';
import {
  buildReferralNotes,
  decodeReferralNotes,
  encodeReferralNotes,
  summarizeIntake,
} from './referralIntakeSidecar';

const choices = {
  key: 'bar',
  label: 'Example choices',
  section: 'needs',
  control: 'multiselect',
  options: [
    { value: 'a', label: 'Choice A' },
    { value: 'b', label: 'Choice B' },
    { value: 'c', label: 'Choice C' },
    { value: 'd', label: 'Choice D' },
  ],
  sensitive: false,
  requirement: 'required',
  persistence: { localDraft: true },
  backend: { mode: 'notesSidecar', field: 'notes', payloadKey: 'backend_bar' },
} as const satisfies IntakeFieldDefinition;

describe('field value contracts', () => {
  it('derives current answer types from the catalog and generated enums', () => {
    expectTypeOf<IntakeValues['pets']>().toEqualTypeOf<
      PetChoices[] | undefined
    >();
    expectTypeOf<IntakeValues['consent']>().toEqualTypeOf<
      boolean | undefined
    >();
    expectTypeOf<IntakeValues['selfcare']>().toEqualTypeOf<
      'Yes' | 'No' | undefined
    >();
    expectTypeOf<'NOT_A_PET'[]>().not.toMatchTypeOf<IntakeValues['pets']>();
    expectTypeOf<{ mode: 'direct'; field: 'notes' }>().not.toMatchTypeOf<
      Extract<IntakeFieldDefinition, { control: 'multiselect' }>['backend']
    >();
  });

  it('accepts multiple permitted choices and rejects an unsupported choice', () => {
    expect(isIntakeControlValue(choices, ['a', 'c', 'd'])).toBe(true);
    expect(isIntakeControlValue(choices, ['a', 'x'])).toBe(false);
    expect(isIntakeControlValue(choices, 'a')).toBe(false);
    expect(isIntakeControlValue(choices, [42])).toBe(false);
  });

  it('requires at least one valid selection when the definition requires it', () => {
    expect(missingRequiredIntakeFields({}, [choices])).toEqual([choices]);
    expect(missingRequiredIntakeFields({ bar: [] }, [choices])).toEqual([
      choices,
    ]);
    expect(missingRequiredIntakeFields({ bar: ['x'] }, [choices])).toEqual([
      choices,
    ]);
    expect(missingRequiredIntakeFields({ bar: ['b'] }, [choices])).toEqual([]);
  });

  it('preserves the current pending requirement without imposing a new gate', () => {
    expect(getIntakeField('storage')?.requirement).toBe('pending');
    expect(missingRequiredIntakeFields({})).toEqual([]);
  });

  it('rejects whitespace for required text and distinguishes No from unanswered', () => {
    const text = { ...choices, control: 'text' } as const;
    const yesno = { ...choices, control: 'yesno' } as const;
    expect(missingRequiredIntakeFields({ bar: '  ' }, [text])).toEqual([text]);
    expect(missingRequiredIntakeFields({ bar: 'No' }, [yesno])).toEqual([]);
  });
});

describe('catalog vocabulary and mapping integrity', () => {
  it.each([
    ['pets', 7],
    ['demographics', 11],
    ['accessibility', 3],
    ['storage', 6],
    ['transportation', 6],
    ['special', 7],
  ])(
    'offers the existing %s vocabulary with readable, sorted labels',
    (key, count) => {
      const field = getIntakeField(String(key));
      expect(field?.control).toBe('multiselect');
      if (field?.control !== 'multiselect')
        throw new Error('Expected choice field');
      expect(field.options).toHaveLength(Number(count));
      const labels = field.options.map((option) => option.label);
      expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
      expect(new Set(field.options.map((option) => option.value)).size).toBe(
        field.options.length,
      );
    },
  );

  it('uses distinct field and payload keys so one answer cannot overwrite another', () => {
    const keys = INTAKE_FIELDS.map((field) => field.key);
    const payloadKeys = INTAKE_FIELDS.flatMap((field) => {
      if (field.backend.mode === 'notesSidecar')
        return [field.backend.payloadKey];
      return [];
    });
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(payloadKeys).size).toBe(payloadKeys.length);
  });

  it('preserves the exact existing v1 payload, including ordinary and sensitive buckets', () => {
    const values: IntakeValues = {
      notes: 'Fictional observation',
      pets: [PetChoices.Cats],
      substances: '30 days',
      consent: true,
    };
    expect(buildReferralNotes(values)).toBe(
      'Fictional observation\n\n<<<referral-intake:v1>>>\n' +
        '{"v":1,"fields":{"pets":["CATS"],"consent":true},"PII":{"substances":"30 days"}}' +
        '\n<<<end-referral-intake>>>',
    );
  });
});

describe('definition-driven consumers', () => {
  it('uses an explicit backend alias in both directions without changing the adapter', () => {
    const encoded = encodeReferralNotes('', { bar: ['a', 'c'] }, [choices]);
    expect(encoded).toContain('"backend_bar":["a","c"]');
    expect(decodeReferralNotes(encoded, [choices]).intake).toEqual({
      bar: ['a', 'c'],
    });
  });

  it('changing sensitivity in one definition changes storage and masking together', () => {
    const sensitive = { ...choices, sensitive: true };
    const encoded = encodeReferralNotes('', { bar: ['b'] }, [sensitive]);
    expect(encoded).toContain('"fields":{},"PII":{"backend_bar":["b"]}');
    expect(summarizeIntake({ bar: ['b'] }, undefined, [sensitive])).toBe(
      'bar: ••••',
    );
    expect(summarizeIntake({ bar: ['b'] }, undefined, [choices])).toBe(
      'bar: b',
    );
  });

  it('only matches when the definition explicitly connects the field to queried shelter data', () => {
    expect(needLabelsFromIntake({ bar: ['c'] }, [choices])).toEqual([]);
    const matched = {
      ...choices,
      matching: { shelterAttribute: 'pets' as const },
    };
    expect(needLabelsFromIntake({ bar: ['c', 'a'] }, [matched])).toEqual([
      'Choice C',
      'Choice A',
    ]);
  });

  it('unmapped fields stay out of submitted notes', () => {
    const unmapped = { ...choices, backend: { mode: 'unmapped' as const } };
    expect(encodeReferralNotes('Human notes', { bar: ['a'] }, [unmapped])).toBe(
      'Human notes',
    );
  });

  it('uses the same option label for the client need and its mapped shelter attribute', () => {
    const matched = {
      ...choices,
      options: [{ value: PetChoices.Cats, label: 'Updated cat label' }],
      matching: { shelterAttribute: 'pets' },
    } as const satisfies IntakeFieldDefinition;
    const desired = needLabelsFromIntake({ bar: [PetChoices.Cats] }, [matched]);
    const offered = shelterAttributeLabels(
      { pets: [{ name: PetChoices.Cats }] },
      [matched],
    );
    expect(offered).toEqual(['Updated cat label']);
    expect(desired).toEqual(offered);
  });

  it('maps a differently named text field directly into human notes', () => {
    const direct = {
      ...choices,
      key: 'observations',
      control: 'textarea',
      backend: { mode: 'direct', field: 'notes' },
    } as const satisfies IntakeFieldDefinition;
    expect(
      encodeReferralNotes('Picker notes', { observations: 'Staff notes' }, [
        direct,
      ]),
    ).toBe('Staff notes\nPicker notes');
  });

  it('retains unknown and legacy answers when loading and re-encoding v1 records', () => {
    const intake = {
      storage: 'Yes',
      futureField: ['legacy'],
      substances: '30 days',
    };
    const encoded = encodeReferralNotes('Human notes', intake);
    expect(decodeReferralNotes(encoded).intake).toEqual(intake);
  });
});

describe('notes envelope validation', () => {
  it('keeps human follow-up text after a sidecar visible', () => {
    const saved = encodeReferralNotes('Initial note', { pets: ['CATS'] });
    expect(decodeReferralNotes(saved + '\nFollow-up note')).toEqual({
      humanNotes: 'Initial note\nFollow-up note',
      intake: { pets: ['CATS'] },
    });
  });

  it.each([
    '{broken}',
    '{"v":999,"fields":{"pets":["CATS"]}}',
    '{"v":1,"fields":[]}',
    '{"v":1,"PII":"unexpected"}',
  ])(
    'does not interpret an invalid envelope or reveal its payload: %s',
    (payload) => {
      expect(
        decodeReferralNotes(
          `Before\n\n<<<referral-intake:v1>>>\n${payload}\n<<<end-referral-intake>>>\nAfter`,
        ),
      ).toEqual({ humanNotes: 'Before\nAfter', intake: {} });
    },
  );
});
