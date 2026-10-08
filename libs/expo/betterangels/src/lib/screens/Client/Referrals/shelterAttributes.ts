/**
 * Pure shelter-attribute logic, deliberately free of React Native imports so it
 * can be unit-tested without the native/UI dependency chain.
 */
import { Colors } from '@monorepo/expo/shared/static';
import { isNonNullish } from 'remeda';
import {
  AccessibilityChoices,
  DemographicChoices,
  PetChoices,
} from '../../../apollo';
import {
  INTAKE_FIELDS,
  type IntakeFieldDefinition,
  type ShelterMatchCategory,
} from './intakeFields';

// Why a tag is on the card, independent of its colour. Callers partition on
// this rather than comparing against Colors.* — a palette change shouldn't
// silently alter which tags are treated as decision-relevant.
//   match   = shelter offers something the client needs
//   gap     = client needs it, and the shelter reported that *category* of
//             attribute without listing it — a confirmed mismatch
//   unknown = client needs it but the shelter never reported that category, so
//             we cannot say either way. Distinct from `gap` on purpose: absence
//             of data is not evidence of absence, and coverage is patchy per
//             category (in the team's export: pets 33, demographics 32,
//             accessibility 24 of 206).
//   other   = shelter offers it, client stated no need for it
export type TTagKind = 'match' | 'gap' | 'unknown' | 'other';

// `solid` fills the badge; `outline` draws colour on the border and text only,
// so an unconfirmed tag reads as weaker than a confirmed one at a glance.
export type TTagVariant = 'solid' | 'outline';

// `kind`/`variant` are optional because TagRow also renders standalone tags
// that aren't attribute matches at all (e.g. the referral status pill in
// ReferralsTab).
export type TTag = {
  label: string;
  color: string;
  kind?: TTagKind;
  variant?: TTagVariant;
};

// The three attribute lists a shelter reports independently. Which of them a
// given label came from is what makes "unreported" answerable per attribute
// rather than only for a shelter as a whole.
export type TAttributeCategory = ShelterMatchCategory;

// Reverse index: display label -> the list it belongs to. Built from the same
// field options shelterAttributeLabels uses, so the two cannot drift; the label
// sets are disjoint (7 / 11 / 3), so a label maps to exactly one category.
const CATEGORY_BY_LABEL: Record<string, TAttributeCategory> =
  Object.fromEntries(
    INTAKE_FIELDS.flatMap((field) => {
      if (!('matching' in field)) return [];
      return field.options.map((option) => [
        option.label,
        field.matching.shelterAttribute,
      ]);
    }),
  );

// Which category a display label belongs to, or undefined for a label outside
// the known vocabulary (a caller-supplied need we can't place).
export function attributeCategoryOf(
  label: string,
): TAttributeCategory | undefined {
  return CATEGORY_BY_LABEL[label];
}

// the attribute lists ShelterCard knows how to label, as queried by both
// the shelter picker and the referral list
export type TShelterAttributeLists = {
  pets?: Array<{ name?: PetChoices | null }> | null;
  demographics?: Array<{ name?: DemographicChoices | null }> | null;
  accessibility?: Array<{ name?: AccessibilityChoices | null }> | null;
};

// flatten queried attribute lists into display labels (the API returns enum
// names like TINY_HOMES; labels live in enumDisplayMapping, mirroring
// shelter-web)
export function shelterAttributeLabels(
  shelter: TShelterAttributeLists,
  definitions: readonly IntakeFieldDefinition[] = INTAKE_FIELDS,
): string[] {
  return definitions.flatMap((field) => {
    if (field.control !== 'multiselect' || !field.matching) return [];
    return (shelter[field.matching.shelterAttribute] ?? [])
      .map(
        (attribute) =>
          field.options.find((candidate) => candidate.value === attribute.name)
            ?.label,
      )
      .filter(isNonNullish);
  });
}

// union of what the shelter offers and what the client needs: green solid =
// offered and needed, red solid = needed but confirmed absent, red outline =
// needed but unknowable because that attribute's category was never reported,
// gray = offered with no stated need. An empty `desired` list degrades to an
// all-gray row, so callers without client context (e.g. a plain shelter list)
// pass nothing — no conditionals needed on their side.
export function matchTags(
  attributes: string[],
  desired: string[] = [],
): TTag[] {
  const offered = new Set(attributes);
  const needed = new Set(desired);

  // Which categories the shelter actually reported, recovered from the offered
  // labels themselves: a category it reported nothing for contributes no
  // labels, so its absence here means "not collected" rather than "not
  // available". No extra plumbing needed — the flattened list already carries
  // this, because the label sets are disjoint per category.
  const reportedCategories = new Set(
    attributes.map(attributeCategoryOf).filter(isNonNullish),
  );

  // An unmet need is only a confirmed gap if the shelter reported that
  // category. Otherwise nobody collected the answer, so the mismatch is
  // unknown. A need outside the known vocabulary can't be placed in a category
  // at all, so it can never be confirmed either.
  const isConfirmedGap = (label: string) => {
    const category = attributeCategoryOf(label);
    return !!category && reportedCategories.has(category);
  };
  // order is load-bearing: decision-relevant tags (match, gap, unknown) come
  // first so a consumer can collapse the tail without re-sorting. See
  // ShelterCard.
  return [
    ...attributes
      .filter((label) => needed.has(label))
      .map((label) => ({
        label,
        color: Colors.SUCCESS,
        kind: 'match' as const,
        variant: 'solid' as const,
      })),
    ...desired
      .filter((label) => !offered.has(label))
      .map((label) => {
        const confirmed = isConfirmedGap(label);
        return {
          label,
          color: Colors.ERROR,
          kind: confirmed ? ('gap' as const) : ('unknown' as const),
          variant: confirmed ? ('solid' as const) : ('outline' as const),
        };
      }),
    ...attributes
      .filter((label) => !needed.has(label))
      .map((label) => ({
        label,
        color: Colors.NEUTRAL,
        kind: 'other' as const,
        variant: 'solid' as const,
      })),
  ];
}
