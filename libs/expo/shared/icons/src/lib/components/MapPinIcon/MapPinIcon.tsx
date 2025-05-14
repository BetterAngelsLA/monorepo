import { Colors } from '@monorepo/expo/shared/static';
import { StyleSheet, TextStyle, View } from 'react-native';
import { MapPinSvg } from './MapPinSvg';
import { MapPinText } from './MapPinText';
import { iconSizeMap } from './constants';

export type TMapPinIconSize = 'S' | 'M' | 'L';
export type TMapPinVariant = 'outline' | 'filled';

type TProps = {
  color?: string;
  size?: TMapPinIconSize;
  variant?: TMapPinVariant;
  text?: string;
  subscriptAfter?: string;
  textStyle?: TextStyle;
};

export const MapPinIcon = (props: TProps) => {
  const {
    color = Colors.ERROR,
    size = 'M',
    variant = 'filled',
    text,
    subscriptAfter,
    textStyle,
  } = props;

  const { width, height } = iconSizeMap[size];

  const outlineColor = color;
  const fillColor = variant === 'filled' ? color : Colors.WHITE;
  const textColor = variant === 'filled' ? Colors.WHITE : color;

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
        outlineColor={outlineColor}
        fillColor={fillColor}
        width="100%"
        height="100%"
      />

      {!!text && (
        <View style={[styles.slotContainer]}>
          <MapPinText
            size={size}
            text={text}
            subscriptAfter={subscriptAfter}
            style={[{ color: textColor }, textStyle]}
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
