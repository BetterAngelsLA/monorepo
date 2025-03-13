import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import {
  Colors,
  FontSizes,
  Spacings,
  TMarginProps,
  getMarginStyles,
} from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import TextOrNode from '../TextOrNode';

interface IExpandableContainer extends TMarginProps {
  onClick?: () => void;
  isOpen?: boolean;
  title?: string | ReactNode;
  icon?: ReactNode;
  header?: ReactNode;
  bgPressed?: Colors;
  style?: ViewStyle;
  stylesHeader?: ViewStyle;
  stylesTitleText?: TextStyle;
  disabled?: boolean;
  children: ReactNode;
}

export function ExpandableContainer(props: IExpandableContainer) {
  const {
    isOpen,
    children,
    title,
    icon,
    header,
    style,
    stylesHeader,
    stylesTitleText,
    bgPressed = Colors.GRAY_PRESSED,
    disabled,
    onClick,
  } = props;

  const accessibilityHintTitle = typeof title === 'string' ? title : 'section';

  const accessibilityHintText = isOpen
    ? `close ${accessibilityHintTitle}`
    : `open ${accessibilityHintTitle}`;

  return (
    <View style={[styles.container, getMarginStyles(props), style]}>
      <Pressable
        onPress={onClick}
        disabled={disabled}
        accessible
        accessibilityRole="button"
        accessibilityHint={accessibilityHintText}
        style={({ pressed }) => [
          {
            backgroundColor: pressed ? bgPressed : undefined,
            maxWidth: '100%',
            width: '100%',
            display: 'flex',
          },
        ]}
      >
        {header}
        {!header && (
          <View style={[styles.headerView, stylesHeader]}>
            <TextOrNode textStyle={[styles.stylesTitleText, stylesTitleText]}>
              {title}
            </TextOrNode>

            {icon}
            {!icon && (
              <ChevronLeftIcon size="sm" rotate={isOpen ? '90deg' : '-90deg'} />
            )}
          </View>
        )}
      </Pressable>
      {isOpen && <View>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    width: '100%',
  },
  headerView: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingHorizontal: Spacings.xs,
    paddingVertical: Spacings.sm,
    alignItems: 'center',
  },
  stylesTitleText: {
    fontFamily: 'Poppins-Regular',
    fontSize: FontSizes.sm.fontSize,
    lineHeight: FontSizes.sm.lineHeight,
    color: Colors.PRIMARY_EXTRA_DARK,
  },
});
