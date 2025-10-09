import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Colors,
  Radiuses,
  Spacings,
  getMarginStyles,
} from '@monorepo/expo/shared/static';
import { BaseModal } from '../Modal/BaseModal';
import { TextBold } from '../TextBold/TextBold';
import { TextRegular } from '../TextRegular/TextRegular';

import { PickerField } from './PickerField';
import { WheelPicker } from './WheelPicker';
import { NONE_VALUE } from './constants';
import { IPickerProps } from './types';

type Props = IPickerProps & { useWheelOnIOS?: boolean };

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
  const insets = useSafeAreaInsets();

  const draftRef = useRef<string | null>(selectedValue ?? null);

  useEffect(() => {
    if (!open) return;
    draftRef.current =
      selectedValue ?? (allowSelectNone ? NONE_VALUE : items[0]?.value ?? null);
  }, [open, selectedValue, allowSelectNone, items]);

  const titleText = useMemo(
    () => label ?? placeholder ?? 'Select',
    [label, placeholder]
  );

  const initialWheelValue = useMemo(
    () =>
      (selectedValue ?? (allowSelectNone ? NONE_VALUE : items[0]?.value)) as
        | string
        | undefined,
    [selectedValue, allowSelectNone, items]
  );

  const openPicker = useCallback(() => {
    if (!disabled) setOpen(true);
  }, [disabled]);

  const closePicker = useCallback(() => setOpen(false), []);

  const commit = useCallback(
    (val: string) => {
      closePicker();
      if (val === NONE_VALUE) return onChange(null);
      onChange(val);
    },
    [closePicker, onChange]
  );

  const onDone = useCallback(() => {
    const fallback = allowSelectNone
      ? NONE_VALUE
      : items[0]?.value ?? NONE_VALUE;
    const v = draftRef.current ?? fallback;
    commit(v);
  }, [allowSelectNone, items, commit]);

  return (
    <>
      <PickerField
        style={getMarginStyles({ ...rest })}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        selectedValue={selectedValue}
        onFocus={openPicker}
        items={items}
        label={label}
        error={error}
      />

      <BaseModal
        title={null}
        isOpen={open}
        onClose={closePicker}
        variant="sheet"
        direction="up"
        backdropOpacity={0.5}
        panelStyle={{
          borderTopLeftRadius: Radiuses.xs,
          borderTopRightRadius: Radiuses.xs,
          backgroundColor: useWheelOnIOS ? Colors.IOS_GRAY : Colors.WHITE,
        }}
        contentStyle={{
          paddingTop: useWheelOnIOS ? 0 : Spacings.xs,
          paddingBottom: insets.bottom + Spacings.sm,
          backgroundColor: useWheelOnIOS ? Colors.IOS_GRAY : 'transparent',
        }}
      >
        {/* Header */}
        <View
          style={[
            styles.headerRow,
            styles.headerBar,
            useWheelOnIOS && styles.headerBarRadius,
          ]}
        >
          <TextBold size="ms">{titleText}</TextBold>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Done"
            accessibilityHint="Confirms your selection and closes the picker"
            onPress={onDone}
          >
            <TextBold color={Colors.IOS_BLUE} size="ms">
              Done
            </TextBold>
          </Pressable>
        </View>

        {useWheelOnIOS ? (
          <View style={styles.wheelWrap}>
            <WheelPicker
              initialValue={initialWheelValue}
              items={items}
              allowSelectNone={allowSelectNone}
              placeholder={placeholder}
              selectNoneLabel={selectNoneLabel}
              onDraftChange={(val) => {
                draftRef.current = val;
              }}
            />
          </View>
        ) : (
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBar: {
    backgroundColor: Colors.WHITE,
    paddingHorizontal: Spacings.xs,
    paddingVertical: Spacings.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.NEUTRAL_LIGHT,
  },
  headerBarRadius: {
    borderTopLeftRadius: Radiuses.xs,
    borderTopRightRadius: Radiuses.xs,
  },
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
  selectedRow: { borderColor: Colors.PRIMARY },
  wheelWrap: {
    backgroundColor: Colors.IOS_GRAY,
    borderBottomLeftRadius: Radiuses.xs,
    borderBottomRightRadius: Radiuses.xs,
    overflow: 'hidden',
  },
});
