import { useUser } from '@monorepo/react/betterangels-admin';
import {
  BetterAngelsLogoBadge,
  Sidebar,
  mergeCss,
} from '@monorepo/react/components';
import {
  GroupsIcon,
  HandHeartOutlineIcon,
  UsersIcon,
} from '@monorepo/react/icons';
import { useState } from 'react';

type IProps = {
  className?: string;
};

export function AppSidebar(props: IProps) {
  const { className } = props;

  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();

  const userOrganization = user?.organizations?.[0];

  return (
    <Sidebar className={mergeCss(className)} onOpenChange={setIsOpen}>
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
        <Sidebar.Link
          to="/teams"
          collapsed={!isOpen}
          icon={(color: string) => <GroupsIcon className="w-4" fill={color} />}
        >
          Teams
        </Sidebar.Link>
        <Sidebar.Link
          to="/services"
          collapsed={!isOpen}
          icon={(color: string) => (
            <HandHeartOutlineIcon className="w-4" fill={color} />
          )}
        >
          Services
        </Sidebar.Link>
      </Sidebar.Content>
    </Sidebar>
  );
}
