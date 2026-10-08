import type { Meta, StoryObj } from '@storybook/react';
import { FormattedDate } from './FormattedDate';

const meta: Meta<typeof FormattedDate> = {
  title: 'FormattedDate',
  component: FormattedDate,
  argTypes: {
    fallback: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof FormattedDate>;

const sampleValue = '2026-10-01T14:35:00.000Z';

const canvasClassName = 'flex-col items-start';

export const DateOnly: Story = {
  args: { value: sampleValue, preset: 'date' },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => <FormattedDate {...args} />,
};

export const DateTime: Story = {
  args: { value: sampleValue, preset: 'date-time' },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => <FormattedDate {...args} />,
};

export const Relative: Story = {
  args: { value: sampleValue, preset: 'relative' },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => <FormattedDate {...args} />,
};

export const AppendedRelative: Story = {
  args: { value: sampleValue, appendRelative: true },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => <FormattedDate {...args} />,
};

export const DateInstance: Story = {
  args: { value: new Date(sampleValue), preset: 'date' },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => <FormattedDate {...args} />,
};

export const Fallback: Story = {
  args: { value: null, fallback: 'No date available' },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => <FormattedDate {...args} />,
};

export const InvalidValue: Story = {
  args: { value: 'not-a-date', fallback: 'Invalid date' },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => <FormattedDate {...args} />,
};
