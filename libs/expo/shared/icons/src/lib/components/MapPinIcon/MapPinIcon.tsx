import { memo } from 'react';
import isEqual from 'react-fast-compare';
import { StyleSheet, TextStyle, View } from 'react-native';
import { MapPinSvg } from './MapPinSvg';
import { MapPinText } from './MapPinText';
import { iconSizeMap, variantStyleMap } from './constants';

export type TMapPinIconSize = 'S' | 'M' | 'L';
export type TMapPinVariant =
  | 'primary'
  | 'primaryFill'
  | 'secondary'
  | 'secondaryFill';

type TProps = {
  borderColor?: string;
  fillColor?: string;
  textColor?: string;
  size?: TMapPinIconSize;
  variant?: TMapPinVariant;
  text?: string;
  subscriptAfter?: string;
  textStyle?: TextStyle;
};

const PinIcon = (props: TProps) => {
  const {
    size = 'M',
    variant = 'primary',
    borderColor,
    fillColor,
    textColor,
    text,
    subscriptAfter,
    textStyle,
  } = props;

  const { width, height } = iconSizeMap[size];

  const {
    borderColor: variantBorderColor,
    fillColor: variantFillColor,
    textColor: variantTextColor,
  } = variantStyleMap[variant];

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
        },
      ]}
    >
      <MapPinSvg
        outlineColor={borderColor || variantBorderColor}
        fillColor={fillColor || variantFillColor}
        width="100%"
        height="100%"
      />

      {!!text && (
        <View style={[styles.slotContainer]}>
          <MapPinText
            size={size}
            text={text}
            subscriptAfter={subscriptAfter}
            style={[{ color: textColor || variantTextColor }, textStyle]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  slotContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: '62%',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSlot: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'baseline',
  },
});

export const MapPinIcon = memo(PinIcon, isEqual);
