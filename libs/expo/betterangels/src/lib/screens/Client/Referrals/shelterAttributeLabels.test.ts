/**
 * FE-06-pick — shelter attributes are queried as API enum names (TINY_HOMES) and
 * must render as human labels ("Tiny Homes"). This mapping is what the match tags
 * compare on, so a mismatch here silently turns every tag gray.
 *
 * RVTM §7 Tier 1.
 */
import {
  AccessibilityChoices,
  DemographicChoices,
  PetChoices,
} from '../../../apollo';
import {
  enumDisplayAccessibilityChoices,
  enumDisplayDemographics,
  enumDisplayPetChoices,
} from '../../../static';
import { shelterAttributeLabels } from './shelterAttributes';

describe('shelterAttributeLabels', () => {
  it('maps pet enum names to display labels', () => {
    const labels = shelterAttributeLabels({
      pets: [{ name: PetChoices.Cats }],
    });

    expect(labels).toEqual([enumDisplayPetChoices[PetChoices.Cats]]);
  });

  it('flattens pets, demographics and accessibility into one list', () => {
    const labels = shelterAttributeLabels({
      pets: [{ name: PetChoices.Cats }],
      demographics: [{ name: DemographicChoices.SingleWomen }],
      accessibility: [{ name: AccessibilityChoices.WheelchairAccessible }],
    });

    expect(labels).toEqual([
      enumDisplayPetChoices[PetChoices.Cats],
      enumDisplayDemographics[DemographicChoices.SingleWomen],
      enumDisplayAccessibilityChoices[
        AccessibilityChoices.WheelchairAccessible
      ],
    ]);
  });

  it('produces labels that match tags can compare against', () => {
    // Guards the real failure mode: if this returned raw enum names, every
    // client-need comparison in matchTags would miss and render gray.
    const labels = shelterAttributeLabels({
      accessibility: [{ name: AccessibilityChoices.AdaRooms }],
    });

    expect(labels[0]).toBe('ADA Rooms Available');
    expect(labels[0]).not.toBe(AccessibilityChoices.AdaRooms);
  });

  it('returns an empty list when the shelter has no attributes', () => {
    expect(shelterAttributeLabels({})).toEqual([]);
  });

  it('tolerates null / undefined attribute lists', () => {
    expect(
      shelterAttributeLabels({ pets: null, demographics: undefined }),
    ).toEqual([]);
  });

  it('skips entries with a null name rather than emitting undefined', () => {
    const labels = shelterAttributeLabels({
      pets: [{ name: null }, { name: PetChoices.Exotics }],
    });

    expect(labels).toEqual([enumDisplayPetChoices[PetChoices.Exotics]]);
    expect(labels).not.toContain(undefined);
  });

  it('preserves multiple attributes within a single category', () => {
    const labels = shelterAttributeLabels({
      pets: [{ name: PetChoices.Cats }, { name: PetChoices.PetArea }],
    });

    expect(labels).toHaveLength(2);
  });
});
