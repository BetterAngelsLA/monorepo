/**
 * Shared props for {@link PdfViewer}.
 *
 * Lives in its own module so the native and web implementations cannot drift:
 * both import this, while the platform-suffixed files hold only the rendering.
 */
export type TPdfViewerProps = {
  url?: string;
  /** Persist a copy under cacheDirectory keyed by URL (or cacheKey). Defaults to true. */
  cache?: boolean;
  /** Override the cache key (useful for signed/expiring URLs). */
  cacheKey?: string;
  onError?: (err?: unknown) => void;
  headers?: Record<string, string>;
  /** Max number of cached PDFs to keep (newest kept). Disabled if undefined. */
  maxCacheEntries?: number;
};
