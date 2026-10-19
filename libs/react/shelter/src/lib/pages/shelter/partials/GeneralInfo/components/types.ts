import { ReactElement } from 'react';

/** Rows whose value is a URL, handle, or dialable number. */
export type TLinkInfoType = 'website' | 'instagram' | 'phone' | 'email';

/** The GraphQL `ShelterLocationType` fields the location row uses. */
export type TContactLocation = {
  latitude?: number | null;
  longitude?: number | null;
  /** GraphQL `place` — a venue name or a street address. */
  place?: string | null;
};

type TContactInfoBase = {
  label?: string | null;
  icon: ReactElement;
  className?: string;
};

type TContactInfoLinkRow = TContactInfoBase & {
  type: TLinkInfoType;
  href?: string | null;
};

type TContactInfoLocationRow = TContactInfoBase & {
  type: 'location';
  location?: TContactLocation | null;
};

export type TContactInfoRow = TContactInfoLinkRow | TContactInfoLocationRow;
