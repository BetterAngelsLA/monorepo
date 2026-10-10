/**
 * Trigger a browser download of ``url``, suggesting ``filename``.
 *
 * The web counterpart to the native download/share dance: a browser has no file
 * system to hand a ``file://`` URI to and no share sheet, but it can fetch a URL
 * and save it under a name.
 *
 * Uses a detached anchor rather than ``window.open``, which popup blockers
 * reject when the call is not directly attributable to a user gesture.
 *
 * ``download`` is only a suggestion: for a cross-origin URL the server's
 * ``Content-Disposition`` filename wins, and some servers ignore it entirely.
 *
 * @returns ``true`` when the download was dispatched, ``false`` when there is no
 *   DOM to dispatch it through. The browser owns the transfer from that point,
 *   so a *later* network failure (401, 404, CORS) is not observable from here —
 *   this reports only whether we could start it, and says so rather than
 *   pretending to know more. Note that observing those would require fetching
 *   the bytes ourselves, which would reintroduce a CORS dependency the browser's
 *   own download does not have.
 */
export function downloadInBrowser(url: string, filename: string): boolean {
  // Guarded rather than assumed: this module is re-exported from a
  // platform-neutral barrel, so a native caller would otherwise fail at runtime
  // with `ReferenceError: document is not defined` instead of at build time.
  if (typeof document === 'undefined') {
    return false;
  }

  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';

  // Firefox requires the anchor to be in the document for the click to count.
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  return true;
}
