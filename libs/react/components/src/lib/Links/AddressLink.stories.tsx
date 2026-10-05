import { disableControls } from '@monorepo/react/storybook';
import type { Meta, StoryObj } from '@storybook/react';
import { AddressLink } from './AddressLink';

const meta: Meta<typeof AddressLink> = {
  title: 'Links/AddressLink',
  component: AddressLink,
  argTypes: disableControls(['icon', 'fallback']),
};

export default meta;

type Story = StoryObj<typeof AddressLink>;

const canvasClassName = 'flex-col items-start';

export const WithAddress: Story = {
  args: {
    address: '1600 Vine St, Los Angeles, CA',
  },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => <AddressLink {...args} />,
};

export const WithCoordinates: Story = {
  args: {
    latitude: 34.0522,
    longitude: -118.2437,
    label: '1600 Vine St',
  },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => <AddressLink {...args} />,
};

export const ProviderAuto: Story = {
  args: {
    address: '1600 Vine St, Los Angeles, CA',
    provider: 'auto',
  },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => <AddressLink {...args} />,
};

export const OpensInNewTab: Story = {
  args: {
    address: '1600 Vine St, Los Angeles, CA',
    icon: true,
    openExternal: true,
  },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => <AddressLink {...args} />,
};

export const Fallback: Story = {
  args: {
    fallback: 'No location available',
  },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => <AddressLink {...args} />,
};
