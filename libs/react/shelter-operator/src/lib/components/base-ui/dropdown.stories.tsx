import type { Meta, StoryObj } from '@storybook/react';
import { Dropdown, DropdownOption } from './dropdown';

const meta: Meta<typeof Dropdown> = {
  component: Dropdown,
  title: 'Dropdown',
};
export default meta;

type Story = StoryObj<typeof Dropdown>;

const options: DropdownOption[] = [
  { label: 'Option 1', value: 1 },
  { label: 'Option 2', value: 2 },
  { label: 'Option 3', value: 3 },
];

export const SingleSelect: Story = {
  args: {
    label: 'Field Label',
    placeholder: 'Please select',
    options,
    value: '',
    onChange: () => undefined,
    isMulti: false,
    isSearchable: false,
    hasFooter: false,
  },
};

export const MultiSelect: Story = {
  args: {
    label: 'Field Label',
    placeholder: 'Please select',
    options,
    value: [],
    onChange: () => undefined,
    isMulti: true,
    isSearchable: true,
    hasFooter: true,
  },
};
