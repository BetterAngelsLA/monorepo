import { useCallback, useMemo } from 'react';
import { Control, FieldValues, Path, useController } from 'react-hook-form';
import { Dropdown } from '../dropdown';
import type { DropdownOption, DropdownProps } from '../dropdown/types';
import { Input } from '../input';

/** Props shared between controlled and uncontrolled modes. */
type ComboBoxSharedProps<T extends string | number = string | number> = Omit<
  Extract<DropdownProps<T>, { isMulti: true }>,
  'onChange' | 'value' | 'isMulti'
> & {
  /** The option value that triggers the input to appear. */
  triggerValue: T;
  /** Label for the conditional input. */
  inputLabel?: string;
  /** Placeholder for the conditional input. */
  inputPlaceholder?: string;
  /** Error message for the input. */
  inputError?: string;
  /** Whether form is disabled. */
  disabled?: boolean;
};

/** RHF-controlled mode: pass control + field names and ComboBox wires itself. */
type ComboBoxControlledProps<
  T extends string | number = string | number,
  TForm extends FieldValues = FieldValues
> = ComboBoxSharedProps<T> & {
  /** react-hook-form control object. */
  control: Control<TForm>;
  /** Field name for the multi-select value (T[]). */
  name: Path<TForm>;
  /** Field name for the conditional text input value (string | null). */
  inputName: Path<TForm>;
  value?: never;
  onChange?: never;
  inputValue?: never;
  onInputChange?: never;
};

/** Uncontrolled mode: pass value/onChange directly. */
type ComboBoxUncontrolledProps<T extends string | number = string | number> =
  ComboBoxSharedProps<T> & {
    control?: undefined;
    name?: undefined;
    inputName?: undefined;
    /** Current multi-select value. */
    value: DropdownOption<T>[] | null;
    /** Called when dropdown selection changes. */
    onChange: (value: DropdownOption<T>[] | null) => void;
    /** Current value of the text input. */
    inputValue: string | null | undefined;
    /** Called when the text input changes. Receives null when cleared. */
    onInputChange: (value: string | null) => void;
  };

type ComboBoxProps<
  T extends string | number = string | number,
  TForm extends FieldValues = FieldValues
> = ComboBoxControlledProps<T, TForm> | ComboBoxUncontrolledProps<T>;

export function ComboBox<
  T extends string | number = string | number,
  TForm extends FieldValues = FieldValues
>(props: ComboBoxProps<T, TForm>) {
  if (props.control) {
    return (
      <ControlledComboBox {...(props as ComboBoxControlledProps<T, TForm>)} />
    );
  }
  return <ComboBoxInner {...(props as ComboBoxUncontrolledProps<T>)} />;
}

/** Internal: hooks into react-hook-form then delegates to ComboBoxInner. */
function ControlledComboBox<
  T extends string | number = string | number,
  TForm extends FieldValues = FieldValues
>(props: ComboBoxControlledProps<T, TForm>) {
  const { control, name, inputName, options, ...rest } = props;

  const { field } = useController({ name, control });
  const { field: inputField } = useController({ name: inputName, control });

  const value = useMemo(
    () =>
      (options as DropdownOption<T>[]).filter((o) =>
        (field.value as T[]).includes(o.value)
      ),
    [options, field.value]
  );

  const handleChange = useCallback(
    (opts: DropdownOption<T>[] | null) => {
      field.onChange(opts ? opts.map((o) => o.value) : []);
    },
    [field]
  );

  return (
    <ComboBoxInner
      {...rest}
      options={options}
      value={value}
      onChange={handleChange}
      inputValue={inputField.value}
      onInputChange={inputField.onChange}
    />
  );
}

/** Internal: renders the Dropdown + conditional Input. */
function ComboBoxInner<T extends string | number = string | number>(
  props: ComboBoxSharedProps<T> & {
    value: DropdownOption<T>[] | null;
    onChange: (value: DropdownOption<T>[] | null) => void;
    inputValue: string | null | undefined;
    onInputChange: (value: string | null) => void;
  }
) {
  const {
    triggerValue,
    inputLabel = 'Other',
    inputPlaceholder,
    inputValue,
    onInputChange,
    inputError,
    onChange,
    value,
    disabled,
    isViewMode,
    ...dropdownProps
  } = props;

  const showInput = useMemo(
    () => Array.isArray(value) && value.some((v) => v.value === triggerValue),
    [value, triggerValue]
  );

  const handleDropdownChange = useCallback(
    (options: DropdownOption<T>[] | null) => {
      onChange(options);

      const hasTrigger =
        options?.some((o) => o.value === triggerValue) ?? false;
      if (!hasTrigger) {
        onInputChange(null);
      }
    },
    [onChange, onInputChange, triggerValue]
  );

  return (
    <div className="flex flex-col gap-4">
      <Dropdown
        {...dropdownProps}
        isMulti={true}
        value={value}
        onChange={handleDropdownChange}
        isViewMode={isViewMode}
        disabled={disabled}
      />

      {showInput && (
        <Input
          label={inputLabel}
          placeholder={inputPlaceholder}
          dataType="string"
          value={inputValue ?? ''}
          onChange={(event) => {
            const v = (event.target as HTMLInputElement).value;

            onInputChange(v === '' ? null : v);
          }}
          disabled={disabled}
          isViewMode={isViewMode}
          error={inputError}
        />
      )}
    </div>
  );
}
