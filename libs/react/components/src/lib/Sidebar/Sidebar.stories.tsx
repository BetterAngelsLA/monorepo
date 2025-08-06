import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';

import { UsersIcon } from '@monorepo/react/icons';
import type { Meta, StoryObj } from '@storybook/react';
import { BetterAngelsLogoBadge } from '../BetterAngelsLogoBadge';

function SidebarStoryWrapper() {
  const [isOpen, setIsOpen] = useState(true); // open by default

  const userOrganization = { name: 'Storybook Org' };

  return (
    // <div className="border-2 border-gray-700 flex flex-row h-screen">
    <div className="border-4 border-gray-300 flex flex-row h-screen">
      <Sidebar className="h-screen" onOpenChange={setIsOpen}>
        <Sidebar.Header>
          <BetterAngelsLogoBadge className="ml-1 mr-2 flex-shrink-0" />
          {userOrganization?.name && isOpen && (
            <h2 className="text-2xl truncate">{userOrganization.name}</h2>
          )}
        </Sidebar.Header>

        <Sidebar.Content>
          <Sidebar.Link
            to="/users"
            collapsed={!isOpen}
            icon={(color: string) => <UsersIcon className="w-4" fill={color} />}
          >
            Users
          </Sidebar.Link>
          {/* <Sidebar.Link
            to="/teams"
            collapsed={!isOpen}
            icon={(color: string) => (
              <GroupsIcon className="w-4" fill={color} />
            )}
          >
            Teams
          </Sidebar.Link> */}
          {/* <Sidebar.Link
            to="/services"
            collapsed={!isOpen}
            icon={(color: string) => (
              <HandHeartOutlineIcon className="w-4" fill={color} />
            )}
          >
            Services
          </Sidebar.Link> */}
        </Sidebar.Content>
      </Sidebar>
    </div>
  );
}

const meta: Meta<typeof SidebarStoryWrapper> = {
  title: 'Layout/AppSidebar',
  component: SidebarStoryWrapper,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof SidebarStoryWrapper>;

export const Default: Story = {};
