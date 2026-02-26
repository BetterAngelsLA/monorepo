import type { Meta } from '@storybook/react';
import { useState } from 'react';
import type { DropdownOption } from './dropdown';
import { Dropdown } from './dropdown';

const meta: Meta<typeof Dropdown> = {
  component: Dropdown,
  title: 'Dropdown',
};
export default meta;

const options: DropdownOption[] = [
  { label: 'Alphabetical Order', value: 'alphabetical' },
  { label: 'Bed Capacity', value: 'bed_capacity' },
  { label: 'Creation Date', value: 'creation_date' },
  { label: 'Modification Date', value: 'modification_date1' },
  { label: 'Modification Date', value: 'modification_date2' },
  { label: 'Modification Date', value: 'modification_date3' },
  { label: 'Modification Date', value: 'modification_date4' },
  { label: 'Modification Date', value: 'modification_date5' },
  { label: 'Modification Date', value: 'modification_date6' },
];

export const SingleSelect = () => {
  const [value, setValue] = useState<DropdownOption | null>(null);
  return (
    <div className="w-80 p-4">
      <Dropdown
        label="Field Label"
        placeholder="Please select"
        options={options}
        value={value}
        onChange={(v) => setValue(v ? (v as DropdownOption) : null)}
        isMulti={false}
        isSearchable={true}
        hasFooter={false}
      />
    </div>
  );
};

export const MultiSelect = () => {
  const [value, setValue] = useState<DropdownOption[] | null>(null);
  return (
    <div className="w-80 p-4">
      <Dropdown
        label="Field Label"
        placeholder="Please select"
        options={options}
        value={value}
        onChange={(v) => setValue(v ? (v as DropdownOption[]) : null)}
        isMulti={true}
        isSearchable={true}
        hasFooter={true}
      />
    </div>
  );
};
