import { getMarginStyles } from '@monorepo/expo/shared/static';
import { useCallback, useState } from 'react';
import { Keyboard } from 'react-native';

import { PickerField } from './PickerField';
import { PickerModal } from './PickerModal';
import { NONE_VALUE } from './constants';
import { IPickerProps } from './types';

export default function Picker(props: IPickerProps) {
  const {
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
  } = props;

  const [isModalVisible, setIsModalVisible] = useState(false);

  const open = useCallback(() => {
    if (disabled) return;
    Keyboard.dismiss();
    setIsModalVisible(true);
  }, [disabled]);

  const close = useCallback(() => setIsModalVisible(false), []);

  const onSelect = useCallback(
    (newValue: string) => {
      Keyboard.dismiss();
      setIsModalVisible(false);
      if (newValue === NONE_VALUE) return onChange(null);
      onChange(newValue);
    },
    [onChange]
  );

  return (
    <>
      <PickerField
        style={getMarginStyles(props)} // apply margins once here
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        selectedValue={selectedValue}
        onFocus={open}
        items={items}
        label={label}
        error={error}
      />

      <PickerModal
        visible={isModalVisible}
        items={items}
        selectedValue={selectedValue}
        allowSelectNone={allowSelectNone}
        selectNoneLabel={selectNoneLabel || placeholder}
        onSelect={onSelect}
        onClose={close}
      />
    </>
  );
}
