import { calcDistance, formatDistance } from '@monorepo/react/shared';
import { TLatLng } from '../Map';

type TProps = {
  className?: string;
  distanceInMiles?: number | null;
  originCoordinates?: TLatLng | null;
  targetCoordinates?: TLatLng | null;
  minimum?: number;
  formatFn?: (distance: string) => string;
};

export function DistanceAway(props: TProps) {
  const {
    distanceInMiles,
    originCoordinates,
    targetCoordinates,
    formatFn,
    className = '',
  } = props;

  let distance: number | undefined | null = distanceInMiles;

  if (!distance && originCoordinates && targetCoordinates) {
    distance = calcDistance({
      pointA: originCoordinates,
      pointB: targetCoordinates,
      units: 'miles',
    });
  }

  if (!distance) {
    return null;
  }

  let formattedDistance = formatDistance({
    distance: distance,
    units: 'miles',
  });

  if (!formattedDistance) {
    return null;
  }

  if (formatFn) {
    formattedDistance = formatFn(formattedDistance);
  }

  return <div className={className}>{formattedDistance}</div>;
}
