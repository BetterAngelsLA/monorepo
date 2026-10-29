/**
 * Instagram handles: letters, numbers, periods and underscores (max 30).
 *
 * Meta publishes no formal spec for usernames, so this is deliberately loose —
 * it only encodes what is certain: the 30-char limit and the allowed character
 * set. Verified empirically against the Instagram app on 2026-10-21. The
 * nearest official page is the username topic hub,
 * https://help.instagram.com/182492381886913 — it confirms that periods,
 * numbers and underscores are the allowed variants but gives no grammar.
 *
 * The app additionally rejects a leading period, a trailing period and
 * consecutive periods. Those are not enforced here on purpose: rejecting a
 * handle we merely *think* is invalid (e.g. a dotted `first.last`) breaks real
 * users, while letting one through only yields a link to a nonexistent profile.
 */
export const INSTAGRAM_HANDLE_REGEX = /^[A-Za-z0-9._]{1,30}$/;

/** Hosts that point at Instagram (legacy `instagr.am` short domain included). */
export const INSTAGRAM_HOST_REGEX =
  /^(?:www\.)?(?:instagram\.com|instagr\.am)$/i;

export const INSTAGRAM_BASE_URL = 'https://instagram.com';
