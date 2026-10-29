/**
 * Which notice the map panel shows, if any.
 *
 * A pure function rather than a chain of `if`s inside the component: this is the panel's whole
 * decision surface, and it is the part worth testing. The component then only renders.
 *
 * The order matters, and one case is not like the others:
 *
 * - **no key** means nothing can be drawn at all, so it outranks the rest;
 * - **refused** and **failed** are answers about the query, and the map is replaced;
 * - **tile-fault** is the one case where the map still renders. Replacing it is what used to
 *   unmount the layers, and then no tile could load to clear the notice — the fault outlived
 *   the network blip that caused it.
 */
export type MapNotice = 'none' | 'refused' | 'failed' | 'no-key' | 'tile-fault';

type MapNoticeInputs = {
  hasMapsKey: boolean;
  /** The reader's role withheld the interactions, or the tiles answered 403. */
  refused: boolean;
  /** The query failed for a reason that is not a refusal. */
  failed: boolean;
  /** A tile did not load, which leaves the map drawable but incomplete. */
  tileFaulted: boolean;
};

export function mapNotice({
  hasMapsKey,
  refused,
  failed,
  tileFaulted,
}: MapNoticeInputs): MapNotice {
  if (!hasMapsKey) {
    return 'no-key';
  }
  if (refused) {
    return 'refused';
  }
  if (failed) {
    return 'failed';
  }
  if (tileFaulted) {
    return 'tile-fault';
  }
  return 'none';
}
