import { formatScalarDate } from '@monorepo/shared/scalars';
import { humanizeDateHmisProd } from './humanizeDateHmisProd';

export type PresentedDateHmisProd = {
  /** `MM/dd/yyyy` date, or the raw input when it isn't parseable. */
  date: string;
  /** Humanized relative time (e.g. `today`); `null` when unavailable. */
  relative: string | null;
};

/**
 * Split a Clarity date (`YYYY-MM-DD` or `YYYY-MM-DD HH:mm:ss`) into the
 * pieces a view presents: the absolute `MM/dd/yyyy` date and its humanized
 * relative time (e.g. `09/28/2026` + `today`). Unparseable values fall back
 * to the raw input with no relative part, so callers can always render
 * something.
 *
 * `now` is injectable for tests.
 */
export function presentDateHmisProd(
  value: string,
  now: Date = new Date(),
): PresentedDateHmisProd {
  const date = formatScalarDate(value, 'MM/dd/yyyy');

  if (!date) {
    return { date: value, relative: null };
  }

  return { date, relative: humanizeDateHmisProd(value, now) };
}
