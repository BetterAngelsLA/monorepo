import { DemographicChoices, ShelterChoices } from '@monorepo/react/shelter';
import { formSchema } from './formSchema';

const baseValues = {
  demographics: [],
  demographicsOther: null,
  specialSituationRestrictions: [],
  shelterTypes: [],
  shelterTypesOther: null,
  accessibility: [],
  storage: [],
  pets: [],
  parking: [],
  addNotesShelterDetails: '',
};

function issuePaths(result: ReturnType<typeof formSchema.safeParse>): string[] {
  if (result.success) {
    return [];
  }

  return result.error.issues.map((issue) => issue.path.join('.'));
}

describe('Details formSchema — Other field pairs', () => {
  it('requires demographicsOther when demographics includes Other', () => {
    const result = formSchema.safeParse({
      ...baseValues,
      demographics: [DemographicChoices.Other],
      demographicsOther: null,
    });

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toEqual(['demographicsOther']);
  });

  it('rejects whitespace-only demographicsOther', () => {
    const result = formSchema.safeParse({
      ...baseValues,
      demographics: [DemographicChoices.Other],
      demographicsOther: '   ',
    });

    expect(issuePaths(result)).toEqual(['demographicsOther']);
  });

  it('accepts a filled demographicsOther and trims it', () => {
    const result = formSchema.safeParse({
      ...baseValues,
      demographics: [DemographicChoices.Other],
      demographicsOther: '  Tribal members  ',
    });

    if (!result.success) {
      throw new Error(JSON.stringify(result.error.issues));
    }

    expect(result.data.demographicsOther).toBe('Tribal members');
  });

  it('reports the required-when-Other message', () => {
    const result = formSchema.safeParse({
      ...baseValues,
      demographics: [DemographicChoices.Other],
      demographicsOther: '',
    });

    if (result.success) {
      throw new Error('expected validation to fail');
    }

    expect(result.error.issues[0].message).toBe(
      "This field is required when 'Other' is selected.",
    );
  });

  it('trims leftover text even when Other is not selected', () => {
    const result = formSchema.safeParse({
      ...baseValues,
      demographics: [],
      demographicsOther: '  leftover  ',
    });

    if (!result.success) {
      throw new Error(JSON.stringify(result.error.issues));
    }

    expect(result.data.demographicsOther).toBe('leftover');
  });

  it('requires shelterTypesOther when shelterTypes includes Other', () => {
    const result = formSchema.safeParse({
      ...baseValues,
      shelterTypes: [ShelterChoices.Other],
      shelterTypesOther: null,
    });

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toEqual(['shelterTypesOther']);
  });
});
