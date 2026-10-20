import { downloadInBrowser } from './downloadInBrowser';

/**
 * Hand a generated Blob to the browser's download machinery.
 *
 * Used where a native app would call the share sheet (text and image exports).
 * The native app never has a `document`, so this returns `false` instead of
 * throwing — the caller decides how to report the failure.
 */
export function downloadBlobInBrowser(
  contents: BlobPart,
  filename: string,
  type: string,
): boolean {
  if (
    typeof document === 'undefined' ||
    typeof Blob === 'undefined' ||
    typeof URL === 'undefined' ||
    typeof URL.createObjectURL !== 'function'
  ) {
    return false;
  }

  const url = URL.createObjectURL(new Blob([contents], { type }));
  try {
    return downloadInBrowser(url, filename);
  } finally {
    // Safari/Android WebView can still be reading the blob right after the
    // click; revoking at 0 ms intermittently cancels the download.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
