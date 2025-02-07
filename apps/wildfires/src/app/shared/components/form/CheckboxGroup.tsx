import { ElementType, useEffect, useState } from 'react';
import { mergeCss } from '../../utils/styles/mergeCss';
import { Checkbox as DefaultCheckbox, ICheckboxProps } from './Checkbox';

const SELECT_ALL_KEY = 'select_all';
const SELECT_ALL_LABEL = 'Select All';

type TCheckboxOptionKv = {
  label: string;
  value: string;
};

type TCheckboxOption = string | TCheckboxOptionKv;

function normalizeOptions(options: TCheckboxOption[]): TCheckboxOptionKv[] {
  if (!options) {
    return [];
  }

  return options.map((option) => {
    if (typeof option === 'string') {
      return {
        label: option,
        value: option,
      };
    }

    return option;
  });
}

export type TProps = {
  className?: string;
  options: TCheckboxOption[];
  values: string[];
  withSelectAll?: boolean;
  selectAllLabel?: string;
  onChange: (selected: string[]) => void;
  CheckboxComponent?: ElementType<ICheckboxProps>;
  checkboxCss?: string;
};

export function CheckboxGroup(props: TProps) {
  const {
    className,
    options,
    values = [],
    withSelectAll,
    selectAllLabel = SELECT_ALL_LABEL,
    onChange,
    CheckboxComponent,
    checkboxCss,
  } = props;

  const [cbxOptions, setCbxOptions] = useState<TCheckboxOptionKv[]>([]);

  useEffect(() => {
    const normalized = normalizeOptions(options);

    setCbxOptions(normalized);
  }, [options]);

  function handleChange(value: string, checked: boolean) {
    // add filter
    if (checked) {
      // if select All
      if (withSelectAll && value === SELECT_ALL_KEY) {
        const allSelected = cbxOptions.map((option) => option.value);

        return onChange(allSelected);
      }

      const idx = values.indexOf(value);

      // if already exists
      if (idx > -1) {
        return onChange(values);
      }

      return onChange([...values, value]);
    }

    // remove filter
    const removableValues = [value];

    if (withSelectAll) {
      // remove all
      if (value === SELECT_ALL_KEY) {
        return onChange([]);
      }

      // not removing all, so will unselect ALL key
      removableValues.push(SELECT_ALL_KEY);
    }

    const updated = values.filter((val) => {
      return !removableValues.includes(val);
    });

    return onChange(updated);
  }

  const visibleOptions = [...cbxOptions];

  if (withSelectAll) {
    visibleOptions.unshift({
      label: selectAllLabel,
      value: SELECT_ALL_KEY,
    });
  }

  const allSelected = cbxOptions.length === values.length;

  const Checkbox = CheckboxComponent || DefaultCheckbox;

  return (
    <div className={mergeCss(className)}>
      {visibleOptions.map((option, idx: number) => {
        let isChecked = values.indexOf(option.value) > -1;

        if (allSelected && option.value === SELECT_ALL_KEY) {
          isChecked = true;
        }

        return (
          <Checkbox
            key={idx}
            className={checkboxCss}
            label={option.label}
            checked={isChecked}
            onChange={(checked) => handleChange(option.value, checked)}
          />
        );
      })}
    </div>
  );
}
