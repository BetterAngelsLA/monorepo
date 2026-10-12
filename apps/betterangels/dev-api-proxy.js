/**
 * Dev-only same-origin API proxy for the Expo **web** dev server.
 *
 * A local web build cannot call a deployed API directly: CORS and the CSRF
 * origin allowlist reject it, the `csrftoken` cookie is scoped to
 * `.dev.betterangels.la` so `document.cookie` on localhost cannot read it, and
 * `SameSite=Lax` keeps the session cookie off a cross-site fetch. Serving the API
 * from the page's own origin fixes all four, the way Vite's `server.proxy` does,
 * via Metro's documented `server.enhanceMiddleware` hook. (Expo's own equivalent,
 * Router `+api` routes, is gated on `web.output === 'server'`, which would mean
 * giving up the SPA bundle deployed to S3 + CloudFront.)
 *
 * Forwarding alone is not enough — hence the two rewrites: the request `Origin`
 * becomes the upstream API's own origin (Django compares it against
 * `CSRF_TRUSTED_ORIGINS` or the host), and the response `Set-Cookie` has `Domain`
 * and `Secure` stripped so the browser stores the cookies for `localhost` over
 * plain http and the page can read `csrftoken`. (`SameSite=None` is rejected
 * without `Secure`, so it is downgraded to `Lax`.)
 *
 * Enable with:
 *
 *   BA_DEV_PROXY_TARGET=https://api.dev.betterangels.la
 *   EXPO_PUBLIC_API_URL=http://localhost:8081/__api
 *
 * Native builds never load metro.config.js's web middleware and are unaffected.
 * See docs/outreach-web.md for the full reasoning.
 */

const http = require('http');
const https = require('https');

const DEFAULT_PREFIX = '/__api';

/**
 * Paths the CSRF interceptor fetches at the **origin root**, outside the API
 * prefix: `createCsrfInterceptor` mints a token by GETting `<origin>/admin/login/`.
 * Without these the token bootstrap misses the proxy and returns dev-server HTML.
 */
const DEFAULT_BOOTSTRAP_PATHS = ['/admin/login'];

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
 * @returns {((middleware: any, server: any) => any) | null} a Metro
 * `enhanceMiddleware` function, or `null` when no target is configured.
 */
function createDevApiProxy(options = {}) {
  const prefix = options.prefix ?? DEFAULT_PREFIX;
  const target = options.target ?? process.env.BA_DEV_PROXY_TARGET ?? '';
  const bootstrapPaths = options.bootstrapPaths ?? DEFAULT_BOOTSTRAP_PATHS;

  const owns = (url) =>
    url.startsWith(`${prefix}/`) ||
    url === prefix ||
    (!!target && bootstrapPaths.some((p) => url.startsWith(p)));

  return (middleware) => (req, res, next) => {
    // Always claim the API prefix so a missing target fails legibly rather than
    // 404ing through the dev server as if the app were misconfigured.
    const isApiPath = req.url.startsWith(`${prefix}/`) || req.url === prefix;

    if (!owns(req.url)) return middleware(req, res, next);

    if (!target) {
      if (!isApiPath) return middleware(req, res, next);
      return sendJson(res, 502, {
        error: 'Dev API proxy is not configured.',
        hint:
          'Start the dev server with BA_DEV_PROXY_TARGET set, e.g. ' +
          'BA_DEV_PROXY_TARGET=https://api.dev.betterangels.la yarn nx serve betterangels',
      });
    }

    const targetUrl = new URL(target);
    const upstreamPath = isApiPath
      ? req.url.slice(prefix.length) || '/'
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
