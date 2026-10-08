import { TMapsProvider, toMapsUrl } from '@monorepo/react/shared';
import { ReactNode } from 'react';
import { TextLink } from './TextLink';
import { TLink } from './types';

export type TAddressLink = Omit<TLink, 'href' | 'type'> & {
  latitude?: number | null;
  longitude?: number | null;
  /** Human-readable address — a venue name or a street address; also the default `label`. */
  address?: string | null;
  /** `"auto"` opens Apple Maps on iOS browsers (default: `"google"`). */
  provider?: TMapsProvider;
  /** Rendered when there is nothing to map (default: nothing). */
  fallback?: ReactNode;
};

/**
 * Renders a `TextLink` that opens an address in Google Maps.
 *
 * `address` doubles as the default `label`.
 */
export function AddressLink(props: TAddressLink) {
  const {
    latitude,
    longitude,
    address,
    label,
    provider,
    fallback = null,
    ...linkProps
  } = props;

  const href = toMapsUrl({ latitude, longitude, address, provider });

  if (!href) {
    return <>{fallback}</>;
  }

  return <TextLink {...linkProps} href={href} label={label ?? address} />;
}
