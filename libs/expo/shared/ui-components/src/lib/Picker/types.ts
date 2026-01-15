import { TMarginProps } from '@monorepo/expo/shared/static';

export type TPickerItem = {
  displayValue?: string;
  value: string;
};

export interface IPickerProps extends TMarginProps {
  onChange: (value: string | null) => void;
  error?: string;
  selectedValue?: string | null;
  placeholder: string;
  items: TPickerItem[];
  label?: string;
  required?: boolean;
  disabled?: boolean;
  selectNoneLabel?: string;
  allowSelectNone?: boolean;
  modalTitle?: string;
  placeholderTextColor?: string;
}
