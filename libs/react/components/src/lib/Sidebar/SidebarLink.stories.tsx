import { UsersIcon } from '@monorepo/react/icons';
import {
  SbkPanel,
  disableControls,
  withMemoryRouter,
} from '@monorepo/storybook-web';
import type { Meta, StoryObj } from '@storybook/react';
import { SidebarLink } from './SidebarLink';

const meta: Meta<typeof SidebarLink> = {
  title: 'Components/Sidebar/SidebarLink',
  component: SidebarLink,
  decorators: [withMemoryRouter('/')],
  argTypes: disableControls(['to', 'icon', 'className', 'children']),
};

export default meta;

type Story = StoryObj<typeof SidebarLink>;

const withIconArgs = {
  to: '/dashboard',
  icon: (color: string) => <UsersIcon fill={color} className="w-4" />,
};

export const WithIcon: Story = {
  render: (args) => {
    const baseArgs = { ...withIconArgs, ...args };

    return (
      <SbkPanel className="flex-col w-[400px] p-8 border-2 border-gray-100">
        <SidebarLink {...baseArgs}>text</SidebarLink>
        <SidebarLink {...baseArgs} className="pseudo-hover">
          hover
        </SidebarLink>
        <SidebarLink {...baseArgs} className="pseudo-active">
          active
        </SidebarLink>
      </SbkPanel>
    );
  },
};
