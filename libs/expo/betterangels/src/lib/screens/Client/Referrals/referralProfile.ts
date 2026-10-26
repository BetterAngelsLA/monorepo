import { isNonNullish } from 'remeda';
import type { AdaAccommodationEnum, VeteranStatusEnum } from '../../../apollo';
import {
  enumDisplayAdaAccommodationEnum,
  enumDisplayVeteranStatus,
} from '../../../static';

export type ProfileCardData = {
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  displayGender?: string | null;
  age?: number | null;
  veteranStatus?: VeteranStatusEnum | null;
  adaAccommodation?: readonly (AdaAccommodationEnum | null)[] | null;
  householdMembers?: readonly unknown[] | null;
};

type ProfileRow = {
  label: string;
  value: string | null;
  pii?: boolean;
  /**
   * Required on purpose: the export shares every row it is not told to
   * withhold, so a new profile fact must state its classification instead of
   * defaulting into the standard copy.
   */
  sensitive: boolean;
};

/** The same current-profile facts in the intake form and the reviewed export. */
export function referralProfileRows(
  profile?: ProfileCardData | null,
  fallbackName = '',
): readonly ProfileRow[] {
  const p = profile ?? {};
  const fullName =
    [p.firstName, p.lastName].filter(Boolean).join(' ') || fallbackName.trim();
  const name = [fullName, p.nickname ? `(${p.nickname})` : '']
    .filter(Boolean)
    .join(' ');
  const accommodations = (p.adaAccommodation ?? [])
    .filter(isNonNullish)
    .map((value) => enumDisplayAdaAccommodationEnum[value])
    .join(', ');
  return [
    { label: 'Name', value: name || null, pii: true, sensitive: false },
    {
      label: 'Gender',
      value: p.displayGender || null,
      pii: true,
      sensitive: false,
    },
    {
      label: 'Age',
      value: p.age != null ? String(p.age) : null,
      pii: true,
      sensitive: false,
    },
    {
      label: 'Accommodations',
      value: accommodations || null,
      sensitive: true,
    },
    {
      label: 'Partners / household',
      value: p.householdMembers?.length
        ? `${p.householdMembers.length} on file`
        : 'None on file',
      sensitive: false,
    },
    {
      label: 'Veteran',
      value: p.veteranStatus ? enumDisplayVeteranStatus[p.veteranStatus] : null,
      sensitive: false,
    },
  ];
}
