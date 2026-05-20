import {
  CarryOutOutlined,
  FileSearchOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { Divider, Sidebar } from '@monorepo/react/components';
import { UsersIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';
import { operatorPath } from '@monorepo/react/shelter';
import { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  isShelterManageRoute,
  isShelterProfileRoute,
  isShelterRoute,
  paths,
  shelterManageRoute,
  shelterProfileRoute,
} from '../../routing';

type IProps = {
  className?: string;
};

export function AppSidebar(props: IProps) {
  const { className } = props;

  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { shelterId } = useParams<{ shelterId: string }>();

  const parentCss = ['bg-[#FAFAFA]', className];

  return (
    <Sidebar className={mergeCss(parentCss)} onOpenChange={setIsOpen}>
      <Sidebar.Content className="pt-6">
        <Sidebar.Link
          to={operatorPath}
          isActive={location.pathname === operatorPath}
          collapsed={!isOpen}
          icon={(color: string) => (
            <HomeOutlined className="w-4" style={{ color: color }} />
          )}
        >
          Dashboard
        </Sidebar.Link>

        <Sidebar.Link
          to={paths.users}
          isActive={location.pathname === paths.users}
          collapsed={!isOpen}
          icon={(color: string) => <UsersIcon className="w-4" fill={color} />}
        >
          Users
        </Sidebar.Link>

        {isShelterRoute(location.pathname) && shelterId && (
          <>
            <Divider
              className="py-4"
              label={isOpen ? 'shelter management' : ''}
            />

            <Sidebar.Link
              to={shelterManageRoute(shelterId)}
              isActive={isShelterManageRoute(location.pathname)}
              collapsed={!isOpen}
              icon={(color: string) => (
                <CarryOutOutlined className="w-4" style={{ color: color }} />
              )}
            >
              Operations
            </Sidebar.Link>

            <Sidebar.Link
              to={shelterProfileRoute(shelterId)}
              isActive={isShelterProfileRoute(location.pathname)}
              collapsed={!isOpen}
              icon={(color: string) => (
                <FileSearchOutlined className="w-4" style={{ color: color }} />
              )}
            >
              Shelter Profile
            </Sidebar.Link>
          </>
        )}
      </Sidebar.Content>
    </Sidebar>
  );
}
