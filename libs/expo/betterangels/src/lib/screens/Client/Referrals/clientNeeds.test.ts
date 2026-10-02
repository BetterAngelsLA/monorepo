/**
 * Client needs derived from intake answers.
 *
 * The load-bearing rule is the *negative* one: only pets, demographics and
 * accessibility may produce a need, because those are the only vocabularies the
 * shelter query returns. A need drawn from storage/parking/special situations
 * would be unmatchable against every shelter and would therefore render as
 * "never reported" everywhere — which reads as the whole network failing to
 * answer rather than as us not having asked. Several tests below exist purely to
 * stop someone widening that list without widening the query first.
 */
import {
  AccessibilityChoices,
  DemographicChoices,
  MATCHED_INTAKE_KEYS,
  PetChoices,
  StorageChoices,
  needLabelsFromIntake,
} from './clientNeeds';
import { matchTags } from './shelterAttributes';

describe('needLabelsFromIntake', () => {
  it('turns stored enum values into the labels the tags compare against', () => {
    expect(
      needLabelsFromIntake({
        pets: [PetChoices.Cats],
        accessibility: [AccessibilityChoices.WheelchairAccessible],
      }),
    ).toEqual(['Cats', 'Wheelchair Accessible']);
  });

  it('orders pets, then demographics, then accessibility', () => {
    expect(
      needLabelsFromIntake({
        accessibility: [AccessibilityChoices.AdaRooms],
        demographics: [DemographicChoices.SingleWomen],
        pets: [PetChoices.ServiceAnimals],
      }),
    ).toEqual(['Service Animals', 'Single Women', 'ADA Rooms Available']);
  });

  it('keeps multiple values from one vocabulary', () => {
    expect(
      needLabelsFromIntake({
        pets: [PetChoices.Cats, PetChoices.DogsUnder_25Lbs],
      }),
    ).toEqual(['Cats', 'Dogs (< 25 lbs)']);
  });

  it('returns nothing for an empty or absent answer set', () => {
    expect(needLabelsFromIntake({})).toEqual([]);
    expect(needLabelsFromIntake(null)).toEqual([]);
    expect(needLabelsFromIntake(undefined)).toEqual([]);
    expect(needLabelsFromIntake({ pets: [] })).toEqual([]);
  });

  it('ignores a pre-conversion yes/no answer instead of crashing', () => {
    // Drafts saved before the field became a multi-select hold the string "Yes".
    expect(needLabelsFromIntake({ pets: 'Yes' })).toEqual([]);
  });

  it('skips a value that is no longer in the vocabulary', () => {
    // A stale draft must not put a raw enum name like RETIRED_VALUE on screen.
    expect(
      needLabelsFromIntake({ pets: ['RETIRED_VALUE', PetChoices.Cats] }),
    ).toEqual(['Cats']);
  });

  it('does not repeat a label', () => {
    expect(
      needLabelsFromIntake({ pets: [PetChoices.Cats, PetChoices.Cats] }),
    ).toEqual(['Cats']);
  });
});

describe('vocabularies excluded from matching', () => {
  it('names only the three the shelter query returns', () => {
    expect(MATCHED_INTAKE_KEYS).toEqual([
      'pets',
      'demographics',
      'accessibility',
    ]);
  });

  it('produces no need from storage, parking or special situations', () => {
    expect(
      needLabelsFromIntake({
        storage: [StorageChoices.AmnestyLockers],
        transportation: ['AUTOMOBILE'],
        special: ['DOMESTIC_VIOLENCE'],
      }),
    ).toEqual([]);
  });

  it('so a storage answer cannot mark every shelter as not reporting', () => {
    const needs = needLabelsFromIntake({
      storage: [StorageChoices.AmnestyLockers],
      pets: [PetChoices.Cats],
    });
    const tags = matchTags(['Cats'], needs);

    // One green tag for the pet need, and no red outline invented for storage.
    expect(tags.map((t) => t.kind)).toEqual(['match']);
  });
});
