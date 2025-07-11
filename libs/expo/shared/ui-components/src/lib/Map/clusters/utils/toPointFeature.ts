import { AnyProps } from 'supercluster';
import { TGeoPoint, TPointProperties } from '../types';

type TProps<T extends AnyProps = AnyProps> = {
  id: string;
  latitude: number;
  longitude: number;
} & T;

export function toPointFeature<T extends AnyProps>(
  props: TProps<T>
): TGeoPoint<T> {
  const { id, latitude, longitude, ...rest } = props;

  // hash for simpler identity comparison
  const _identityHash = `${id}_${longitude}_${latitude}`;

  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [longitude, latitude],
    },
    properties: {
      id,
      _identityHash,
      ...rest,
    } as unknown as TPointProperties<T>, // TODO: fix to avoid casting
  };
}
