import { Colors } from '@monorepo/expo/shared/static';
import { TMapClusterMarkerVariant } from './MapClusterMarker';

export const SIZES = {
  S: {
    fontSize: 14,
    size: 32,
    houseIcon: 15,
    houseContainer: 20,
    subscriptAfterSize: 7,
    outerPadding: 3,
  },
  M: {
    fontSize: 20,
    size: 48,
    houseIcon: 20,
    houseContainer: 28,
    subscriptAfterSize: 10,
    outerPadding: 4,
  },
  L: {
    fontSize: 30,
    size: 64,
    houseIcon: 24,
    houseContainer: 32,
    subscriptAfterSize: 16,
    outerPadding: 4,
  },
} as const;

export type TClusterSizeKey = keyof typeof SIZES;
export type TClusterSize = (typeof SIZES)[TClusterSizeKey];

type TVariantStyle = {
  borderColor: Colors;
  fillColor: Colors;
  textColor: Colors;
};

export const variantStyleMap: Record<TMapClusterMarkerVariant, TVariantStyle> =
  {
    primary: {
      borderColor: Colors.WHITE,
      fillColor: Colors.ORANGE,
      textColor: Colors.WHITE,
    },
  };
