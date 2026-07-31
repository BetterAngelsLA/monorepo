import { ReactNode } from 'react';
import { LabelVariant } from '../label/label';

export interface DropdownOption<T extends string | number = string | number> {
  label: string;
  value: T;
}

interface DropdownBaseProps<T extends string | number = string | number> {
  label?: string;
  labelVariant?: LabelVariant;
  placeholder?: string;
  options: ReadonlyArray<DropdownOption<T>>;
  isSearchable?: boolean;
  onCreateOption?: (label: string) => void | Promise<void>;
  createOptionLabel?: (label: string) => string;
  isViewMode?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  labelClassname?: string;
  onOtherTextChange?: (text: string) => void;
  renderValue?: (selected: DropdownOption<T>[]) => ReactNode;
  error?: string;
}

export type DropdownProps<T extends string | number = string | number> =
  DropdownBaseProps<T> &
    (
      | {
          isMulti: true;
          value: DropdownOption<T>[] | null;
          onChange: (value: DropdownOption<T>[] | null) => void;
        }
      | {
          isMulti?: false;
          value: DropdownOption<T> | null;
          onChange: (value: DropdownOption<T> | null) => void;
        }
    );

/**
 * Widened version of DropdownProps used inside the component implementation.
 * Erases the discriminated union so both isMulti branches are accessible.
 */
export type DropdownInternalProps<T extends string | number = string | number> =
  DropdownBaseProps<T> & {
    isMulti: boolean;
    value: DropdownOption<T> | DropdownOption<T>[] | null;
    onChange: (value: DropdownOption<T> | DropdownOption<T>[] | null) => void;
    renderValue?: (selected: DropdownOption<T>[]) => React.ReactNode;
  };
