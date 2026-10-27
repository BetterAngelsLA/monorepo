import { formatMemberName } from './formatMemberName';

type TPerson = {
  firstName?: string | null;
  lastName?: string | null;
};

type TNamed = { name?: string | null } | null | undefined;

/**
 * `Created by Ada Lovelace · Org · Team`, or `''` when there is no creator.
 *
 * Composed rather than composed-in-JSX so the card footer and anything else
 * that attributes a task render the same sentence.
 */
export function formatCreatedBy(
  createdBy?: TPerson | null,
  organization?: TNamed,
  team?: TNamed,
): string {
  const name = formatMemberName(createdBy);

  if (!name) return '';

  const affiliation = [organization?.name, team?.name]
    .filter(Boolean)
    .join(' · ');

  return [`Created by ${name}`, affiliation].filter(Boolean).join(' · ');
}
