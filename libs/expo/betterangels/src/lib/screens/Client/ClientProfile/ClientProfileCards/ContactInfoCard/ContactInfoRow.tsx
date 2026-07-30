import { ThreeDotIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ContactActionMenu, TContactActionItem } from './ContactActionMenu';

type TProps = {
  /** Menu title, e.g. "Address", "Phone number", "Email address". */
  menuTitle: string;
  /** Actions shown in the menu. */
  actions: TContactActionItem[];
  /** Accessibility label for the kebab menu trigger. */
  triggerAccessibilityLabel: string;
  /**
   * Plain-text value. When provided, the row wraps it in a selectable
   * <TextBold /> so users can highlight and copy it with standard OS
   * gestures. Use `children` instead to fully customize the left content.
   */
  value?: string;
  /** Custom content rendered on the left side of the row (overrides `value`). */
  children?: ReactNode;
  /** Optional content rendered next to the text (e.g. a star). */
  suffix?: ReactNode;
};

export function ContactInfoRow(props: TProps) {
  const {
    menuTitle,
    actions,
    triggerAccessibilityLabel,
    value,
    children,
    suffix,
  } = props;

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.row}>
      <View style={styles.textWrap}>
        {children ?? (
          <TextBold selectable size="sm" color={Colors.PRIMARY_EXTRA_DARK}>
            {value}
          </TextBold>
        )}
        {suffix}
      </View>

      <Pressable
        onPress={() => setMenuOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={triggerAccessibilityLabel}
        accessibilityHint="Opens actions for this contact detail"
        hitSlop={8}
        style={styles.trigger}
      >
        <ThreeDotIcon size="md" color={Colors.PRIMARY_EXTRA_DARK} />
      </Pressable>

      <ContactActionMenu
        visible={menuOpen}
        title={menuTitle}
        items={actions}
        onClose={() => setMenuOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    flex: 1,
  },
  textWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    flexWrap: 'wrap',
  },
  trigger: {
    padding: Spacings.xxs,
  },
});
