import { Picker as RNPicker } from '@react-native-picker/picker';
import { useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Colors,
  Radiuses,
  Spacings,
  getMarginStyles,
} from '@monorepo/expo/shared/static';
import { BaseModal, TextBold, TextRegular } from '../';

import { PickerField } from './PickerField';
import { NONE_VALUE } from './constants';
import { IPickerProps } from './types';

type Props = IPickerProps & {
  /** Keep native iOS wheel UI when true (default). Otherwise use the list on all platforms. */
  useWheelOnIOS?: boolean;
};

export default function Picker({
  onChange,
  error,
  selectedValue,
  placeholder,
  allowSelectNone,
  selectNoneLabel,
  items,
  label,
  required,
  disabled,
  useWheelOnIOS = true,
  ...rest
}: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(selectedValue ?? null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (open) setDraft(selectedValue ?? null);
  }, [open, selectedValue]);

  const titleText = useMemo(
    () => label ?? placeholder ?? 'Select',
    [label, placeholder]
  );

  const openSheet = () => {
    if (disabled) return;
    Keyboard.dismiss();
    setOpen(true);
  };
  const closeSheet = () => setOpen(false);

  const commit = (val: string) => {
    closeSheet();
    if (val === NONE_VALUE) return onChange(null);
    onChange(val);
  };

  const onDone = () => {
    const fallback = allowSelectNone
      ? NONE_VALUE
      : items[0]?.value ?? NONE_VALUE;
    commit(draft ?? fallback);
  };

  const showWheel = Platform.OS === 'ios' && useWheelOnIOS;

  return (
    <>
      <PickerField
        style={getMarginStyles({ ...rest })}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        selectedValue={selectedValue}
        onFocus={openSheet}
        items={items}
        label={label}
        error={error}
      />

      <BaseModal
        title={null}
        isOpen={open}
        onClose={closeSheet}
        variant="sheet"
        direction="up"
        backdropOpacity={0.5}
        // Panel itself uses gray when showing the wheel; white for list mode
        panelStyle={{
          borderTopLeftRadius: Radiuses.xs,
          borderTopRightRadius: Radiuses.xs,
          backgroundColor: showWheel ? Colors.IOS_GRAY : Colors.WHITE,
        }}
        // Ensure the whole content area is the same as panel (avoid stray white)
        contentStyle={{
          paddingTop: showWheel ? 0 : Spacings.xs,
          paddingHorizontal: Spacings.md,
          paddingBottom: insets.bottom + Spacings.sm,
          backgroundColor: showWheel ? Colors.IOS_GRAY : 'transparent',
        }}
      >
        {/* Grabber only for list mode (the iOS wheel design doesn't use it) */}
        {!showWheel && (
          <View style={styles.grabber} accessibilityElementsHidden />
        )}

        {/* Header bar: white, with Done on the right; no gap before wheel */}
        <View
          style={[
            styles.headerRow,
            styles.headerBar,
            showWheel && styles.headerBarRadius,
          ]}
        >
          <TextBold size="ms">{titleText}</TextBold>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Done"
            accessibilityHint="Confirm your selection and close the picker"
            onPress={onDone}
          >
            <TextBold color={Colors.IOS_BLUE} size="ms">
              Done
            </TextBold>
          </Pressable>
        </View>

        {showWheel ? (
          // iOS wheel — solid gray below the white header bar
          <View style={styles.wheelWrap}>
            <RNPicker
              style={styles.wheel}
              selectedValue={
                draft ?? (allowSelectNone ? NONE_VALUE : items[0]?.value)
              }
              onValueChange={(val: string) => setDraft(val)}
            >
              {!!allowSelectNone && (
                <RNPicker.Item
                  label={selectNoneLabel || placeholder || 'None'}
                  value={NONE_VALUE}
                />
              )}
              {items.map((item) => (
                <RNPicker.Item
                  key={item.value}
                  label={item.displayValue ?? item.value}
                  value={item.value}
                />
              ))}
            </RNPicker>
          </View>
        ) : (
          // Cross-platform list
          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {!!allowSelectNone && (
              <Pressable
                onPress={() => commit(NONE_VALUE)}
                style={({ pressed }) => [
                  styles.row,
                  pressed && { opacity: 0.9 },
                ]}
                accessibilityRole="button"
              >
                <TextRegular>
                  {selectNoneLabel || placeholder || 'None'}
                </TextRegular>
              </Pressable>
            )}

            {items.map((item) => {
              const selected = item.value === selectedValue;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => commit(item.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.row,
                    pressed && { opacity: 0.9 },
                    selected && styles.selectedRow,
                  ]}
                >
                  <TextRegular>{item.displayValue ?? item.value}</TextRegular>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </BaseModal>
    </>
  );
}

const styles = StyleSheet.create({
  grabber: {
    alignSelf: 'center',
    width: 18,
    height: 5,
    borderRadius: 50,
    backgroundColor: '#3C3C434D',
    transform: [{ scaleX: 2 }],
    marginVertical: 5,
  },
  // Header row (always)
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // White header bar + hairline divider (exactly like original)
  headerBar: {
    backgroundColor: Colors.WHITE,
    paddingHorizontal: Spacings.xs,
    paddingVertical: Spacings.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.NEUTRAL_LIGHT,
    marginBottom: 0, // no gap before wheel
  },
  // Make the header bar inherit the panel radius at the top when used with wheel
  headerBarRadius: {
    borderTopLeftRadius: Radiuses.xs,
    borderTopRightRadius: Radiuses.xs,
  },

  // List mode styles
  list: {
    gap: Spacings.xs,
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.xs,
    backgroundColor: Colors.WHITE,
  },
  row: {
    minHeight: 44,
    borderRadius: Radiuses.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.WHITE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.NEUTRAL_LIGHT,
  },
  selectedRow: {
    borderColor: Colors.PRIMARY,
  },

  // Wheel area stays solid gray, flush under the white header bar
  wheelWrap: {
    backgroundColor: Colors.IOS_GRAY,
    borderBottomLeftRadius: Radiuses.xs,
    borderBottomRightRadius: Radiuses.xs,
    overflow: 'hidden',
  },
  wheel: {
    backgroundColor: Colors.IOS_GRAY,
  },
});
