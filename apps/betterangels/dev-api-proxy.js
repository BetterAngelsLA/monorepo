/**
 * Dev-only same-origin API proxy for the Expo **web** dev server, mounted through
 * Metro's `server.enhanceMiddleware`.
 *
 * A local web build cannot call a deployed API directly: CORS and the CSRF origin
 * allowlist reject it, and the `csrftoken` cookie is scoped to
 * `.dev.betterangels.la`, so the app cannot read it from `document.cookie`. Serving
 * the API from the page's own origin removes all of that.
 *
 * `http-proxy-middleware` does the forwarding, the redirects and the cross-domain
 * cookie cleanup. What is left here is only what a generic proxy cannot know: which
 * named targets to serve, and how to keep their cookies apart on the one
 * `localhost` jar they share.
 *
 * Expo's server primitives cannot replace this: `+api.ts` and `+middleware.ts` both
 * need `web.output: 'server'`, while production web is a static export
 * (`export-web` → `tools/deploy/cloudfront-deploy.mjs`) with no Node server in the
 * path; and middleware could not forward a body anyway, since it receives
 * `expo-server`'s `ImmutableRequest`, whose `json()`/`text()`/`formData()` throw.
 *
 * Targets are derived from the app's own URLs — `EXPO_PUBLIC_API_URL` →
 * `/__api/production`, `EXPO_PUBLIC_DEMO_API_URL` → `/__api/demo`,
 * `EXPO_PUBLIC_LOCAL_API_URL` → `/__api/local` — and `BA_DEV_PROXY_TARGETS=name=url,...`
 * adds or overrides. Native and production web use those URLs directly.
 */

const { createProxyMiddleware } = require('http-proxy-middleware');

const API_PREFIX = '/__api';

/**
 * Cookie names the app reads from `document.cookie`, as `<target>_<name>`.
 * `sessionid` is `HttpOnly`, so nothing reads it and it can stay path-scoped to
 * its own target — which is what isolates one environment's session from another.
 */
const APP_READABLE_COOKIES = new Set(['csrftoken']);

/** Every session cookie a target namespaces, so an un-prefixed one is a leftover. */
const AUTH_COOKIES = new Set(['csrftoken', 'sessionid']);

/** The named targets the app's own API URLs imply, in the order the app lists them. */
const ENV_TARGETS = [
  ['production', 'EXPO_PUBLIC_API_URL'],
  ['demo', 'EXPO_PUBLIC_DEMO_API_URL'],
  ['local', 'EXPO_PUBLIC_LOCAL_API_URL'],
];

/**
 * True for a URL that already points at this proxy. A leftover `…/__api` in
 * `EXPO_PUBLIC_*_API_URL` would otherwise be derived as a target pointing at the
 * dev server itself; refusing it fails legibly instead.
 */
function pointsAtProxy(url) {
  try {
    const { pathname } = new URL(url);
    return pathname === API_PREFIX || pathname.startsWith(`${API_PREFIX}/`);
  } catch {
    // Not a URL we can reason about; let it through and fail on the request.
    return false;
  }
}

/** The named targets implied by the app's environment variables. */
function deriveProxyTargets(env) {
  const named = new Map();

  for (const [name, variable] of ENV_TARGETS) {
    const url = (env[variable] ?? '').trim();
    if (!url) continue;

    if (pointsAtProxy(url)) {
      console.warn(
        `[dev-api-proxy] ignoring ${variable}=${url}: it points at the dev ` +
          'proxy itself, not at an API. Point it at the API host (e.g. ' +
          'https://api.dev.betterangels.la) — the browser adds the ' +
          `/__api/${name} prefix on its own.`,
      );
      continue;
    }

    named.set(name, url);
  }

  return named;
}

/** `name` → API base URL: derived, then added to or overridden by `BA_DEV_PROXY_TARGETS`. */
function readTargets(env = process.env) {
  const named = deriveProxyTargets(env);

  for (const entry of (env.BA_DEV_PROXY_TARGETS ?? '').split(',')) {
    const separator = entry.indexOf('=');
    if (separator === -1) continue;

    const name = entry.slice(0, separator).trim();
    const url = entry.slice(separator + 1).trim();

    if (name && url) named.set(name, url);
  }

  return named;
}

/**
 * Strip what stops a browser storing a cross-domain cookie. `Secure` goes too:
 * `http://localhost` is a secure context, but a LAN IP is not, and dropping the
 * cookie there would break sign-in.
 */
function rewriteSetCookie(cookie) {
  return (
    cookie
      .replace(/;\s*Domain=[^;]*/gi, '')
      .replace(/;\s*Secure/gi, '')
      // A `SameSite=None` cookie without `Secure` is rejected outright.
      .replace(/;\s*SameSite=None/gi, '; SameSite=Lax')
  );
}

/**
 * Name a target's cookie after it, so two targets can be signed in at once from
 * one `localhost` jar — at `Path=/` for the cookies the app reads, and scoped to
 * the target's prefix for the rest.
 */
function namespaceSetCookie(cookie, target) {
  const separator = cookie.indexOf('=');
  if (separator === -1) return cookie;

  const name = cookie.slice(0, separator).trim();
  const value = cookie.slice(separator);
  const path = APP_READABLE_COOKIES.has(name)
    ? '/'
    : `${API_PREFIX}/${target}/`;

  return `${target}_${name}${value.replace(/;\s*Path=[^;]*/gi, '')}; Path=${path}`;
}

/**
 * The inverse: only this target's cookies travel, under their real names. Every
 * target's `csrftoken` sits at `Path=/`, so without this the others would be sent
 * too.
 */
function stripRequestCookies(cookieHeader, target, names) {
  const own = `${target}_`;

  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) => {
      const separator = part.indexOf('=');
      const name = separator === -1 ? part : part.slice(0, separator);
      const value = separator === -1 ? '' : part.slice(separator);
      const mine = name.startsWith(own);

      if (!mine) {
        // A bare session cookie is a leftover from the single-target form, or
        // another tool. It goes to every target, and Django parses last-wins, so
        // forwarding it lets a stale session outrank the target's own — requests
        // silently attributed to the wrong session.
        if (AUTH_COOKIES.has(name)) return [];

        for (const other of names) {
          if (other !== target && name.startsWith(`${other}_`)) return [];
        }
      }

      return [`${mine ? name.slice(own.length) : name}${value}`];
    })
    .join('; ');
}

/**
 * Point a redirect back at this target's prefix. `pathRewrite` is request-side
 * only and http-proxy's own rewrite options cannot add a path, so a redirect has
 * to be rewritten here.
 */
function rewriteLocation(location, targetUrl, prefix) {
  // `//host/path` is the upstream's scheme, not ours, so give it one to parse.
  const absolute = location.startsWith('//') ? `http:${location}` : location;

  let parsed;
  try {
    parsed = new URL(absolute);
  } catch {
    // Path-absolute, which is the shape of nearly every Django admin and allauth
    // redirect. Left alone the browser would leave the proxy for the dev server
    // and lose the prefix, the path-scoped session and the CSRF cookie name.
    return location.startsWith('/') ? `${prefix}${location}` : location;
  }

  if (parsed.host !== targetUrl.host) return location;

  // The target may carry its own path (`https://host/base`), and http-proxy
  // prepends that on the way out — so prefixing the whole pathname would apply
  // it a second time.
  const base = targetUrl.pathname.replace(/\/+$/, '');
  const rest =
    base && parsed.pathname.startsWith(base)
      ? parsed.pathname.slice(base.length)
      : parsed.pathname;

  return `${prefix}${rest || '/'}${parsed.search}${parsed.hash}`;
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

/** One `http-proxy-middleware` instance, serving `/__api/<name>` from `target`. */
function createTargetProxy(name, target, names) {
  const targetUrl = new URL(target);
  const prefix = `${API_PREFIX}/${name}`;

  return createProxyMiddleware({
    target,
    // Host must be the API's or Django rejects the request; `Origin` goes with it
    // because Django's CSRF check compares the two against CSRF_TRUSTED_ORIGINS.
    changeOrigin: true,
    // Safe to slice blindly: `routeRequest` only dispatches on an exact
    // `/__api/<name>` segment boundary, so the prefix is always there. The query
    // rides along in `req.url`, so a bare `/__api/<name>?x=1` needs the slash
    // put back or the request line is malformed.
    pathRewrite: (path) => {
      const rest = path.slice(prefix.length);
      return rest.startsWith('/') ? rest : `/${rest}`;
    },
    on: {
      proxyReq(proxyReq, req) {
        proxyReq.setHeader('origin', targetUrl.origin);
        if (req.headers.referer) {
          proxyReq.setHeader('referer', `${targetUrl.origin}/`);
        }
        if (req.headers.cookie) {
          proxyReq.setHeader(
            'cookie',
            stripRequestCookies(req.headers.cookie, name, names),
          );
        }
      },
      proxyRes(proxyRes) {
        const cookies = proxyRes.headers['set-cookie'];
        if (cookies) {
          proxyRes.headers['set-cookie'] = cookies.map((cookie) =>
            namespaceSetCookie(rewriteSetCookie(cookie), name),
          );
        }
        if (proxyRes.headers.location) {
          proxyRes.headers.location = rewriteLocation(
            proxyRes.headers.location,
            targetUrl,
            prefix,
          );
        }
      },
      // Defining `on.error` replaces http-proxy-middleware's plain-text default,
      // so an unreachable API answers like the rest of this file.
      error(err, req, res) {
        if (res.headersSent) return res.destroy();
        sendJson(res, 502, {
          error: 'Dev API proxy could not reach the upstream API.',
          target,
          detail: String(err && err.message ? err.message : err),
        });
      },
    },
  });
}

/**
 * Which target a request URL names, or `null` when the request is not ours. The
 * upstream path is not built here: the middleware strips the prefix on the way
 * out, so anything computed for it would be dead.
 */
function routeRequest(rawUrl, names) {
  const segments = rawUrl.split('?')[0].split('/');
  if (segments[1] !== API_PREFIX.slice(1)) return null;

  const name = segments[2];

  return name && names.has(name) ? { name } : { unknown: name ?? '' };
}

/** @returns {(middleware: any) => any} a Metro `enhanceMiddleware` function. */
function createDevApiProxy() {
  const named = readTargets();
  const names = new Set(named.keys());
  const proxies = new Map(
    [...named].map(([name, target]) => [
      name,
      createTargetProxy(name, target, names),
    ]),
  );

  return (middleware) => (req, res, next) => {
    const route = routeRequest(req.url, names);

    // Not an API path: the dev server's own routes, bundler and assets.
    if (!route) return middleware(req, res, next);

    // http-proxy skips the `proxyReq` hook outright when a client sends
    // `Expect: 100-continue`, which would drop the origin rewrite and the cookie
    // un-naming without saying so. Browsers never send it; curl does.
    delete req.headers.expect;

    if (route.unknown === undefined) {
      return proxies.get(route.name)(req, res, next);
    }

    // A typo must not silently reach another target, and a dev server with no API
    // URLs configured must say so rather than 404 through Metro.
    return sendJson(res, 502, {
      error: names.size
        ? `Unknown dev API proxy target '${route.unknown}'.`
        : 'Dev API proxy is not configured.',
      configured: [...names],
      ...(names.size
        ? {}
        : {
            hint:
              'Set EXPO_PUBLIC_API_URL (and optionally EXPO_PUBLIC_DEMO_API_URL / ' +
              'EXPO_PUBLIC_LOCAL_API_URL), then restart the dev server.',
          }),
    });
  };
}

// The helpers are exported for the unit tests that pin the app's contract with
// them — metro.config.js only needs `createDevApiProxy`.
module.exports = {
  API_PREFIX,
  createDevApiProxy,
  deriveProxyTargets,
  readTargets,
  routeRequest,
  namespaceSetCookie,
  stripRequestCookies,
  rewriteSetCookie,
  rewriteLocation,
};
