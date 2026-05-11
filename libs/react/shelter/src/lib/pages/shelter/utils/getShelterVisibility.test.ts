import {
  getRestrictionsFieldVisibility,
  getShelterVisibility,
  ShelterData,
} from './getShelterVisibility';

function makeShelter(overrides: Partial<ShelterData> = {}): ShelterData {
  return {
    website: null,
    phone: null,
    email: null,
    location: null,
    services: [],
    otherServices: null,
    description: null,
    entryRequirements: [],
    referralRequirement: [],
    entryInfo: null,
    bedFees: null,
    programFees: null,
    specialSituationRestrictions: [],
    shelterTypes: [],
    shelterTypesOther: null,
    roomStyles: [],
    accessibility: [],
    storage: [],
    pets: [],
    parking: [],
    maxStay: null,
    curfew: null,
    exitPolicy: [],
    visitorsAllowed: null,
    emergencySurge: null,
    onSiteSecurity: null,
    otherRules: null,
    city: [],
    spa: [],
    cityCouncilDistrict: null,
    supervisorialDistrict: null,
    shelterPrograms: [],
    funders: [],
    photos: [],
    mediaLinks: [],
    ...overrides,
  };
}

describe('getShelterVisibility', () => {
  it('returns all false for a completely empty shelter', () => {
    const visibility = getShelterVisibility(makeShelter());

    expect(visibility).toEqual({
      generalInfo: false,
      services: false,
      description: false,
      entryRequirements: false,
      specialRestrictions: false,
      shelterTypes: false,
      roomStyles: false,
      shelterDetail: false,
      restrictions: false,
      ecosystemInfo: false,
      media: false,
    });
  });

  describe('restrictions section', () => {
    it('is hidden when all restriction fields are empty', () => {
      const result = getShelterVisibility(makeShelter());
      expect(result.restrictions).toBe(false);
    });

    it('is visible when maxStay has a value', () => {
      const result = getShelterVisibility(makeShelter({ maxStay: 90 }));
      expect(result.restrictions).toBe(true);
    });

    it('is visible when curfew has a value', () => {
      const result = getShelterVisibility(makeShelter({ curfew: '22:00:00' }));
      expect(result.restrictions).toBe(true);
    });

    it('is visible when visitorsAllowed is set (even false)', () => {
      const result = getShelterVisibility(
        makeShelter({ visitorsAllowed: false })
      );
      expect(result.restrictions).toBe(true);
    });

    it('is visible when emergencySurge is set (even false)', () => {
      const result = getShelterVisibility(
        makeShelter({ emergencySurge: false })
      );
      expect(result.restrictions).toBe(true);
    });

    it('is visible when onSiteSecurity is set (even false)', () => {
      const result = getShelterVisibility(
        makeShelter({ onSiteSecurity: false })
      );
      expect(result.restrictions).toBe(true);
    });

    it('is visible when otherRules has real content', () => {
      const result = getShelterVisibility(
        makeShelter({ otherRules: '<p>No smoking</p>' })
      );
      expect(result.restrictions).toBe(true);
    });

    it('is hidden when otherRules is empty HTML', () => {
      const result = getShelterVisibility(
        makeShelter({ otherRules: '<p></p>' })
      );
      expect(result.restrictions).toBe(false);
    });

    it('is hidden when otherRules is only &nbsp;', () => {
      const result = getShelterVisibility(
        makeShelter({ otherRules: '<p>&nbsp;</p>' })
      );
      expect(result.restrictions).toBe(false);
    });
  });

  describe('services section', () => {
    it('is hidden when no services and no freeform content', () => {
      const result = getShelterVisibility(makeShelter());
      expect(result.services).toBe(false);
    });

    it('is visible when services array has items', () => {
      const result = getShelterVisibility(
        makeShelter({ services: [{ id: '1' }] })
      );
      expect(result.services).toBe(true);
    });

    it('is visible when otherServices has real content', () => {
      const result = getShelterVisibility(
        makeShelter({ otherServices: '<p>Laundry available</p>' })
      );
      expect(result.services).toBe(true);
    });

    it('is hidden when otherServices is empty HTML', () => {
      const result = getShelterVisibility(
        makeShelter({ otherServices: '<p>&nbsp;</p>' })
      );
      expect(result.services).toBe(false);
    });
  });

  describe('description section', () => {
    it('is hidden when description is empty HTML', () => {
      const result = getShelterVisibility(
        makeShelter({ description: '<p></p>' })
      );
      expect(result.description).toBe(false);
    });

    it('is visible when description has content', () => {
      const result = getShelterVisibility(
        makeShelter({ description: '<p>A great shelter</p>' })
      );
      expect(result.description).toBe(true);
    });
  });

  describe('media section', () => {
    it('is hidden when no photos or links', () => {
      const result = getShelterVisibility(makeShelter());
      expect(result.media).toBe(false);
    });

    it('is visible when photos has items', () => {
      const result = getShelterVisibility(
        makeShelter({
          photos: [{ id: '1', file: { url: 'http://example.com/photo.jpg' } }],
        })
      );
      expect(result.media).toBe(true);
    });

    it('is visible when mediaLinks has items', () => {
      const result = getShelterVisibility(
        makeShelter({ mediaLinks: [{ id: '1' }] })
      );
      expect(result.media).toBe(true);
    });
  });
});

describe('getRestrictionsFieldVisibility', () => {
  it('hides all fields when data is empty', () => {
    const result = getRestrictionsFieldVisibility(makeShelter());

    expect(result).toEqual({
      maxStay: false,
      curfew: true,
      exitPolicy: false,
      visitorsAllowed: false,
      emergencySurge: false,
      onSiteSecurity: false,
      otherRules: false,
    });
  });

  it('shows maxStay when it has a value', () => {
    const result = getRestrictionsFieldVisibility(makeShelter({ maxStay: 30 }));
    expect(result.maxStay).toBe(true);
  });

  it('hides maxStay when it is null', () => {
    const result = getRestrictionsFieldVisibility(
      makeShelter({ maxStay: null })
    );
    expect(result.maxStay).toBe(false);
  });

  it('always shows curfew (renders "No" when empty)', () => {
    const result = getRestrictionsFieldVisibility(
      makeShelter({ curfew: null })
    );
    expect(result.curfew).toBe(true);
  });

  it('shows exitPolicy when array has items', () => {
    const result = getRestrictionsFieldVisibility(
      makeShelter({ exitPolicy: [{ name: 'VOLUNTARY' }] })
    );
    expect(result.exitPolicy).toBe(true);
  });

  it('hides exitPolicy when array is empty', () => {
    const result = getRestrictionsFieldVisibility(
      makeShelter({ exitPolicy: [] })
    );
    expect(result.exitPolicy).toBe(false);
  });

  it('shows visitorsAllowed when explicitly true', () => {
    const result = getRestrictionsFieldVisibility(
      makeShelter({ visitorsAllowed: true })
    );
    expect(result.visitorsAllowed).toBe(true);
  });

  it('shows visitorsAllowed when explicitly false', () => {
    const result = getRestrictionsFieldVisibility(
      makeShelter({ visitorsAllowed: false })
    );
    expect(result.visitorsAllowed).toBe(true);
  });

  it('hides visitorsAllowed when null', () => {
    const result = getRestrictionsFieldVisibility(
      makeShelter({ visitorsAllowed: null })
    );
    expect(result.visitorsAllowed).toBe(false);
  });

  it('shows emergencySurge when explicitly false', () => {
    const result = getRestrictionsFieldVisibility(
      makeShelter({ emergencySurge: false })
    );
    expect(result.emergencySurge).toBe(true);
  });

  it('hides emergencySurge when null', () => {
    const result = getRestrictionsFieldVisibility(
      makeShelter({ emergencySurge: null })
    );
    expect(result.emergencySurge).toBe(false);
  });

  it('shows onSiteSecurity when true', () => {
    const result = getRestrictionsFieldVisibility(
      makeShelter({ onSiteSecurity: true })
    );
    expect(result.onSiteSecurity).toBe(true);
  });

  it('shows onSiteSecurity when false', () => {
    const result = getRestrictionsFieldVisibility(
      makeShelter({ onSiteSecurity: false })
    );
    expect(result.onSiteSecurity).toBe(true);
  });

  it('hides onSiteSecurity when null', () => {
    const result = getRestrictionsFieldVisibility(
      makeShelter({ onSiteSecurity: null })
    );
    expect(result.onSiteSecurity).toBe(false);
  });

  it('shows otherRules when content is real text', () => {
    const result = getRestrictionsFieldVisibility(
      makeShelter({ otherRules: '<p>No visitors after 10pm</p>' })
    );
    expect(result.otherRules).toBe(true);
  });

  it('hides otherRules when content is empty HTML', () => {
    const result = getRestrictionsFieldVisibility(
      makeShelter({ otherRules: '<p></p>' })
    );
    expect(result.otherRules).toBe(false);
  });

  it('hides otherRules when content is only &nbsp;', () => {
    const result = getRestrictionsFieldVisibility(
      makeShelter({ otherRules: '<p>&nbsp;</p>' })
    );
    expect(result.otherRules).toBe(false);
  });

  it('hides otherRules when null', () => {
    const result = getRestrictionsFieldVisibility(
      makeShelter({ otherRules: null })
    );
    expect(result.otherRules).toBe(false);
  });
});
