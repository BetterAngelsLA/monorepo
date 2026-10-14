import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HEADER_BAR_HEIGHT, HEADER_SLOT_MIN_WIDTH } from '../constants';
import { headerStyles } from '../headerStyles';
import { THeaderVariant } from '../types';

const IS_IOS = Platform.OS === 'ios';

type TProps = {
  /** Which palette from `headerStyles` colours the bar and its tint. */
  variant?: THeaderVariant;

  title?: string;

  /** Bar fill. Defaults to the variant's colour. */
  backgroundColor?: Colors;

  /** Title and button tint. Defaults to the variant's colour. */
  textColor?: Colors;

  /** Left slot. Renders nothing when omitted. */
  buttonLeft?: ReactNode;

  /** Right slot. Renders nothing when omitted. */
  buttonRight?: ReactNode;

  /**
   * Status-bar padding. Defaults to the safe-area top inset, which is correct
   * for a screen that fills the window. Pass 0 for a surface that does not —
   * an iOS page-sheet modal, for instance, starts below the notch already.
   */
  topInset?: number;

  testID?: string;
};

/**
 * ScreenHeader
 *
 * An in-app equivalent of the native navigation bar, following each platform's
 * conventions: a centred title on iOS, left-aligned on Android, at each
 * platform's bar height.
 *
 * It exists so a screen can fill the whole window and still have a header.
 * A native header shrinks the route's content view, which matters when
 * something inside the screen needs the window's full height — a bottom sheet
 * measuring its container, say. Rendering the bar in-app keeps that height
 * intact.
 *
 * `variant` picks the palette from `headerStyles`; the slots are explicit —
 * pass the buttons this surface needs (a close button for a modal, say). Use
 * the native header wherever possible; reach for this only when a screen must
 * fill the window.
 */
export function ScreenHeader(props: TProps) {
  const {
    variant = 'primary',
    title,
    backgroundColor,
    textColor,
    buttonLeft,
    buttonRight,
    topInset,
    testID,
  } = props;

  const insets = useSafeAreaInsets();

  const paddingTop = topInset ?? insets.top;

  const palette = headerStyles[variant];

  const bgColor = backgroundColor ?? palette.backgroundColor;
  const tintColor = textColor ?? palette.textColor;

  return (
    <View
      testID={testID}
      style={[
        styles.bar,
        {
          backgroundColor: bgColor,
          paddingTop,
          height: paddingTop + HEADER_BAR_HEIGHT,
        },
      ]}
    >
      <View style={[styles.slot, styles.slotLeft]}>{buttonLeft}</View>

      <View style={styles.title}>
        {!!title && (
          <TextBold
            size={IS_IOS ? 'md' : 'lg'}
            color={tintColor}
            numberOfLines={1}
            ellipsizeMode="tail"
            textAlign={IS_IOS ? 'center' : 'left'}
            accessibilityRole="header"
          >
            {title}
          </TextBold>
        )}
      </View>

      <View style={[styles.slot, styles.slotRight]}>{buttonRight}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacings.xs,
  },
  slot: {
    minWidth: HEADER_SLOT_MIN_WIDTH,
    justifyContent: 'center',
  },
  slotLeft: {
    alignItems: 'flex-start',
  },
  slotRight: {
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    marginHorizontal: Spacings.xs,
  },
});
