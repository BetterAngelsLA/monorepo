import { useEffect, useState } from 'react';
import { mergeCss } from '../../utils/mergeCss';
import { Checkbox } from './Checkbox';

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
  selectAll?: string;
  onChange: (selected: string[]) => void;
};

export function CheckboxGroup(props: TProps) {
  const {
    className,
    options,
    values = [],
    selectAll = SELECT_ALL_LABEL,
    onChange,
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
      if (selectAll && value === SELECT_ALL_KEY) {
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

    if (selectAll) {
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

  if (selectAll) {
    visibleOptions.unshift({
      label: selectAll,
      value: SELECT_ALL_KEY,
    });
  }

  const allSelected = cbxOptions.length === values.length;

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
            className="mb-2 last:mb-0"
            label={option.label}
            checked={isChecked}
            onChange={(checked) => handleChange(option.value, checked)}
          />
        );
      })}
    </div>
  );
}
