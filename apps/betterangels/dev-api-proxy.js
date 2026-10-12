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
 * Enable with:
 *
 *   BA_DEV_PROXY_TARGET=https://api.dev.betterangels.la
 *   EXPO_PUBLIC_API_URL=http://localhost:8081/__api
 *
 * Native builds never load metro.config.js's web middleware and are unaffected.
 */

const http = require('http');
const https = require('https');

const API_PREFIX = '/__api';

/**
 * Paths the CSRF interceptor fetches at the **origin root**, outside the API
 * prefix: `createCsrfInterceptor` mints a token by GETting `<origin>/admin/login/`.
 * Without these the token bootstrap misses the proxy and returns dev-server HTML.
 */
const CSRF_BOOTSTRAP_PATHS = ['/admin/login'];

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
  const target = process.env.BA_DEV_PROXY_TARGET ?? '';

  const owns = (url) =>
    url.startsWith(`${API_PREFIX}/`) ||
    url === API_PREFIX ||
    (!!target && CSRF_BOOTSTRAP_PATHS.some((p) => url.startsWith(p)));

  return (middleware) => (req, res, next) => {
    // Always claim the API prefix so a missing target fails legibly rather than
    // 404ing through the dev server as if the app were misconfigured.
    const isApiPath =
      req.url.startsWith(`${API_PREFIX}/`) || req.url === API_PREFIX;

    if (!owns(req.url)) return middleware(req, res, next);

    if (!target) {
      if (!isApiPath) return middleware(req, res, next);
      return sendJson(res, 502, {
        error: 'Dev API proxy is not configured.',
        hint:
          'Start the dev server with BA_DEV_PROXY_TARGET set, e.g. ' +
          'BA_DEV_PROXY_TARGET=https://api.dev.betterangels.la yarn nx serve betterangels, ' +
          `and point the app at EXPO_PUBLIC_API_URL=http://${req.headers.host}${API_PREFIX}`,
      });
    }

    const targetUrl = new URL(target);
    const upstreamPath = isApiPath
      ? req.url.slice(API_PREFIX.length) || '/'
      : req.url;
    const isHttps = targetUrl.protocol === 'https:';
    const transport = isHttps ? https : http;

    const headers = { ...req.headers };
    headers.host = targetUrl.host;
    // Django's CSRF check compares Origin with the request host or
    // CSRF_TRUSTED_ORIGINS; claiming the API's own origin satisfies both.
    headers.origin = targetUrl.origin;
    if (headers.referer) headers.referer = `${targetUrl.origin}/`;

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
          outHeaders['set-cookie'] =
            outHeaders['set-cookie'].map(rewriteSetCookie);
        }
        if (outHeaders.location) {
          outHeaders.location = rewriteLocation(
            outHeaders.location,
            targetUrl,
            API_PREFIX,
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
