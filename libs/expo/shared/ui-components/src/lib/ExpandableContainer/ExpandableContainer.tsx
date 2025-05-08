import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import {
  Colors,
  FontSizes,
  Spacings,
  TMarginProps,
  getMarginStyles,
} from '@monorepo/expo/shared/static';
import { ReactNode, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import TextOrNode from '../TextOrNode';

interface IExpandableContainer extends TMarginProps {
  controlled?: boolean; // controls expanded state via isOpen prop
  isOpen?: boolean;
  defaultOpen?: boolean;
  onToggle?: (newOpen: boolean) => void;
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
    controlled = false,
    defaultOpen = false,
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
    onToggle,
  } = props;

  const [expandedLocal, setExpandedLocal] = useState<boolean>(defaultOpen);

  const expanded = controlled ? !!isOpen : expandedLocal;

  function toggleExpanded() {
    if (controlled) {
      onToggle?.(!isOpen);

      return;
    }

    setExpandedLocal((prev) => {
      const newOpen = !prev;

      onToggle?.(newOpen);

      return newOpen;
    });
  }

  const accessibilityHintTitle = typeof title === 'string' ? title : 'section';

  const accessibilityHintText = expanded
    ? `close ${accessibilityHintTitle}`
    : `open ${accessibilityHintTitle}`;

  return (
    <View style={[styles.container, getMarginStyles(props), style]}>
      {header && header}
      {!header && (
        <Pressable
          onPress={toggleExpanded}
          disabled={disabled}
          accessible
          accessibilityRole="button"
          accessibilityHint={accessibilityHintText}
          style={({ pressed }) => [
            { backgroundColor: pressed ? bgPressed : 'transparent' },
            styles.defaultHeaderPressable,
          ]}
        >
          <View style={[styles.defaultHeaderView, stylesHeader]}>
            <TextOrNode textStyle={[styles.stylesTitleText, stylesTitleText]}>
              {title}
            </TextOrNode>

            {icon}
            {!icon && (
              <ChevronLeftIcon
                size="sm"
                rotate={expanded ? '90deg' : '-90deg'}
              />
            )}
          </View>
        </Pressable>
      )}
      {expanded && <View>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    width: '100%',
  },
  defaultHeaderPressable: {
    maxWidth: '100%',
    width: '100%',
    display: 'flex',
  },
  defaultHeaderView: {
    justifyContent: 'space-between',
    flexDirection: 'row',
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
