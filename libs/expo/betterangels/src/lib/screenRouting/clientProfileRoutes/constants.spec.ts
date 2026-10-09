import { describe, expect, it } from 'vitest';
import {
  ClientProfileSectionEnum,
  DEFAULT_RELATED_MODEL_SECTION,
  DEFAULT_STANDARD_SECTION,
  getClientProfileSectionOrDefault,
  isRelatedModelSection,
  isStandardSection,
} from './constants';

const STANDARD_SECTIONS = [
  ClientProfileSectionEnum.FullName,
  ClientProfileSectionEnum.PersonalInfo,
  ClientProfileSectionEnum.ImportantNotes,
  ClientProfileSectionEnum.Demographic,
  ClientProfileSectionEnum.ContactInfo,
];

const RELATED_MODEL_SECTIONS = [
  ClientProfileSectionEnum.RelevantContacts,
  ClientProfileSectionEnum.Household,
  ClientProfileSectionEnum.HmisIds,
];

/**
 * `ClientProfileForm/config.tsx` is `Record<TStandardSection, …>` and
 * `relatedClientProfileModel/config.ts` is `Record<TRelatedModelSection, …>`, so
 * "is a member of the family" and "is a key of that family's config map" are the
 * same statement — the `Record` makes the key set exhaustive and `tsc` fails if
 * an entry is missing. These specs pin the runtime *values* (and the enum-to-
 * family classification the maps are keyed by), which is what regressed when a
 * cross-family `componentName` reached `config[section]` and destructured
 * `undefined`.
 *
 * The config maps themselves are not imported here on purpose: both pull in
 * `expo-modules-core` (through the hooks/providers and design-system chains),
 * which vitest-native's loader cannot strip — the same pre-existing limitation
 * that fails ConsentModal.test.tsx and UserProfile/index.test.tsx at load time.
 */
describe('client profile section families', () => {
  it('classifies every enum member into exactly one family', () => {
    for (const section of Object.values(ClientProfileSectionEnum)) {
      expect(isStandardSection(section) || isRelatedModelSection(section)).toBe(
        true,
      );
      expect(isStandardSection(section) && isRelatedModelSection(section)).toBe(
        false,
      );
    }
  });

  it('rejects wrong-family and unknown values at the guard', () => {
    expect(isStandardSection(ClientProfileSectionEnum.Household)).toBe(false);
    expect(isStandardSection(ClientProfileSectionEnum.RelevantContacts)).toBe(
      false,
    );
    expect(isRelatedModelSection(ClientProfileSectionEnum.FullName)).toBe(false);
    expect(isRelatedModelSection(ClientProfileSectionEnum.PersonalInfo)).toBe(
      false,
    );

    expect(isStandardSection('NotASection')).toBe(false);
    expect(isRelatedModelSection(undefined)).toBe(false);
    expect(isStandardSection(null)).toBe(false);
  });

  it('keeps the defaults inside the family whose config map must contain them', () => {
    expect(isStandardSection(DEFAULT_STANDARD_SECTION)).toBe(true);
    expect(isRelatedModelSection(DEFAULT_RELATED_MODEL_SECTION)).toBe(true);

    // the defaults fall in the exhaustive key set of their family's config map
    expect(STANDARD_SECTIONS).toContain(DEFAULT_STANDARD_SECTION);
    expect(RELATED_MODEL_SECTIONS).toContain(DEFAULT_RELATED_MODEL_SECTION);
    expect(STANDARD_SECTIONS).not.toContain(DEFAULT_RELATED_MODEL_SECTION);
    expect(RELATED_MODEL_SECTIONS).not.toContain(DEFAULT_STANDARD_SECTION);
  });
});

describe('getClientProfileSectionOrDefault', () => {
  it('keeps a valid section of the fallback family', () => {
    expect(
      getClientProfileSectionOrDefault(
        ClientProfileSectionEnum.PersonalInfo,
        DEFAULT_STANDARD_SECTION,
      ),
    ).toBe(ClientProfileSectionEnum.PersonalInfo);

    expect(
      getClientProfileSectionOrDefault(
        ClientProfileSectionEnum.Household,
        DEFAULT_RELATED_MODEL_SECTION,
      ),
    ).toBe(ClientProfileSectionEnum.Household);

    for (const section of STANDARD_SECTIONS) {
      expect(
        getClientProfileSectionOrDefault(section, DEFAULT_STANDARD_SECTION),
      ).toBe(section);
    }

    for (const section of RELATED_MODEL_SECTIONS) {
      expect(
        getClientProfileSectionOrDefault(
          section,
          DEFAULT_RELATED_MODEL_SECTION,
        ),
      ).toBe(section);
    }
  });

  it('falls back to the standard section when componentName is absent', () => {
    expect(
      getClientProfileSectionOrDefault(undefined, DEFAULT_STANDARD_SECTION),
    ).toBe(ClientProfileSectionEnum.FullName);

    expect(getClientProfileSectionOrDefault('', DEFAULT_STANDARD_SECTION)).toBe(
      ClientProfileSectionEnum.FullName,
    );
  });

  it('falls back to the related model section when componentName is absent', () => {
    expect(
      getClientProfileSectionOrDefault(
        undefined,
        DEFAULT_RELATED_MODEL_SECTION,
      ),
    ).toBe(ClientProfileSectionEnum.RelevantContacts);

    expect(
      getClientProfileSectionOrDefault('', DEFAULT_RELATED_MODEL_SECTION),
    ).toBe(ClientProfileSectionEnum.RelevantContacts);
  });

  it('falls back when componentName is not a known section', () => {
    expect(
      getClientProfileSectionOrDefault('NotASection', DEFAULT_STANDARD_SECTION),
    ).toBe(ClientProfileSectionEnum.FullName);

    expect(
      getClientProfileSectionOrDefault(
        'NotASection',
        DEFAULT_RELATED_MODEL_SECTION,
      ),
    ).toBe(ClientProfileSectionEnum.RelevantContacts);
  });

  // The crash path: these values pass `isValidClientProfileSectionEnum`, so the
  // old resolver returned them and the next line destructured `undefined` out of
  // the other family's config map.
  it('falls back when componentName is valid but belongs to the other family', () => {
    for (const section of RELATED_MODEL_SECTIONS) {
      const resolved = getClientProfileSectionOrDefault(
        section,
        DEFAULT_STANDARD_SECTION,
      );

      expect(resolved).toBe(ClientProfileSectionEnum.FullName);
      expect(isStandardSection(resolved)).toBe(true);
    }

    for (const section of STANDARD_SECTIONS) {
      const resolved = getClientProfileSectionOrDefault(
        section,
        DEFAULT_RELATED_MODEL_SECTION,
      );

      expect(resolved).toBe(ClientProfileSectionEnum.RelevantContacts);
      expect(isRelatedModelSection(resolved)).toBe(true);
    }
  });
});
