import { beforeEach, describe, expect, it, vi } from 'vitest';
import { syncTimezoneCookie } from './timezoneCookie';

const mockResolvedTimeZone = (timeZone: string | undefined) => {
  vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
    resolvedOptions: () => ({ timeZone }),
  } as unknown as Intl.DateTimeFormat);
};

describe('syncTimezoneCookie', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.cookie = 'django_timezone=; path=/; max-age=0';
  });

  it('publishes the browser time zone under the name the middleware reads', () => {
    mockResolvedTimeZone('America/New_York');

    syncTimezoneCookie();

    expect(document.cookie).toContain('django_timezone=America/New_York');
  });

  it('leaves the cookie alone when the browser reports no time zone', () => {
    mockResolvedTimeZone(undefined);

    syncTimezoneCookie();

    expect(document.cookie).not.toContain('django_timezone=');
  });
});
