import type { Meta } from '@storybook/react';
import { useState } from 'react';
import type { DropdownOption } from './types';
import { Dropdown } from './Dropdown';

const meta: Meta<typeof Dropdown> = {
  component: Dropdown,
  title: 'Base UI/Dropdown',
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
        label="Sort By"
        placeholder="Please select"
        options={options}
        value={value}
        onChange={(v) => setValue(v)}
      />
    </div>
  );
};

export const SingleSelectSearchable = () => {
  const [value, setValue] = useState<DropdownOption | null>(null);
  return (
    <div className="w-80 p-4">
      <Dropdown
        label="Sort By"
        placeholder="Please select"
        options={options}
        value={value}
        onChange={(v) => setValue(v)}
        isSearchable
      />
    </div>
  );
};

export const MultiSelect = () => {
  const [value, setValue] = useState<DropdownOption[] | null>(null);
  return (
    <div className="w-80 p-4">
      <Dropdown
        label="Categories"
        placeholder="Please select"
        options={options}
        value={value}
        onChange={(v) => setValue(v)}
        isMulti
      />
    </div>
  );
};

export const MultiSelectSearchable = () => {
  const [value, setValue] = useState<DropdownOption[] | null>(null);
  return (
    <div className="w-80 p-4">
      <Dropdown
        label="Categories"
        placeholder="Please select"
        options={options}
        value={value}
        onChange={(v) => setValue(v)}
        isMulti
        isSearchable
        required
      />
    </div>
  );
};

/**
 * The dropdown is inside an `overflow-hidden` container. Because the menu
 * is portal-rendered to `document.body`, it escapes the overflow boundary.
 */
export const InsideOverflowHidden = () => {
  const [value, setValue] = useState<DropdownOption[] | null>(null);
  return (
    <div className="p-4 space-y-4">
      <p className="text-sm text-gray-500">
        The grey box below has <code>overflow: hidden</code>. The dropdown menu
        escapes it because the menu is rendered via a portal.
      </p>
      <div className="w-80 h-24 overflow-hidden border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
        <Dropdown
          label="Portal Demo"
          placeholder="Open me"
          options={options}
          value={value}
          onChange={(v) => setValue(v)}
          isMulti
          isSearchable
        />
      </div>
    </div>
  );
};
