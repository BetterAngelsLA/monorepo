const apiUrl = import.meta.env.VITE_BETTERANGELS_ADMIN_API_URL;

/**
 * Google Maps key for the region map on the Reports page.
 *
 * Read from the shelter-web variable for now, so no new secret is needed to
 * evaluate this. It should become its own `VITE_BETTERANGELS_ADMIN_GOOGLE_MAPS_API_KEY`
 * once the map is wanted in production — sharing the key also shares its quotas and
 * HTTP-referrer restrictions, which are not the same for the two apps.
 *
 * Deliberately not `throw`n when absent, unlike `apiUrl` above: the rest of the admin
 * app works without a map, so a missing key should degrade the one panel rather than
 * take down the page. `RegionMap` checks for this and says so.
 */
const googleMapsApiKey =
  import.meta.env.VITE_BETTERANGELS_ADMIN_GOOGLE_MAPS_API_KEY ||
  import.meta.env.VITE_SHELTER_GOOGLE_MAPS_API_KEY ||
  '';

if (!apiUrl) {
  throw new Error(
    'VITE_BETTERANGELS_ADMIN_API_URL is not defined in your environment variables.',
  );
}

export { apiUrl, googleMapsApiKey };
