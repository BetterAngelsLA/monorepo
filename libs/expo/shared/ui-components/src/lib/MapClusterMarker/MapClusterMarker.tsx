import {
  Colors,
  Radiuses,
  Shadow,
  Spacings,
} from '@monorepo/expo/shared/static';
import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import TextBold from '../TextBold';
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
  label?: string;
}

function BaseMapClusterMarker(props: IMapClusterMarkerProps) {
  const {
    textColor,
    size,
    variant = 'primary',
    text,
    itemCount,
    subscriptAfter,
    label,
  } = props;

  const { fillColor: variantFillColor, textColor: variantTextColor } =
    variantStyleMap[variant];

  const { content, markerSize, showSubscript } = useMemo(
    () => getContentAndSize({ text, itemCount, size }),
    [text, itemCount, size]
  );

  // Build the full label in a *single* Text node (avoids nested Text snapshot issues)
  const labelText =
    showSubscript || subscriptAfter ? `${content}+` : String(content);

  // Numeric sizing only
  const outerSize = SIZES[markerSize].size;
  const outerPadding = SIZES[markerSize].outerPadding;
  const ringDiameter = Math.max(outerSize - 2 * outerPadding, 0);
  const ringWidth = 2;

  return (
    <View style={{ alignItems: 'center' }} collapsable={false}>
      {label && (
        <View
          style={{
            paddingHorizontal: Spacings.sm,
            paddingTop: Spacings.xs,
            paddingBottom: Spacings.xxs,
          }}
        >
          <View
            style={{
              paddingHorizontal: Spacings.xs,
              backgroundColor: Colors.WHITE,
              borderRadius: Radiuses.xxxl,
              ...Shadow,
            }}
          >
            <TextBold size="sm">{label}</TextBold>
          </View>
        </View>
      )}

      {/* Outer orange disk */}
      <View
        collapsable={false}
        style={[
          styles.outerCircle,
          {
            width: outerSize,
            height: outerSize,
            borderRadius: outerSize / 2,
            backgroundColor: variantFillColor,
          },
        ]}
      >
        {/* Thin white inner ring (transparent fill so orange shows inside) */}
        <View
          collapsable={false}
          style={{
            position: 'absolute',
            width: ringDiameter,
            height: ringDiameter,
            borderRadius: ringDiameter / 2,
            borderWidth: ringWidth,
            borderColor: Colors.WHITE,
            backgroundColor: 'transparent',
          }}
        />

        {/* Centered count text */}
        <Text
          style={[
            styles.text,
            {
              fontFamily: 'Poppins-SemiBold', // MUST equal your useFonts key
              fontSize: SIZES[markerSize].fontSize,
              color: textColor || variantTextColor || Colors.WHITE,
            },
          ]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {labelText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  text: {
    // Safer tracking to avoid glyph clipping on Android
    letterSpacing: -0.5,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export const MapClusterMarker = memo(BaseMapClusterMarker);
