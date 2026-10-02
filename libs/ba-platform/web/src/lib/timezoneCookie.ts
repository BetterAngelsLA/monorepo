/**
 * Tell the backend which calendar this browser is on.
 *
 * Django's ``TimezoneMiddleware`` reads ``django_timezone`` and activates it for
 * the request, which is what makes report boundaries, day buckets and exported
 * row dates agree with what the person is looking at.  Without the cookie the
 * backend falls back to ``settings.TIME_ZONE``.
 *
 * The API lives on a different host than the app (``api.*`` vs ``admin.*``), so
 * the cookie is scoped to the shared parent domain — otherwise the browser
 * would never attach it to API requests.  Mirrors the snippet
 * ``templates/admin/base.html`` already runs for the Django admin.
 */

/** The domain the app and API share, or ``undefined`` when none applies. */
export const cookieDomainFor = (hostname: string): string | undefined => {
  const labels = hostname.split('.');
  const isIpv4 =
    labels.length === 4 && labels.every((label) => /^\d+$/.test(label));

  // Strip the leftmost label (``admin.dev.example.com`` → ``dev.example.com``);
  // hosts without one are already shared or must stay host-only.
  return !isIpv4 && labels.length > 2 ? labels.slice(1).join('.') : undefined;
};

export const syncTimezoneCookie = () => {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (tz) {
    const domain = cookieDomainFor(window.location.hostname);
    const scope = domain ? `;domain=${domain}` : '';
    document.cookie = `django_timezone=${tz};path=/;max-age=31536000;SameSite=Lax${scope}`;
  }
};
