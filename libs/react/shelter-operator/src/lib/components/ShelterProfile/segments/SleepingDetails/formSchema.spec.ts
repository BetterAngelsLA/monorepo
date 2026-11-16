import { RoomStyleChoices } from '@monorepo/react/shelter';
import type { ShelterProfileType } from '../../types';
import { formSchema, toFormData, toFormFieldErrors } from './formSchema';

const baseValues = {
  totalBeds: null,
  nonRestrictedBeds: 0,
  restrictedBeds: 0,
  restrictionNotes: '',
  roomStyles: [],
  roomStylesOther: null,
  addNotesSleepingDetails: '',
};

function issuePaths(result: ReturnType<typeof formSchema.safeParse>): string[] {
  if (result.success) {
    return [];
  }

  return result.error.issues.map((issue) => issue.path.join('.'));
}

describe('SleepingDetails formSchema — Other field pairs', () => {
  it('requires roomStylesOther when roomStyles includes Other', () => {
    const result = formSchema.safeParse({
      ...baseValues,
      roomStyles: [RoomStyleChoices.Other],
      roomStylesOther: null,
    });

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toEqual(['roomStylesOther']);
  });

  it('rejects whitespace-only roomStylesOther', () => {
    const result = formSchema.safeParse({
      ...baseValues,
      roomStyles: [RoomStyleChoices.Other],
      roomStylesOther: '\t ',
    });

    expect(issuePaths(result)).toEqual(['roomStylesOther']);
  });

  it('accepts a filled roomStylesOther and trims it', () => {
    const result = formSchema.safeParse({
      ...baseValues,
      roomStyles: [RoomStyleChoices.Other],
      roomStylesOther: '  Sleeping pods  ',
    });

    if (!result.success) {
      throw new Error(JSON.stringify(result.error.issues));
    }

    expect(result.data.roomStylesOther).toBe('Sleeping pods');
  });

  it('does not require roomStylesOther when Other is not selected', () => {
    const result = formSchema.safeParse(baseValues);

    expect(result.success).toBe(true);
  });
});

describe('SleepingDetails formSchema — availability counts', () => {
  it('rejects counts above the total beds on both counters', () => {
    const result = formSchema.safeParse({
      ...baseValues,
      totalBeds: 4,
      nonRestrictedBeds: 3,
      restrictedBeds: 2,
    });

    expect(issuePaths(result)).toEqual(['nonRestrictedBeds', 'restrictedBeds']);

    if (result.success) {
      throw new Error('Expected the availability cap to reject the values.');
    }

    expect(result.error.issues[0].message).toBe(
      "Available beds (5) cannot exceed the shelter's total beds (4).",
    );
  });

  it('explains that a cleared counter needs a number', () => {
    const result = formSchema.safeParse({
      ...baseValues,
      nonRestrictedBeds: null,
    });

    if (result.success) {
      throw new Error('Expected a cleared counter to be rejected.');
    }

    expect(result.error.issues[0].message).toBe(
      'Unrestricted beds must be a number',
    );
  });

  it('accepts counts equal to the total beds', () => {
    const result = formSchema.safeParse({
      ...baseValues,
      totalBeds: 4,
      nonRestrictedBeds: 3,
      restrictedBeds: 1,
    });

    expect(result.success).toBe(true);
  });

  it('imposes no cap when the total beds are unknown', () => {
    const result = formSchema.safeParse({
      ...baseValues,
      totalBeds: null,
      nonRestrictedBeds: 30,
      restrictedBeds: 10,
    });

    expect(result.success).toBe(true);
  });
});

describe('SleepingDetails toFormData', () => {
  const shelter = (availability: unknown) =>
    ({
      totalBeds: 10,
      roomStyles: [],
      roomStylesOther: null,
      addNotesSleepingDetails: '',
      availability,
    }) as unknown as ShelterProfileType;

  it('maps the availability row onto the availability fields', () => {
    expect(
      toFormData(
        shelter({
          nonRestrictedBeds: 4,
          restrictedBeds: 2,
          restrictionNotes: 'Women only',
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        nonRestrictedBeds: 4,
        restrictedBeds: 2,
        restrictionNotes: 'Women only',
      }),
    );
  });

  it('falls back to zero and blank when the shelter has no availability row', () => {
    expect(toFormData(shelter(null))).toEqual(
      expect.objectContaining({
        nonRestrictedBeds: 0,
        restrictedBeds: 0,
        restrictionNotes: '',
      }),
    );
  });
});

describe('SleepingDetails toFormFieldErrors', () => {
  it('re-points availability messages at the fields the form renders', () => {
    expect(
      toFormFieldErrors([
        { field: 'availability.nonRestrictedBeds', message: 'first' },
        { field: 'availability.restrictedBeds', message: 'second' },
        { field: 'name', message: 'untouched' },
      ]),
    ).toEqual([
      { field: 'nonRestrictedBeds', message: 'first' },
      { field: 'restrictedBeds', message: 'second' },
      { field: 'name', message: 'untouched' },
    ]);
  });
});
