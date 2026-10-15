import { clientDetailToHmisClientProfileType } from './clientDetailToHmisClientProfileType';

describe('clientDetailToHmisClientProfileType', () => {
  it('maps a Clarity detail payload to the HMIS profile shape', () => {
    const client = clientDetailToHmisClientProfileType({
      id: 468,
      unique_identifier: '69E44770D',
      alias: null,
      first_name: 'John',
      last_name: 'Smith',
      birth_date: '2001-01-01',
      dob_quality: 1,
      name_quality: 1,
      screenValues: {
        age: 24,
        gender: [0, 3],
        gender_identity_text: 'Gen Id',
        name_middle: 'B',
        name_suffix: 1,
        race_ethnicity: [1, 2],
        additional_race_ethnicity_detail: 'AddlRace',
        veteran: 1,
      },
    });

    expect(client).toMatchObject({
      id: '468',
      hmisId: '468',
      uniqueIdentifier: '69E44770D',
      firstName: 'John',
      lastName: 'Smith',
      birthDate: '2001-01-01',
      // Clarity ordinals are converted to the GraphQL enum names the HMIS
      // display maps key on.
      nameQuality: 'FULL',
      dobQuality: 'FULL',
      nameMiddle: 'B',
      nameSuffix: 'JR',
      age: 24,
      gender: ['WOMAN_GIRL', 'DIFFERENT'],
      genderIdentityText: 'Gen Id',
      raceEthnicity: ['INDIGENOUS', 'ASIAN'],
      additionalRaceEthnicityDetail: 'AddlRace',
      veteran: 'YES',
    });
  });

  it('falls back to top-level values when a sub-field is not nested', () => {
    const client = clientDetailToHmisClientProfileType({
      id: '42',
      gender: [9],
      name_suffix: 2,
    });

    expect(client.gender).toEqual(['NO_ANSWER']);
    expect(client.nameSuffix).toBe('SR');
  });

  it('returns null for unset or unknown values', () => {
    const client = clientDetailToHmisClientProfileType({
      id: 1,
      veteran: 55,
    });

    expect(client.firstName).toBeNull();
    expect(client.nameQuality).toBeNull();
    expect(client.nameSuffix).toBeNull();
    expect(client.age).toBeNull();
    expect(client.gender).toBeNull();
    expect(client.veteran).toBeNull();
  });
});
