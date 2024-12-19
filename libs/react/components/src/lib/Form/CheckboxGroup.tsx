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
  onChange: (selected: string[]) => void;
};

export function CheckboxGroup(props: TProps) {
  const { className, options, onChange } = props;

  const [cbxOptions, setCbxOptions] = useState<TCheckboxOptionKv[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

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
        const idx = prev.indexOf(value);

        if (idx > -1) {
          return prev;
        }

        return [...prev, value];
      });
    }

    // or remove
    return setSelected((prev) => {
      const idx = prev.indexOf(value);

      if (idx < 0) {
        return prev;
      }

      const copy = [...prev];

      copy.splice(idx, 1);

      return copy;
    });
  }

  let parentCss = ['flex', 'flex-col', className];

  return (
    <div className={mergeCss(parentCss)}>
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
