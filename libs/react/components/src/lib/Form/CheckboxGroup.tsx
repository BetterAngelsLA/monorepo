import { useEffect, useState } from 'react';
import { mergeCss } from '../../lib-utils/mergeCss';
import { Checkbox } from './Checkbox';

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
  selectAllKey?: string;
  onChange: (selected: string[]) => void;
};

export function CheckboxGroup(props: TProps) {
  const { className, options, values = [], selectAllKey, onChange } = props;

  const [cbxOptions, setCbxOptions] = useState<TCheckboxOptionKv[]>([]);
  const [selected, setSelected] = useState<string[]>(values);

  useEffect(() => {
    const normalized = normalizeOptions(options);

    setCbxOptions(normalized);
  }, [options]);

  useEffect(() => {
    onChange(selected);
  }, [selected]);

  function handleChange(value: string, checked: boolean) {
    // add
    if (checked) {
      return setSelected((prev) => {
        if (selectAllKey && value === selectAllKey) {
          return cbxOptions.map((option) => option.value);
        }

        const idx = prev.indexOf(value);

        if (idx > -1) {
          return prev;
        }

        return [...prev, value];
      });
    }

    // or remove
    return setSelected((prev) => {
      const removableValues = [value];

      if (selectAllKey) {
        // removing all
        if (value === selectAllKey) {
          return [];
        }

        // not removing all, so will unselect ALL key
        removableValues.push(selectAllKey);
      }

      return prev.filter((val) => {
        return !removableValues.includes(val);
      });
    });
  }

  return (
    <div className={mergeCss(className)}>
      {cbxOptions.map((option, idx: number) => {
        const isChecked = selected.indexOf(option.value) > -1;

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
