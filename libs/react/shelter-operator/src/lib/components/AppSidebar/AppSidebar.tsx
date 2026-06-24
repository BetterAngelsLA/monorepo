import { HomeOutlined } from '@ant-design/icons';
import { Divider, Sidebar } from '@monorepo/react/components';
import { UsersIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';
import { operatorPath } from '@monorepo/react/shelter';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { isShelterManageRoute, paths, shelterManageRoute } from '../../routing';
import { ShelterProfileLinks } from './ShelterProfileLinks';

type IProps = {
  className?: string;
};

export function AppSidebar(props: IProps) {
  const { className } = props;

  const initialOpenState = true;

  const [isOpen, setIsOpen] = useState(initialOpenState);
  const location = useLocation();
  // const { shelterId } = useParams<{ shelterId: string }>();

  const shelterId = '5';

  const parentCss = ['bg-[#FAFAFA]', className];

  return (
    <Sidebar
      className={mergeCss(parentCss)}
      onOpenChange={setIsOpen}
      initialOpen={initialOpenState}
      variant="basic"
    >
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

        <>
          <Divider
            className="my-4 h-6"
            label={isOpen ? 'shelter management' : ''}
          />

          <Sidebar.Link
            to={shelterManageRoute(shelterId)}
            isActive={isShelterManageRoute(location.pathname)}
            collapsed={!isOpen}
            // icon={(color: string) => (
            //   <CarryOutOutlined className="w-4" style={{ color: color }} />
            // )}
          >
            Operations
          </Sidebar.Link>

          <ShelterProfileLinks
            pathname={location.pathname}
            shelterId={shelterId}
            isOpen={isOpen}
          />
        </>
      </Sidebar.Content>
    </Sidebar>
  );
}
