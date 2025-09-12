import { UsersIcon } from '@monorepo/react/icons';
import { disableControls, withMemoryRouter } from '@monorepo/react/storybook';
import type { Meta, StoryObj } from '@storybook/react';
import { SidebarLink } from './SidebarLink';

const meta: Meta<typeof SidebarLink> = {
  title: 'Sidebar/SidebarLink',
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
  parameters: {
    customLayout: {
      canvasClassName: 'flex-col',
    },
  },
  render: (args) => {
    const baseArgs = { ...withIconArgs, ...args };

    return (
      <>
        <SidebarLink {...baseArgs}>text</SidebarLink>
        <SidebarLink {...baseArgs} className="pseudo-hover">
          hover
        </SidebarLink>
        <SidebarLink {...baseArgs} className="pseudo-active">
          active
        </SidebarLink>
      </>
    );
  },
};
