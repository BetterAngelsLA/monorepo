import { Text, View } from 'react-native';
import { SIZES, variantStyleMap } from './constants';
import { getContentAndSize } from './getContentAndSize';

export type TMapClusterMarkerSize = 'S' | 'M' | 'L';
export type TMapClusterMarkerVariant = 'primary';

interface IMapClusterMarkerProps {
  textColor?: string;
  size?: TMapClusterMarkerSize;
  variant?: TMapClusterMarkerVariant;
  text?: string;
  itemCount?: number;
  subscriptAfter?: boolean;
  hasHouse?: boolean;
}

export function MapClusterMarker(props: IMapClusterMarkerProps) {
  const {
    textColor,
    size,
    variant = 'primary',
    text,
    itemCount,
    subscriptAfter,
    // hasHouse,
  } = props;

  const {
    borderColor: variantBorderColor,
    fillColor: variantFillColor,
    textColor: variantTextColor,
  } = variantStyleMap[variant];

  const { content, markerSize } = getContentAndSize({
    text,
    itemCount,
    size,
  });

  return (
    <View
      style={[
        styles.outerCircle,
        {
          backgroundColor: variantFillColor,
          padding: SIZES[markerSize].outerPadding,
          height: SIZES[markerSize].size,
          width: SIZES[markerSize].size,
        },
      ]}
    >
      <View
        style={[
          styles.innerCircle,
          {
            backgroundColor: variantFillColor,
            borderColor: variantBorderColor,
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              fontSize: SIZES[markerSize].fontSize,
              color: textColor || variantTextColor,
            },
          ]}
        >
          {content}
          {subscriptAfter && (
            <Text style={{ fontSize: SIZES[markerSize].subscriptAfterSize }}>
              +
            </Text>
          )}
        </Text>
      </View>
      {/* {hasHouse && (
          <View
            style={[
              styles.house,
              {
                height: SIZES[size].houseContainer,
                width: SIZES[size].houseContainer,
              },
            ]}
          >
            <HouseSolidIcon
              color={Colors.NEUTRAL_EXTRA_DARK}
              size={SIZES[size].houseIcon}
            />
          </View>
        )} */}
    </View>
  );
}
