import { useUser } from '@monorepo/react/betterangels-admin';
import {
  BetterAngelsLogoBadge,
  Sidebar,
  mergeCss,
} from '@monorepo/react/components';
import { UsersIcon } from '@monorepo/react/icons';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

type IProps = {
  className?: string;
};

export function AppSidebar(props: IProps) {
  const { className } = props;

  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const location = useLocation();

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
        {user?.canViewOrgMembers && (
          <Sidebar.Link
            to="/users"
            isActive={location.pathname === '/users'}
            collapsed={!isOpen}
            icon={(color: string) => <UsersIcon className="w-4" fill={color} />}
          >
            Users
          </Sidebar.Link>
        )}
      </Sidebar.Content>
    </Sidebar>
  );
}
