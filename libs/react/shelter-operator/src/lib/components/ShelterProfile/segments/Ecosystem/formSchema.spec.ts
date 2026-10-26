import { FunderChoices, ShelterProgramChoices } from '@monorepo/react/shelter';
import { formSchema } from './formSchema';

const baseValues = {
  city: null,
  spa: null,
  citiesServed: [],
  spasServed: [],
  cityCouncilDistrict: null,
  supervisorialDistrict: null,
  shelterPrograms: [],
  shelterProgramsOther: null,
  funders: [],
  fundersOther: null,
};

function issuePaths(result: ReturnType<typeof formSchema.safeParse>): string[] {
  if (result.success) {
    return [];
  }

  return result.error.issues.map((issue) => issue.path.join('.'));
}

describe('Ecosystem formSchema — Other field pairs', () => {
  it('requires shelterProgramsOther when shelterPrograms includes Other', () => {
    const result = formSchema.safeParse({
      ...baseValues,
      shelterPrograms: [ShelterProgramChoices.Other],
      shelterProgramsOther: null,
    });

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toEqual(['shelterProgramsOther']);
  });

  it('requires fundersOther when funders includes Other', () => {
    const result = formSchema.safeParse({
      ...baseValues,
      funders: [FunderChoices.Other],
      fundersOther: '   ',
    });

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toEqual(['fundersOther']);
  });

  it('reports both pairs when both are incomplete', () => {
    const result = formSchema.safeParse({
      ...baseValues,
      shelterPrograms: [ShelterProgramChoices.Other],
      funders: [FunderChoices.Other],
    });

    expect(issuePaths(result)).toEqual([
      'shelterProgramsOther',
      'fundersOther',
    ]);
  });

  it('accepts filled pairs and trims them', () => {
    const result = formSchema.safeParse({
      ...baseValues,
      shelterPrograms: [ShelterProgramChoices.Other],
      shelterProgramsOther: '  Transitional housing  ',
      funders: [FunderChoices.Other],
      fundersOther: '  County grant  ',
    });

    if (!result.success) {
      throw new Error(JSON.stringify(result.error.issues));
    }

    expect(result.data.shelterProgramsOther).toBe('Transitional housing');
    expect(result.data.fundersOther).toBe('County grant');
  });
});
