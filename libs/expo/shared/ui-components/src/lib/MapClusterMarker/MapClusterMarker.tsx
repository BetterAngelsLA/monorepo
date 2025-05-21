import { HouseSolidIcon } from '@monorepo/expo/shared/icons';
import { Colors, Shadow } from '@monorepo/expo/shared/static';
import { StyleSheet, Text, View } from 'react-native';
import { SIZES, variantStyleMap } from './constants';

export type TMapClusterMarkerSize = 'S' | 'M' | 'L';
export type TMapClusterMarkerVariant = 'primary';

interface IMapClusterMarkerProps {
  textColor?: string;
  size?: TMapClusterMarkerSize;
  variant?: TMapClusterMarkerVariant;
  text?: string;
  subscriptAfter?: boolean;
  hasHouse?: boolean;
}

export function MapClusterMarker(props: IMapClusterMarkerProps) {
  const {
    textColor,
    size = 'S',
    variant = 'primary',
    text,
    subscriptAfter,
    hasHouse,
  } = props;

  const {
    borderColor: variantBorderColor,
    fillColor: variantFillColor,
    textColor: variantTextColor,
  } = variantStyleMap[variant];

  return (
    <View style={[styles.shadowContainer]}>
      <View
        style={[
          styles.outerCircle,

          {
            backgroundColor: variantFillColor,
            padding: SIZES[size].outerPadding,
            height: SIZES[size].size,
            width: SIZES[size].size,
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
                fontSize: SIZES[size].fontSize,
                color: textColor || variantTextColor,
              },
            ]}
          >
            {text}
            {subscriptAfter && (
              <Text style={{ fontSize: SIZES[size].subscriptAfterSize }}>
                +
              </Text>
            )}
          </Text>
        </View>
        {hasHouse && (
          <View
            style={[
              styles.house,
              {
                height: SIZES[size].houseContainer,
                width: SIZES[size].houseContainer,
              },
            ]}
          >
            {/* TODO: We don't have the icon which is on FIGMA (AC said ignore the icon for now) */}
            <HouseSolidIcon
              color={Colors.NEUTRAL_EXTRA_DARK}
              size={SIZES[size].houseIcon}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    ...Shadow,
  },
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
