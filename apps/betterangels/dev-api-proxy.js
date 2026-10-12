/**
 * Dev-only same-origin API proxy for the Expo **web** dev server.
 *
 * A local web build cannot call a deployed API directly: CORS and the CSRF origin
 * allowlist reject it, the `csrftoken` cookie is scoped to `.dev.betterangels.la`,
 * and `SameSite=Lax` keeps the session cookie off a cross-site fetch. Serving the
 * API from the page's own origin fixes all of that, via Metro's
 * `server.enhanceMiddleware` hook. (Expo's `+api` routes would need
 * `web.output === 'server'`, giving up the SPA bundle.)
 *
 * Forwarding alone is not enough — hence the two rewrites: the request `Origin`
 * becomes the upstream API's own origin (Django checks it against
 * `CSRF_TRUSTED_ORIGINS`), and the response `Set-Cookie` drops `Domain` and
 * `Secure` so the browser stores them for `localhost` over plain http.
 *
 * Two ways to point it:
 *
 *   BA_DEV_PROXY_TARGET=https://api.dev.betterangels.la
 *   EXPO_PUBLIC_API_URL=http://localhost:8081/__api
 *
 *   BA_DEV_PROXY_TARGETS=dev=https://api.dev.betterangels.la,prod=https://api.betterangels.la
 *   EXPO_PUBLIC_API_URL=http://localhost:8081/__api/dev
 *   EXPO_PUBLIC_DEMO_API_URL=http://localhost:8081/__api/prod
 *
 * The second form serves each target under `/__api/<name>`, so the app's
 * environment switcher can move between them without restarting the dev server.
 * Cookies are namespaced per target (see `namespaceSetCookie`) because every
 * target shares one `localhost` cookie jar, and the CSRF bootstrap lives under the
 * target's prefix (`/__api/dev/admin/login/`) rather than the origin root.
 *
 * Native builds never load metro.config.js's web middleware and are unaffected.
 */

const http = require('http');
const https = require('https');

const API_PREFIX = '/__api';

/**
 * Paths the CSRF interceptor fetches at the **origin root**, outside the API
 * prefix: `createCsrfInterceptor` mints a token by GETting `<origin>/admin/login/`.
 * Only the single-target form needs these — a named target is reached through its
 * prefix, so its bootstrap is `/__api/<name>/admin/login/`.
 */
const CSRF_BOOTSTRAP_PATHS = ['/admin/login'];

/**
 * Cookie names the app reads from `document.cookie` and must keep reachable from
 * every path, so they are namespaced but not path-scoped. `sessionid` is
 * `HttpOnly` — nothing in the app reads it — so it is scoped to its target's
 * prefix, which is also what stops one target's session being sent to another.
 */
const APP_READABLE_COOKIES = new Set(['csrftoken']);

/**
 * Read the configured targets.
 *
 * `BA_DEV_PROXY_TARGETS` is a comma-separated `name=url` list served under
 * `/__api/<name>`; `BA_DEV_PROXY_TARGET` remains the single unprefixed target.
 */
function readTargets() {
  const named = new Map();

  for (const entry of (process.env.BA_DEV_PROXY_TARGETS ?? '').split(',')) {
    const separator = entry.indexOf('=');
    if (separator === -1) continue;

    const name = entry.slice(0, separator).trim();
    const url = entry.slice(separator + 1).trim();

    if (name && url) named.set(name, url);
  }

  return { named, single: process.env.BA_DEV_PROXY_TARGET ?? '' };
}

/**
 * Which target a request belongs to, and the path to ask it for.
 *
 * Returns `null` for a request the proxy does not own.
 */
function routeRequest(rawUrl, { named, single }) {
  const queryAt = rawUrl.indexOf('?');
  const pathname = queryAt === -1 ? rawUrl : rawUrl.slice(0, queryAt);
  const query = queryAt === -1 ? '' : rawUrl.slice(queryAt);

  const segments = pathname.split('/');
  const underPrefix = segments[1] === API_PREFIX.slice(1);

  if (!underPrefix) {
    // The CSRF bootstrap a single-target dev server mints at the origin root.
    const bootstrap = CSRF_BOOTSTRAP_PATHS.some((p) => pathname.startsWith(p));

    if (!bootstrap || !single) return null;

    return {
      env: null,
      target: single,
      upstreamPath: pathname + query,
      prefix: API_PREFIX,
    };
  }

  const name = segments[2];

  if (name && named.has(name)) {
    return {
      env: name,
      target: named.get(name),
      upstreamPath: '/' + segments.slice(3).join('/') + query,
      prefix: `${API_PREFIX}/${name}`,
    };
  }

  if (!single) return null;

  return {
    env: null,
    target: single,
    upstreamPath: rawUrl.slice(API_PREFIX.length) || '/',
    prefix: API_PREFIX,
  };
}

/** Strip the attributes that stop a browser storing a cross-domain cookie. */
function rewriteSetCookie(cookie) {
  let out = cookie
    .replace(/;\s*Domain=[^;]*/gi, '')
    .replace(/;\s*Secure/gi, '');

  if (/;\s*SameSite=None/i.test(out)) {
    // A `SameSite=None` cookie without `Secure` is rejected outright.
    out = out.replace(/;\s*SameSite=None/gi, '; SameSite=Lax');
  }

  return out;
}

/**
 * Give a target's cookie a name of its own, so two targets can be signed in at
 * once from the same `localhost` jar, and scope it to the target's prefix unless
 * the app has to be able to read it.
 */
function namespaceSetCookie(cookie, env) {
  if (!env) return cookie;

  const separator = cookie.indexOf('=');
  if (separator === -1) return cookie;

  const name = cookie.slice(0, separator).trim();
  const value = cookie.slice(separator);
  const path = APP_READABLE_COOKIES.has(name) ? '/' : `${API_PREFIX}/${env}/`;

  return `${env}_${name}${value.replace(/;\s*Path=[^;]*/gi, '')}; Path=${path}`;
}

/** The inverse: this target's cookies travel under their real names, and no others travel at all. */
function stripRequestCookies(cookieHeader, env, names) {
  if (!env) return cookieHeader;

  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) => {
      const separator = part.indexOf('=');
      const name = separator === -1 ? part : part.slice(0, separator);
      const value = separator === -1 ? '' : part.slice(separator);

      for (const other of names) {
        if (other !== env && name.startsWith(`${other}_`)) return [];
      }

      return [
        `${name.startsWith(`${env}_`) ? name.slice(env.length + 1) : name}${value}`,
      ];
    })
    .join('; ');
}

/** Keep redirects on the proxy origin instead of leaking the API host. */
function rewriteLocation(location, target, prefix) {
  for (const base of [
    target.origin,
    `https://${target.host}`,
    `http://${target.host}`,
  ]) {
    if (location.startsWith(base)) {
      return prefix + location.slice(base.length);
    }
  }
  return location;
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

/**
 * @returns {(middleware: any, server: any) => any} a Metro `enhanceMiddleware`
 * function. Inert unless a target is configured.
 */
function createDevApiProxy() {
  const targets = readTargets();
  const names = [...targets.named.keys()];
  const configured = !!targets.single || names.length > 0;

  return (middleware) => (req, res, next) => {
    const route = routeRequest(req.url, targets);
    const isApiPath =
      req.url.startsWith(`${API_PREFIX}/`) || req.url === API_PREFIX;

    if (!route) {
      // Nothing configured still claims the API prefix, so a misconfiguration
      // fails legibly rather than 404ing through the dev server.
      if (configured || !isApiPath) return middleware(req, res, next);

      return sendJson(res, 502, {
        error: 'Dev API proxy is not configured.',
        hint:
          'Start the dev server with BA_DEV_PROXY_TARGET set, e.g. ' +
          'BA_DEV_PROXY_TARGET=https://api.dev.betterangels.la yarn nx serve betterangels, ' +
          `and point the app at EXPO_PUBLIC_API_URL=http://${req.headers.host}${API_PREFIX}. ` +
          'To serve several at once, use ' +
          'BA_DEV_PROXY_TARGETS=dev=https://api.dev.betterangels.la,prod=https://api.betterangels.la',
      });
    }

    const { env, target, upstreamPath, prefix } = route;
    const targetUrl = new URL(target);
    const isHttps = targetUrl.protocol === 'https:';
    const transport = isHttps ? https : http;

    const headers = { ...req.headers };
    headers.host = targetUrl.host;
    // Django's CSRF check compares Origin with the request host or
    // CSRF_TRUSTED_ORIGINS; claiming the API's own origin satisfies both.
    headers.origin = targetUrl.origin;
    if (headers.referer) headers.referer = `${targetUrl.origin}/`;
    if (headers.cookie) {
      headers.cookie = stripRequestCookies(headers.cookie, env, names);
    }

    const upstream = transport.request(
      {
        protocol: targetUrl.protocol,
        hostname: targetUrl.hostname,
        port: targetUrl.port || (isHttps ? 443 : 80),
        method: req.method,
        path: upstreamPath,
        headers,
      },
      (upstreamRes) => {
        const outHeaders = { ...upstreamRes.headers };

        if (outHeaders['set-cookie']) {
          outHeaders['set-cookie'] = outHeaders['set-cookie'].map((cookie) =>
            namespaceSetCookie(rewriteSetCookie(cookie), env),
          );
        }
        if (outHeaders.location) {
          outHeaders.location = rewriteLocation(
            outHeaders.location,
            targetUrl,
            prefix,
          );
        }

        res.writeHead(upstreamRes.statusCode ?? 502, outHeaders);
        upstreamRes.pipe(res);
      },
    );

    upstream.on('error', (err) => {
      if (res.headersSent) return res.destroy();
      sendJson(res, 502, {
        error: 'Dev API proxy could not reach the upstream API.',
        target,
        detail: String(err && err.message ? err.message : err),
      });
    });

    // Stream the request body straight through (GraphQL and form posts).
    req.pipe(upstream);
  };
}

module.exports = { createDevApiProxy };
