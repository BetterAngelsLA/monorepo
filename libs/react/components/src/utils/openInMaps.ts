// type TShelterLocation = {
//   place: string;
//   latitude: number;
//   longitude: number;
// };

// type TProps = {
//   location?: TShelterLocation | null;
//   phone?: string | null;
//   shelterName: string;
// };

const ua = navigator.userAgent;
const isIOS = /iPad|iPhone|iPod/i.test(ua);

export function openInMaps(
  latitude?: number,
  longitude?: number,
  place?: string
) {
  if (!((latitude && longitude) || place)) {
    return;
  }

  let url: string;
  const destination = place
    ? encodeURIComponent(place)
    : encodeURIComponent(`${latitude},${longitude}`);

  if (isIOS) {
    url = `maps://?q=${destination}`;
  } else {
    url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  }

  window.location.href = url;
}
