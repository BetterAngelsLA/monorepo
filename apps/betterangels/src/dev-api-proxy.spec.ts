import { describe, expect, it, vi } from 'vitest';

import {
  API_PREFIX,
  deriveProxyTargets,
  namespaceSetCookie,
  readTargets,
  rewriteLocation,
  rewriteSetCookie,
  routeRequest,
  stripRequestCookies,
} from '../dev-api-proxy';
import { buildApiEnvironments, DEV_API_PROXY_PREFIX } from './apiEnvironments';

/**
 * The proxy delegates forwarding to `http-proxy-middleware`. What is left here is
 * the part a library cannot know: which named targets the app's own API URLs
 * imply, and how each target's cookies are kept apart on one `localhost` jar.
 * These pin that contract — including the `<target>_csrftoken` name and
 * `Path=/`, which the web fetch client reads from `document.cookie`.
 */

const APP_ENV = {
  EXPO_PUBLIC_API_URL: 'https://api.betterangels.la',
  EXPO_PUBLIC_DEMO_API_URL: 'https://api.dev.betterangels.la',
};

const LOCAL_ENV = {
  ...APP_ENV,
  EXPO_PUBLIC_LOCAL_API_URL: 'http://localhost:8000',
};

describe('deriveProxyTargets', () => {
  it('names each target after the app environment its variable defines', () => {
    expect([...deriveProxyTargets(LOCAL_ENV)]).toEqual([
      ['production', 'https://api.betterangels.la'],
      ['demo', 'https://api.dev.betterangels.la'],
      ['local', 'http://localhost:8000'],
    ]);
  });

  it('derives only the targets whose variable is set', () => {
    expect([
      ...deriveProxyTargets({
        EXPO_PUBLIC_DEMO_API_URL: APP_ENV.EXPO_PUBLIC_DEMO_API_URL,
      }),
    ]).toEqual([['demo', 'https://api.dev.betterangels.la']]);
  });

  it('is empty when nothing is set', () => {
    expect([...deriveProxyTargets({})]).toEqual([]);
  });

  it.each([undefined, '', '   '])('skips a blank value (%j)', (value) => {
    expect([...deriveProxyTargets({ EXPO_PUBLIC_API_URL: value })]).toEqual([]);
  });

  it('trims the value', () => {
    expect([
      ...deriveProxyTargets({
        EXPO_PUBLIC_API_URL: '  https://api.betterangels.la  ',
      }),
    ]).toEqual([['production', 'https://api.betterangels.la']]);
  });

  it.each([
    'http://localhost:8081/__api',
    'http://localhost:8081/__api/production',
    'https://example.test/__api/demo',
  ])(
    'refuses %s, which points at the proxy itself and would forward forever',
    (selfReferential) => {
      const warn = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      expect([
        ...deriveProxyTargets({ EXPO_PUBLIC_API_URL: selfReferential }),
      ]).toEqual([]);
      expect(warn).toHaveBeenCalledOnce();

      warn.mockRestore();
    },
  );

  it('reports the ignored variable, which the browser 502 carries', () => {
    const warn = vi.spyOn(console, 'warn').mockReturnValue(undefined);
    const ignored: { variable: string; url: string; name: string }[] = [];

    deriveProxyTargets(
      { EXPO_PUBLIC_API_URL: 'http://localhost:8081/__api/production' },
      (entry) => ignored.push(entry),
    );

    // The stdout warning is invisible to whoever is looking at the page.
    expect(ignored).toEqual([
      {
        variable: 'EXPO_PUBLIC_API_URL',
        url: 'http://localhost:8081/__api/production',
        name: 'production',
      },
    ]);

    warn.mockRestore();
  });

  it('still accepts a deployed API whose path merely contains the word api', () => {
    expect([
      ...deriveProxyTargets({
        EXPO_PUBLIC_API_URL: 'https://api.dev.betterangels.la',
      }),
    ]).toEqual([['production', 'https://api.dev.betterangels.la']]);
  });
});

describe('readTargets', () => {
  it('derives the app targets when nothing else is configured', () => {
    expect([...readTargets(APP_ENV)]).toEqual([
      ['production', 'https://api.betterangels.la'],
      ['demo', 'https://api.dev.betterangels.la'],
    ]);
  });

  it('lets BA_DEV_PROXY_TARGETS add to and override the derived targets', () => {
    expect([
      ...readTargets({
        ...APP_ENV,
        BA_DEV_PROXY_TARGETS:
          'production=https://api.override.test,staging=https://api.staging.test',
      }),
    ]).toEqual([
      ['production', 'https://api.override.test'],
      ['demo', 'https://api.dev.betterangels.la'],
      ['staging', 'https://api.staging.test'],
    ]);
  });

  it('ignores malformed BA_DEV_PROXY_TARGETS entries', () => {
    expect([
      ...readTargets({
        ...APP_ENV,
        BA_DEV_PROXY_TARGETS: 'nonsense,=https://api.noname.test,noname=',
      }).keys(),
    ]).toEqual(['production', 'demo']);
  });

  // Precedence is explicit > derived > none, and this is the case that makes it
  // load-bearing: a shell still pointing the variables at the proxy (the old
  // documented flow) plus the explicit list is a working dev server. The skip
  // above must never reach an explicitly configured target, and the derived ones
  // must not linger to shadow it.
  it('serves the explicit list when the derived values point at the proxy', () => {
    const warn = vi.spyOn(console, 'warn').mockReturnValue(undefined);

    const named = readTargets({
      EXPO_PUBLIC_API_URL: 'http://localhost:8081/__api/production',
      EXPO_PUBLIC_DEMO_API_URL: 'http://localhost:8081/__api/demo',
      BA_DEV_PROXY_TARGETS:
        'production=https://api.betterangels.la,demo=https://api.dev.betterangels.la',
    });

    expect([...named]).toEqual([
      ['production', 'https://api.betterangels.la'],
      ['demo', 'https://api.dev.betterangels.la'],
    ]);
    // Two derived values skipped, one warning each — the operator has to see why.
    expect(warn).toHaveBeenCalledTimes(2);

    warn.mockRestore();
  });

  // The skip is for *derived* values, which are the app's own API URLs and a
  // leftover when they carry the prefix. An explicit list is an operator stating
  // the target, and is taken at face value.
  it('never skips an explicitly configured target, even one under /__api', () => {
    const warn = vi.spyOn(console, 'warn').mockReturnValue(undefined);

    expect([
      ...readTargets({
        BA_DEV_PROXY_TARGETS: 'explicit=http://localhost:8081/__api',
      }),
    ]).toEqual([['explicit', 'http://localhost:8081/__api']]);
    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
  });

  it('is entirely empty when nothing is set, so the middleware stays inert', () => {
    expect([...readTargets({})]).toEqual([]);
  });
});

describe('routeRequest', () => {
  const names = new Set(['production', 'demo']);

  it('names the target a prefixed request belongs to', () => {
    expect(routeRequest('/__api/demo/graphql?x=1', names)).toEqual({
      name: 'demo',
    });
  });

  it('names a bare target prefix too', () => {
    expect(routeRequest('/__api/demo', names)).toEqual({ name: 'demo' });
  });

  it.each(['/__api/typo', '/__api', '/__api/typo/x'])(
    'reports %s as an unknown target rather than guessing one',
    (path) => {
      expect(routeRequest(path, names)).toEqual({
        unknown: path.split('/')[2] ?? '',
      });
    },
  );

  it.each(['/', '/index.html', '/admin/login', '/__apiary/x'])(
    'leaves %s to the dev server',
    (path) => {
      expect(routeRequest(path, names)).toBeNull();
    },
  );

  it('reports every target as unknown when none is configured', () => {
    expect(routeRequest('/__api/production/graphql', new Set())).toEqual({
      unknown: 'production',
    });
  });
});

describe('per-target cookie isolation', () => {
  it('names an upstream cookie after its target', () => {
    expect(namespaceSetCookie('sessionid=abc; Path=/; HttpOnly', 'demo')).toBe(
      'demo_sessionid=abc; HttpOnly; Path=/__api/demo/',
    );
  });

  // The app reads this one from `document.cookie`, so it must not be scoped to
  // the target prefix, and must be named `<target>_csrftoken`.
  it('keeps the CSRF cookie readable from any path', () => {
    expect(namespaceSetCookie('csrftoken=tok; Path=/', 'demo')).toBe(
      'demo_csrftoken=tok; Path=/',
    );
  });

  it.each([
    [
      'sessionid=abc; Domain=api.dev.betterangels.la; Path=/; Secure; SameSite=None',
      'demo_sessionid=abc; SameSite=Lax; Path=/__api/demo/',
    ],
    [
      'csrftoken=tok; Domain=.dev.betterangels.la; Secure',
      'demo_csrftoken=tok; Path=/',
    ],
  ])('drops Domain and Secure from %s', (cookie, expected) => {
    expect(namespaceSetCookie(rewriteSetCookie(cookie), 'demo')).toBe(expected);
  });

  it("sends this target's cookies under their real names", () => {
    expect(
      stripRequestCookies('demo_sessionid=a; demo_csrftoken=b', 'demo', [
        'demo',
        'production',
      ]),
    ).toBe('sessionid=a; csrftoken=b');
  });

  it("never sends another target's cookies, hashed or plain", () => {
    expect(
      stripRequestCookies(
        'demo_sessionid=a; production_sessionid=leak; production_csrftoken=leak2; other=keep',
        'demo',
        ['demo', 'production'],
      ),
    ).toBe('sessionid=a; other=keep');
  });

  it('drops an un-prefixed session cookie left by the single-target form', () => {
    // Every target is sent this header, and Django parses last-wins, so a stale
    // un-prefixed `sessionid` would outrank the target's own.
    expect(
      stripRequestCookies(
        'sessionid=legacy; csrftoken=legacy; demo_sessionid=fresh; demo_csrftoken=fresh2',
        'demo',
        ['demo', 'production'],
      ),
    ).toBe('sessionid=fresh; csrftoken=fresh2');
  });

  it('does not let a target name shadow one that extends it', () => {
    expect(
      stripRequestCookies('a_sessionid=x; a_b_sessionid=y', 'a_b', [
        'a',
        'a_b',
      ]),
    ).toBe('sessionid=y');
  });
});

describe('rewriteLocation', () => {
  const api = new URL('https://api.dev.betterangels.la');

  it('keeps a redirect on the proxy origin, under the target prefix', () => {
    expect(
      rewriteLocation(
        'https://api.dev.betterangels.la/admin/login/',
        api,
        '/__api/demo',
      ),
    ).toBe('/__api/demo/admin/login/');
  });

  it('keeps the query and fragment', () => {
    expect(
      rewriteLocation(
        'https://api.dev.betterangels.la/accounts/login/?next=/x#y',
        api,
        '/__api/demo',
      ),
    ).toBe('/__api/demo/accounts/login/?next=/x#y');
  });

  it("leaves another host's redirect alone", () => {
    expect(rewriteLocation('https://example.test/x', api, '/__api/demo')).toBe(
      'https://example.test/x',
    );
  });

  it('prefixes a path-absolute redirect, which is the shape Django sends', () => {
    expect(rewriteLocation('/accounts/login/', api, '/__api/demo')).toBe(
      '/__api/demo/accounts/login/',
    );
  });

  it('prefixes a protocol-relative redirect to the same host', () => {
    expect(
      rewriteLocation(
        '//api.dev.betterangels.la/accounts/login/',
        api,
        '/__api/demo',
      ),
    ).toBe('/__api/demo/accounts/login/');
  });

  it('does not apply a target base path a second time', () => {
    expect(
      rewriteLocation(
        'https://api.dev.betterangels.la/base/after',
        new URL('https://api.dev.betterangels.la/base'),
        '/__api/demo',
      ),
    ).toBe('/__api/demo/after');
  });

  it('leaves a Location with no path alone', () => {
    expect(rewriteLocation('', api, '/__api/demo')).toBe('');
  });
});

describe('the app and the proxy agree on target names', () => {
  it('serves a target for every environment the web build asks for', () => {
    const environments = buildApiEnvironments({
      platform: 'web',
      isDev: true,
      webOrigin: 'http://localhost:8081',
      apiUrl: LOCAL_ENV.EXPO_PUBLIC_API_URL,
      demoApiUrl: LOCAL_ENV.EXPO_PUBLIC_DEMO_API_URL,
      localApiUrl: LOCAL_ENV.EXPO_PUBLIC_LOCAL_API_URL,
    });

    const named = deriveProxyTargets(LOCAL_ENV);

    // The proxy owns the literal, and the web build builds URLs from the app's
    // copy of it: if they drift every request 404s through Metro while these
    // tests stay green.
    expect(DEV_API_PROXY_PREFIX).toBe(API_PREFIX);
    expect(environments.map(({ name }) => name)).toEqual([...named.keys()]);

    for (const { name, url } of environments) {
      expect(url).toBe(`http://localhost:8081${DEV_API_PROXY_PREFIX}/${name}`);
      expect(named.has(name)).toBe(true);
    }
  });
});
