import { Divider, Sidebar } from '@monorepo/react/components';
import { mergeCss } from '@monorepo/react/shared';
import { operatorPath } from '@monorepo/react/shelter';
import { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { UserOrganizationPermissions } from '../../apollo/graphql/__generated__/types';
import { useActiveOrg } from '../../providers';
import {
  isShelterManageRoute,
  isShelterRoute,
  paths,
  shelterManageRoute,
} from '../../routing';
import { ShelterProfileLinks } from './ShelterProfileLinks';

type IProps = {
  className?: string;
};

export function AppSidebar(props: IProps) {
  const { className } = props;

  const initialOpenState = true;

  const [isOpen, setIsOpen] = useState(initialOpenState);
  const location = useLocation();
  const { shelterId } = useParams<{ shelterId: string }>();
  const { hasPermission } = useActiveOrg();
  const canViewMembers = hasPermission(
    UserOrganizationPermissions.ViewOrgMembers
  );

  const parentCss = ['bg-[#FAFAFA]', className];

  return (
    <Sidebar
      className={mergeCss(parentCss)}
      onOpenChange={setIsOpen}
      initialOpen={initialOpenState}
      variant="basic"
      theme={{
        fontColor: '#747A82',
        activeColor: '#008CEE',
      }}
    >
      <Sidebar.Content className="pt-6">
        <Sidebar.Link
          to={operatorPath}
          isActive={location.pathname === operatorPath}
          collapsed={!isOpen}
        >
          Dashboard
        </Sidebar.Link>

        {canViewMembers && (
          <Sidebar.Link
            to={paths.users}
            isActive={location.pathname === paths.users}
            collapsed={!isOpen}
          >
            Users
          </Sidebar.Link>
        )}

        {isShelterRoute(location.pathname) && shelterId && (
          <>
            <Divider
              className="my-4 h-6 text-[#747A82]"
              lineClassName="bg-[#747A82]"
              label={isOpen ? 'shelter management' : ''}
            />

            <Sidebar.Link
              to={shelterManageRoute(shelterId)}
              isActive={isShelterManageRoute(location.pathname)}
              collapsed={!isOpen}
            >
              Operations
            </Sidebar.Link>

            <ShelterProfileLinks
              pathname={location.pathname}
              shelterId={shelterId}
              isOpen={isOpen}
            />
          </>
        )}
      </Sidebar.Content>
    </Sidebar>
  );
}
