import { Colors } from '@monorepo/expo/shared/static';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Ellipse, G, Mask, Path } from 'react-native-svg';

type TWidthHeight = {
  width: string;
  height: string;
};

type TSize = 'S' | 'M' | 'L';

const iconSizeMap: Record<TSize, TWidthHeight> = {
  S: {
    width: '25', // 0.6944444444
    height: '36,',
  },
  M: {
    width: '40', // 0.6896551724
    height: '58,',
  },
  L: {
    width: '84', // 0.7
    height: '120,',
  },
};

const fontSizeMap: Record<TSize, number> = {
  S: 10,
  M: 16,
  L: 32,
};

type TFontsizes = {
  fontSize: number;
  subscriptAfterSize: number;
};

const withSubscriptMultiplier = 0.925;
const subscriptAfterMultiplier = 0.75;

function getFontSize(size: TSize, subscriptAfter?: boolean): TFontsizes {
  const fontSize = fontSizeMap[size];

  if (subscriptAfter) {
    const withSubscriptSize = fontSize * withSubscriptMultiplier;

    return {
      fontSize: withSubscriptSize,
      subscriptAfterSize: withSubscriptSize * subscriptAfterMultiplier,
    };
  }

  return {
    fontSize,
    subscriptAfterSize: fontSize * subscriptAfterMultiplier,
  };
}

type TProps = {
  outlineColor?: string;
  fillColor?: string;
  text?: string;
  textColor?: string;
  shadowColor?: string;
  size?: TSize;
  subscriptAfter?: string;
};

const hel = Colors.WHITE;

const MapPinIcon = (props: TProps) => {
  const {
    text,
    textColor = Colors.WHITE,
    outlineColor = Colors.ERROR,
    fillColor = Colors.WHITE,
    shadowColor = Colors.NEUTRAL,
    size = 'L',
    subscriptAfter,
  } = props;

  const { fontSize, subscriptAfterSize } = getFontSize(size, !!subscriptAfter);

  return (
    <View style={styles.container}>
      <Svg {...iconSizeMap[size]} viewBox="0 0 40 58" fill="none">
        <G id="Map Pin">
          {/* Shadow ellipse */}
          <Ellipse
            id="shadow"
            cx="20.0026"
            cy="54.5676"
            rx="11.6667"
            ry="1.56757"
            fill={shadowColor}
          />
          <G id="Union">
            {/* Mask */}
            <Mask id="path-2-inside-1_176_3645" fill="white">
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M24.5714 37.128C33.4142 35.1833 40 27.7204 40 18.8108C40 8.42189 31.0457 0 20 0C8.9543 0 0 8.42189 0 18.8108C0 27.7204 6.58581 35.1833 15.4286 37.128L19.9993 50L24.5714 37.128Z"
              />
            </Mask>
            {/* Main shape fill */}
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M24.5714 37.128C33.4142 35.1833 40 27.7204 40 18.8108C40 8.42189 31.0457 0 20 0C8.9543 0 0 8.42189 0 18.8108C0 27.7204 6.58581 35.1833 15.4286 37.128L19.9993 50L24.5714 37.128Z"
              fill={fillColor}
            />
            {/* Outline path */}
            <Path
              d="M24.5714 37.128L24.1419 35.1747L23.0582 35.413L22.6868 36.4586L24.5714 37.128ZM15.4286 37.128L17.3133 36.4587L16.9419 35.413L15.8581 35.1747L15.4286 37.128ZM19.9993 50L18.1146 50.6693L19.9991 55.9761L21.884 50.6694L19.9993 50ZM38 18.8108C38 26.682 32.1682 33.4095 24.1419 35.1747L25.001 39.0813C34.6601 36.9571 42 28.7589 42 18.8108H38ZM20 2C30.0584 2 38 9.64019 38 18.8108H42C42 7.20359 32.033 -2 20 -2V2ZM2 18.8108C2 9.64019 9.94161 2 20 2V-2C7.967 -2 -2 7.20359 -2 18.8108H2ZM15.8581 35.1747C7.83176 33.4095 2 26.682 2 18.8108H-2C-2 28.7589 5.33987 36.9571 14.999 39.0813L15.8581 35.1747ZM21.884 49.3308L17.3133 36.4587L13.5439 37.7972L18.1146 50.6693L21.884 49.3308ZM22.6868 36.4586L18.1147 49.3306L21.884 50.6694L26.4561 37.7974L22.6868 36.4586Z"
              fill={outlineColor} // Change the outline color dynamically
              mask="url(#path-2-inside-1_176_3645)"
            />
          </G>
        </G>
      </Svg>

      {!!text && (
        <View style={[styles.textSlotContainer]}>
          <View style={[styles.textSlot]}>
            <Text
              style={[
                {
                  color: textColor,
                  fontSize: fontSize,
                  fontWeight: 'bold',
                },
              ]}
            >
              {text}
            </Text>
            {!!subscriptAfter && (
              <Text
                style={[
                  {
                    fontSize: subscriptAfterSize,
                    color: textColor,
                    fontWeight: 'bold',
                  },
                ]}
              >
                {subscriptAfter}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  textSlotContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: '62%',
    padding: 5,
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

const areEqual = (prev: TProps, next: TProps) => {
  return (
    prev.text === next.text &&
    prev.textColor === next.textColor &&
    prev.fillColor === next.fillColor &&
    prev.outlineColor === next.outlineColor &&
    prev.shadowColor === next.shadowColor &&
    prev.size === next.size &&
    prev.subscriptAfter === next.subscriptAfter
  );
};

const memoMapPinIcon = memo(MapPinIcon, areEqual);

export default memoMapPinIcon;
