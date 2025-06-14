import { Colors } from '@monorepo/expo/shared/static';
import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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

function baseMapClusterMarker(props: IMapClusterMarkerProps) {
  const {
    textColor,
    size, // no default here; if undefined, getContentAndSize() will know what to do.
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

  const { content, markerSize } = useMemo(
    () =>
      getContentAndSize({
        text,
        itemCount,
        size,
      }),
    [text, itemCount, size]
  );

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

const styles = StyleSheet.create({
  outerCircle: {
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  innerCircle: {
    borderRadius: 100,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  text: {
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: -2,
  },
  house: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: Colors.WHITE,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: Colors.NEUTRAL_EXTRA_DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const MapClusterMarker = memo(baseMapClusterMarker);
