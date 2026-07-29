import { useMemo } from 'react';
import { IMapClusterManager, MapClusterManager } from '../MapClusterManager';
import { IClusterGeoJson } from '../types';

export function useMapClusterManager<P extends IClusterGeoJson>(
  options: IMapClusterManager = {},
) {
  // Unpack primitive fields so the dependency list tracks individual values
  // and not the `options` object reference. So the manager is rebuilt only when
  // one of these four numbers actually changes.
  const { radius, maxZoom, extent, nodeSize, edgePadding, map, reduce } =
    options;

  // Use JSON.stringify as a stable comparison key for edgePadding,
  // so the cluster manager is rebuilt only when the padding values actually
  // change — not on every reference change of the options object.
  const edgePaddingKey = edgePadding ? JSON.stringify(edgePadding) : undefined;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedEdgePadding = useMemo(() => edgePadding, [edgePaddingKey]);

  return useMemo(
    () =>
      new MapClusterManager<P>({
        radius,
        maxZoom,
        extent,
        nodeSize,
        edgePadding: memoizedEdgePadding,
        map,
        reduce,
      }),
    [radius, maxZoom, extent, nodeSize, memoizedEdgePadding, map, reduce],
  );
}
