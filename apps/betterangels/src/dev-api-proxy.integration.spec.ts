import { createServer, request as httpRequest, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDevApiProxy } from '../dev-api-proxy';

/**
 * The unit specs pin the pure helpers. This one mounts the real middleware on a
 * real server in front of a real upstream, because the guarantees that actually
 * broke — the prefix being stripped, a redirect coming back under it, and a stale
 * cookie not being forwarded — live in the wiring between
 * `http-proxy-middleware` and its `pathRewrite`/`proxyReq` hooks, not in any one
 * helper. All three shipped broken while the helper specs stayed green.
 */

interface Seen {
  url: string;
  headers: Record<string, string | string[] | undefined>;
}

interface MinimalResponse {
  writeHead: (status: number, headers: Record<string, string>) => void;
  end: (body: string) => void;
}

let upstream: Server;
let devServer: Server;
let devUrl = '';
let upstreamOrigin = '';
const seen: Seen[] = [];

// Per-test upstream behaviour.
let upstreamStatus = 200;
let upstreamHeaders: Record<string, string | string[]> = {};

const listen = (server: Server) =>
  new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

const originOf = (server: Server) =>
  `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

/** Raw client, so `Location` and `Set-Cookie` arrive exactly as sent. */
const get = (path: string, headers: Record<string, string> = {}) =>
  new Promise<{
    status: number;
    headers: Record<string, string | string[] | undefined>;
    body: string;
  }>((resolve, reject) => {
    const req = httpRequest(`${devUrl}${path}`, { headers }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () =>
        resolve({ status: res.statusCode ?? 0, headers: res.headers, body }),
      );
    });

    req.on('error', reject);
    req.end();
  });

const resetUpstream = () => {
  seen.length = 0;
  upstreamStatus = 200;
  upstreamHeaders = {};
};

const savedEnv: Record<string, string | undefined> = {};

beforeAll(async () => {
  upstream = createServer((req, res) => {
    seen.push({ url: req.url ?? '', headers: req.headers });
    res.writeHead(upstreamStatus, upstreamHeaders);
    res.end('upstream');
  });

  await listen(upstream);
  upstreamOrigin = originOf(upstream);

  // `createDevApiProxy` derives its targets from `process.env` when it is called.
  for (const key of [
    'EXPO_PUBLIC_API_URL',
    'EXPO_PUBLIC_DEMO_API_URL',
    'EXPO_PUBLIC_LOCAL_API_URL',
    'BA_DEV_PROXY_TARGETS',
  ]) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }

  process.env.EXPO_PUBLIC_API_URL = upstreamOrigin;

  // Anything the proxy does not claim is the dev server's: bundler, assets, HTML.
  const devServerRoutes = (_req: unknown, res: unknown) => {
    const response = res as MinimalResponse;
    response.writeHead(200, { 'content-type': 'text/plain' });
    response.end('dev-server');
  };

  // The proxy's handler is connect's `(req, res, next)`, and `createServer` supplies
  // only two arguments — so `next` is passed here. `devServerRoutes` answers every
  // path the proxy passes on instead of calling it, so it is never reached.
  const handleRequest = createDevApiProxy()(devServerRoutes);
  const unusedNext = () => undefined;

  devServer = createServer((req, res) => handleRequest(req, res, unusedNext));
  await listen(devServer);
  devUrl = originOf(devServer);
});

afterAll(async () => {
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  await Promise.all(
    [devServer, upstream].map(
      (server) => new Promise((resolve) => server.close(resolve)),
    ),
  );
});

describe('routing', () => {
  it('strips the prefix and keeps the query', async () => {
    resetUpstream();

    const res = await get('/__api/production/admin/login/?next=/x');

    expect(res.status).toBe(200);
    expect(seen[0].url).toBe('/admin/login/?next=/x');
  });

  it('strips the prefix when there is no path after it', async () => {
    resetUpstream();

    await get('/__api/production?x=1');

    expect(seen[0].url).toBe('/?x=1');
  });

  it('leaves the dev server its own routes', async () => {
    resetUpstream();

    const res = await get('/some/bundle.js');

    expect(res.body).toBe('dev-server');
    expect(seen).toHaveLength(0);
  });

  it('answers an unknown target without reaching an upstream', async () => {
    resetUpstream();

    const res = await get('/__api/nope/x');

    expect(res.status).toBe(502);
    expect(JSON.parse(res.body)).toMatchObject({ configured: ['production'] });
    expect(seen).toHaveLength(0);
  });
});

describe('redirects', () => {
  it('brings a path-absolute Location back under the target prefix', async () => {
    resetUpstream();
    upstreamStatus = 302;
    upstreamHeaders = { location: '/admin/login/?next=/admin/' };

    const res = await get('/__api/production/admin/');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(
      '/__api/production/admin/login/?next=/admin/',
    );
  });

  it("leaves another host's Location alone", async () => {
    resetUpstream();
    upstreamStatus = 302;
    upstreamHeaders = { location: 'https://example.test/x' };

    const res = await get('/__api/production/admin/');

    expect(res.headers.location).toBe('https://example.test/x');
  });
});

describe('cookies', () => {
  it('namespaces Set-Cookie and scopes the session to the target prefix', async () => {
    resetUpstream();
    upstreamHeaders = {
      'set-cookie': [
        'csrftoken=csrf-value; Domain=.betterangels.la; Path=/; Secure',
        'sessionid=session-value; Domain=.betterangels.la; Path=/; Secure',
      ],
    };

    const res = await get('/__api/production/admin/login/');
    const cookies = [res.headers['set-cookie']].flat().join('\n');

    // `csrftoken` stays at `/` because the app reads it from `document.cookie`;
    // `sessionid` is `HttpOnly`, so nothing reads it and it can be scoped to the
    // target — which is what keeps two environments' sessions apart.
    expect(cookies).toContain('production_csrftoken=csrf-value');
    expect(cookies).toContain('production_sessionid=session-value');
    expect(cookies).toContain('Path=/__api/production/');
    // Neither attribute survives into a `localhost` jar.
    expect(cookies).not.toContain('Domain=');
    expect(cookies).not.toContain('Secure');
  });

  it('un-names this target cookies and refuses a stale un-prefixed session', async () => {
    resetUpstream();

    await get('/__api/production/admin/', {
      cookie:
        'sessionid=legacy; csrftoken=legacy; production_sessionid=fresh; production_csrftoken=fresh2',
    });

    // Django parses last-wins, so forwarding the bare `sessionid` would let a
    // stale session outrank the target's own.
    expect(seen[0].headers.cookie).toBe('sessionid=fresh; csrftoken=fresh2');
  });

  it('forwards nothing when only stale un-prefixed cookies are present', async () => {
    resetUpstream();

    await get('/__api/production/admin/', {
      cookie: 'sessionid=legacy; csrftoken=legacy',
    });

    expect(String(seen[0].headers.cookie ?? '')).not.toContain('legacy');
  });
});

describe('upstream request headers', () => {
  it("presents the API's own host and origin to Django", async () => {
    resetUpstream();

    await get('/__api/production/graphql', { origin: 'http://localhost:8081' });

    const api = new URL(upstreamOrigin);

    expect(seen[0].headers.origin).toBe(api.origin);
    expect(seen[0].headers.host).toBe(api.host);
  });
});
