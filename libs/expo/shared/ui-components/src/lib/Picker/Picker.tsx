import { getMarginStyles } from '@monorepo/expo/shared/static';
import { useCallback, useRef, useState } from 'react';
import { Keyboard, Platform, TextInput } from 'react-native';

import { PickerField } from './PickerField';
import { PickerModal } from './PickerModal';
import { NONE_VALUE } from './constants';
import { IPickerProps } from './types';

export default function Picker(props: IPickerProps) {
  const {
    onChange,
    onAfterClose,
    error,
    selectedValue,
    placeholder,
    allowSelectNone,
    selectNoneLabel,
    items,
    label,
    required,
    disabled,
    modalTitle,
    placeholderTextColor,
    testId,
  } = props;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  /**
   * react-native-web's Modal refocuses whatever opened it when it closes
   * ("To be fully compliant with WCAG we need to refocus element that triggered
   * opening modal" — ModalFocusTrap). This field opens the picker from
   * `onFocus`, so that refocus reopened the picker every time it was closed —
   * by the backdrop, by Escape, or by picking an item — and it could never be
   * dismissed.
   *
   * So the one focus the close hands back is suppressed, and the field is blurred
   * with it: a tap on an already-focused field fires no focus event, so leaving
   * focus there would make the picker impossible to reopen.
   *
   * Suppressing "the next focus" naively is not enough, because closing via the
   * backdrop produces no refocus at all — the flag would stay armed and eat the
   * user's next tap instead. Two things disarm it:
   *
   *   - a `pointerdown`, which every real tap starts with and the programmatic
   *     refocus never has, so a tap is always honoured; and
   *   - a timeout, as a backstop so the flag cannot outlive the moment it guards.
   *
   * Web only: native hands focus back to nothing.
   */
  const suppressRefocusRef = useRef(false);

  const close = useCallback(() => {
    if (Platform.OS === 'web') {
      suppressRefocusRef.current = true;

      const disarm = () => {
        suppressRefocusRef.current = false;
        document.removeEventListener('pointerdown', disarm, true);
      };

      document.addEventListener('pointerdown', disarm, true);
      setTimeout(disarm, 1000);
    }

    setIsModalVisible(false);
  }, []);

  const open = useCallback(() => {
    if (Platform.OS === 'web' && suppressRefocusRef.current) {
      suppressRefocusRef.current = false;
      inputRef.current?.blur();
      return;
    }

    if (disabled) return;
    Keyboard.dismiss();
    setIsModalVisible(true);
  }, [disabled]);

  const onSelect = useCallback(
    (newValue: string) => {
      Keyboard.dismiss();
      close();

      if (newValue === NONE_VALUE) return onChange(null);
      onChange(newValue);
    },
    [close, onChange],
  );

  return (
    <>
      <PickerField
        style={getMarginStyles(props)}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        selectedValue={selectedValue}
        onFocus={open}
        inputRef={inputRef}
        items={items}
        label={label}
        error={error}
        testId={testId}
      />

      <PickerModal
        title={modalTitle}
        visible={isModalVisible}
        items={items}
        selectedValue={selectedValue}
        allowSelectNone={allowSelectNone}
        selectNoneLabel={selectNoneLabel || placeholder}
        onSelect={onSelect}
        onClose={close}
        onAfterClose={onAfterClose}
      />
    </>
  );
}
