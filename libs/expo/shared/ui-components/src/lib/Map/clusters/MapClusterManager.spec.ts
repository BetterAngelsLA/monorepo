/** The rule behind a cluster click: zoom while it separates, otherwise list. */
import { PointFeature } from 'supercluster';

import { MapClusterManager } from './MapClusterManager';
import { TClusterPoint } from './types';

type TProps = { id: string };

// Two points on the same block plus one far away, so there is a real cluster to
// ask about.
const points: PointFeature<TProps>[] = [
  {
    type: 'Feature',
    properties: { id: 'a' },
    geometry: { type: 'Point', coordinates: [-118.2588, 34.0486] },
  },
  {
    type: 'Feature',
    properties: { id: 'b' },
    geometry: { type: 'Point', coordinates: [-118.2589, 34.0487] },
  },
  {
    type: 'Feature',
    properties: { id: 'c' },
    geometry: { type: 'Point', coordinates: [-118.5, 34.2] },
  },
];

const WORLD: [number, number, number, number] = [-180, -85, 180, 85];

function managerWithPoints() {
  const manager = new MapClusterManager<TProps>({ radius: 50, maxZoom: 20 });

  manager.load(points);

  return manager;
}

function firstClusterAt(zoom: number): TClusterPoint<TProps> {
  const clusters = managerWithPoints().getClusters(WORLD, zoom);
  const cluster = clusters.find((c) => c.properties.cluster);

  if (!cluster) {
    throw new Error(`no cluster at zoom ${zoom}`);
  }

  return cluster as TClusterPoint<TProps>;
}

it('assumes zooming helps when the current zoom is unknown', () => {
  const manager = managerWithPoints();
  const cluster = firstClusterAt(0);

  expect(manager.canExpandFurther(cluster.properties.cluster_id)).toBe(true);
});

it('says zooming helps when the map is below the expansion zoom', () => {
  const cluster = firstClusterAt(0);
  const manager = managerWithPoints();

  expect(
    manager.canExpandFurther(
      cluster.properties.cluster_id,
      manager.getClusterExpansionZoom(cluster.properties.cluster_id) - 2,
    ),
  ).toBe(true);
});

it('says zooming does not help once the map has reached the expansion zoom', () => {
  const cluster = firstClusterAt(0);
  const manager = managerWithPoints();

  // At the expansion zoom the cluster is as separated as this click can make it,
  // so the click should show the points instead of moving the map.
  expect(
    manager.canExpandFurther(
      cluster.properties.cluster_id,
      manager.getClusterExpansionZoom(cluster.properties.cluster_id),
    ),
  ).toBe(false);
});

it('returns the points inside a cluster, for the card to list', () => {
  const cluster = firstClusterAt(0);
  const ids = managerWithPoints()
    .getLeaves(cluster.properties.cluster_id)
    .map((leaf) => leaf.properties.id);

  // At zoom 0 the radius covers all three; the point is that the leaves come back
  // for the card, not which ones are in range at a given zoom.
  expect(ids).toEqual(expect.arrayContaining(['a', 'b']));
});
