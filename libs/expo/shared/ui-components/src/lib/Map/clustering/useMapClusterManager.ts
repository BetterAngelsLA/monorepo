import { GeoJsonProperties } from 'geojson';
import { useMemo } from 'react';
import { IMapClusterManager, MapClusterManager } from './MapClusterManager';

type IdentifiableGeo = GeoJsonProperties & { id: string };

export function useMapClusterManager<P extends IdentifiableGeo>(
  options: IMapClusterManager = {}
) {
  // Unpack primitive fields so the dependency list tracks individual values
  // and not the `options` object reference. So the manager is rebuilt only when
  // one of these four numbers actually changes.
  const { radius, maxZoom, extent, nodeSize } = options;

  return useMemo(
    () => new MapClusterManager<P>(options),
    [radius, maxZoom, extent, nodeSize]
  );
}
