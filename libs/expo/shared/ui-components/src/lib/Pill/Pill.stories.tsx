import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Pill, type IPillProps } from './Pill';

const meta: Meta<IPillProps> = {
  title: 'Pill',
  component: Pill,
  args: {
    label: 'Hello',
    variant: 'success',
  },
  argTypes: {
    variant: {
      control: { type: 'inline-radio' },
      options: ['primary', 'success', 'warning'],
    },
    label: { control: 'text' },
  },
};
export default meta;

type Story = StoryObj<IPillProps>;

export const Success: Story = {
  args: { label: 'Saved', variant: 'success' },
};
