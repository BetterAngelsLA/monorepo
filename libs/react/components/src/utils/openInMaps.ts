import { toMapsUrl } from '@monorepo/react/shared';

export function openInMaps(
  latitude?: number,
  longitude?: number,
  address?: string,
) {
  const url = toMapsUrl({ latitude, longitude, address });

  if (!url) {
    return;
  }

  window.location.href = url;
}
