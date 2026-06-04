/**
 * Fits the map to a Places API viewport (`geometry.viewport` or `Place.viewport`).
 * Uses extend(NE/SW) so it works with LatLngBounds instances from the JS SDK.
 */
export function fitMapToPlaceViewport(
  map: google.maps.Map,
  viewport: google.maps.LatLngBounds
): void {
  const bounds = new google.maps.LatLngBounds();
  bounds.extend(viewport.getNorthEast());
  bounds.extend(viewport.getSouthWest());
  map.fitBounds(bounds);
}
