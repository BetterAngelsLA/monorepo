import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { headerVariants } from '../config';
import { HEADER_BAR_HEIGHT, HEADER_SLOT_MIN_WIDTH } from '../constants';
import { THeaderVariant } from '../types';

const IS_IOS = Platform.OS === 'ios';

type TProps = {
  /** See THeaderVariant. Each variant's colours and default buttons come from
   *  the shared header config. */
  variant?: THeaderVariant;

  title?: string;

  /** Bar fill. Defaults to the variant's colour. */
  backgroundColor?: Colors;

  /** Title and default-button tint. Defaults to the variant's colour. */
  textColor?: Colors;

  /**
   * Left slot. Omit it for the variant's default; pass `null` for no left
   * button at all; pass a node for anything else.
   */
  buttonLeft?: ReactNode | null;

  /** Right slot. Same three-way behaviour as `buttonLeft`. */
  buttonRight?: ReactNode | null;

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
 */
export function ScreenHeader(props: TProps) {
  const {
    variant = 'screen',
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

  const config = headerVariants[variant];

  const bgColor = backgroundColor ?? config.backgroundColor;
  const tintColor = textColor ?? config.textColor;

  if (variant === 'minimal') {
    return (
      <View
        testID={testID}
        style={{ backgroundColor: bgColor, height: paddingTop }}
      />
    );
  }

  const { ButtonLeft, ButtonRight } = config;

  // `undefined` means "give me the variant's default"; `null` means "no button".
  const left =
    buttonLeft === undefined
      ? ButtonLeft && <ButtonLeft color={tintColor} />
      : buttonLeft;

  const right =
    buttonRight === undefined
      ? ButtonRight && <ButtonRight color={tintColor} />
      : buttonRight;

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
      <View style={[styles.slot, styles.slotLeft]}>{left}</View>

      {!!title && (
        <View style={styles.title}>
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
        </View>
      )}

      <View style={[styles.slot, styles.slotRight]}>{right}</View>
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
