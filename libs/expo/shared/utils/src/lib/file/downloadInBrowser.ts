/**
 * Trigger a browser download of `url`, suggesting `filename` — the web
 * counterpart to the native download/share dance, since a browser has no file
 * system for a `file://` URI and no share sheet.
 *
 * A detached anchor is used rather than `window.open`, which popup blockers
 * reject for calls not attributable to a user gesture. `download` is only a
 * suggestion: for a cross-origin URL the server's `Content-Disposition` filename
 * wins.
 *
 * @returns `true` if the download was dispatched, `false` when there is no DOM to
 *   dispatch it through; a later failure (401, 404, CORS) happens once the
 *   browser owns the transfer and is not observable from here.
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
