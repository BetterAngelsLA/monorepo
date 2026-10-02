import { toInstagramUrl } from '@monorepo/react/shared';
import { ReactNode } from 'react';
import { Link } from './Link';
import { TLink } from './types';

export type TInstagramLink = Omit<TLink, 'href' | 'type'> & {
  /** Instagram handle (e.g. `"@betterangels"`) or profile href. */
  handleOrHref?: string | null;
  /** Rendered when the handle/href can't be resolved (default: nothing). */
  fallback?: ReactNode;
};

/**
 * Renders a `Link` to an Instagram profile.
 *
 * `handleOrHref` accepts a handle (`@betterangels`, `betterangels`) or a URL
 * (`instagram.com/betterangels`) and is resolved via `toInstagramUrl`.
 */
export function InstagramLink(props: TInstagramLink) {
  const { handleOrHref, fallback = null, ...linkProps } = props;

  const href = toInstagramUrl(handleOrHref);

  if (!href) {
    return <>{fallback}</>;
  }

  return <Link {...linkProps} href={href} />;
}
