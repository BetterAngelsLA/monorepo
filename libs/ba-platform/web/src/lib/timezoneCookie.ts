/**
 * Tell the backend which calendar this browser is on.
 *
 * Django's ``TimezoneMiddleware`` reads ``django_timezone`` and activates it for
 * the request, which is what makes report boundaries, day buckets and exported
 * row dates agree with what the person is looking at.  Without the cookie the
 * backend falls back to ``settings.TIME_ZONE``.
 *
 * Mirrors the snippet ``templates/admin/base.html`` already runs for the Django
 * admin.
 */
export const syncTimezoneCookie = () => {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (tz) {
    document.cookie = `django_timezone=${tz};path=/;max-age=31536000;SameSite=Lax`;
  }
};
