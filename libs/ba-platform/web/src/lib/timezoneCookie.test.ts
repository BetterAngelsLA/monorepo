import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cookieDomainFor, syncTimezoneCookie } from './timezoneCookie';

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

describe('cookieDomainFor', () => {
  it('scopes to the parent domain the API also lives under', () => {
    expect(cookieDomainFor('admin.dev.betterangels.la')).toBe(
      'dev.betterangels.la',
    );
    expect(cookieDomainFor('admin.prod.betterangels.la')).toBe(
      'prod.betterangels.la',
    );
  });

  it('stays host-only for hosts it cannot scope', () => {
    expect(cookieDomainFor('localhost')).toBeUndefined();
    expect(cookieDomainFor('127.0.0.1')).toBeUndefined();
    expect(cookieDomainFor('betterangels.la')).toBeUndefined();
  });
});
