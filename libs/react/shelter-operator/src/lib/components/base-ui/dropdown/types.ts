export interface DropdownOption<T extends string | number = string | number> {
  label: string;
  value: T;
}

interface DropdownBaseProps<T extends string | number = string | number> {
  label?: string;
  placeholder?: string;
  options: DropdownOption<T>[];
  isSearchable?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
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
  };
