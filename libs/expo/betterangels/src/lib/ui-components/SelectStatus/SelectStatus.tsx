import { ChevronLeftIcon, PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  BaseModal,
  IconButton,
  TextBold,
} from '@monorepo/expo/shared/ui-components';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SelectStatusProps = {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  options: { value: string; displayValue?: string; bg: string; text: string }[];
  title?: string;
  selectedValue?: string | null;
};

export function SelectStatus({
  value,
  onChange,
  disabled,
  options,
  title,
}: SelectStatusProps) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;

  const current = useMemo(
    () => options.find((o) => o.value === value),
    [value, options]
  );

  const openSheet = () => {
    if (disabled) return;
    setOpen(true);
  };

  const closeSheet = () => setOpen(false);

  const Chevron = ({ up = false }: { up?: boolean }) => (
    <ChevronLeftIcon
      size="sm"
      color={current?.text || Colors.WHITE}
      rotate={up ? '90deg' : '270deg'}
    />
  );

  return (
    <>
      <Pressable
        disabled={disabled}
        accessibilityRole="button"
        accessibilityHint="Opens the status selection menu"
        accessibilityLabel={
          current ? `${current.value}, open menu` : 'Open menu'
        }
        onPress={openSheet}
        style={({ pressed }) => [
          styles.trigger,
          { backgroundColor: current?.bg ?? Colors.NEUTRAL_DARK },
          pressed && !disabled ? { opacity: 0.85 } : undefined,
          disabled ? { opacity: 0.6 } : undefined,
        ]}
      >
        <TextBold size="sm" color={current?.text}>
          {current?.displayValue}
        </TextBold>
        <Chevron up={open} />
      </Pressable>

      <BaseModal
        title={null}
        isOpen={open}
        onClose={closeSheet}
        variant="sheet"
        backdropOpacity={0.5}
        panelStyle={{
          borderTopLeftRadius: Radiuses.md,
          borderTopRightRadius: Radiuses.md,
          backgroundColor: Colors.WHITE,
        }}
        contentStyle={{
          paddingHorizontal: Spacings.md,
          paddingBottom: bottomOffset, // tightened: safe-area only (no extra spacing)
        }}
      >
        <View style={styles.sheet}>
          <IconButton
            style={{ alignSelf: 'flex-end' }}
            onPress={closeSheet}
            variant="transparent"
            accessibilityLabel="close menu"
            accessibilityHint="Closes the menu"
          >
            <PlusIcon rotate="45deg" />
          </IconButton>

          {title && (
            <TextBold mb="md" size="xl">
              {title}
            </TextBold>
          )}

          <View style={styles.list}>
            {options.map((opt) => {
              const selected = value === opt.value;
              const onPress = () => {
                onChange(opt.value);
                setTimeout(closeSheet, 30); // preserve original tiny delay
              };

              return (
                <Pressable
                  key={opt.value}
                  onPress={onPress}
                  style={({ pressed }) => [
                    styles.optionRow,
                    { backgroundColor: opt.bg },
                    pressed ? { opacity: 0.9 } : undefined,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <TextBold color={opt.text}>{opt.displayValue}</TextBold>
                </Pressable>
              );
            })}
          </View>
        </View>
      </BaseModal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    width: '100%',
    height: 36,
    borderRadius: Radiuses.xs,
    borderTopRightRadius: 0,
    borderTopLeftRadius: 0,
    gap: Spacings.xs,
  },
  sheet: {
    backgroundColor: Colors.WHITE,
    borderTopLeftRadius: Radiuses.md,
    borderTopRightRadius: Radiuses.md,
  },
  list: {
    gap: Spacings.xs,
  },
  optionRow: {
    borderRadius: Radiuses.xs,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
