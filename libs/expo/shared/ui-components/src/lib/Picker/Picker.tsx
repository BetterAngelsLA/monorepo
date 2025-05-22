import { getMarginStyles } from '@monorepo/expo/shared/static';
import { useState } from 'react';
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
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  function onSelect(newValue: string) {
    Keyboard.dismiss();
    setIsModalVisible(false);

    if (newValue === NONE_VALUE) {
      onChange(null);

      return;
    }

    onChange(newValue);
  }

  return (
    <>
      <PickerField
        style={getMarginStyles(props)}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        selectedValue={selectedValue}
        onFocus={() => {
          Keyboard.dismiss();
          setIsModalVisible(true);
        }}
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
        onClose={() => setIsModalVisible(false)}
      />
    </>
  );
}
