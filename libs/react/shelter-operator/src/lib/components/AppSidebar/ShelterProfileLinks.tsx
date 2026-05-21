import { FileSearchOutlined } from '@ant-design/icons';
import { Sidebar } from '@monorepo/react/components';
import { isShelterProfileRoute, shelterProfileRoute } from '../../routing';

type IProps = {
  className?: string;
  pathname: string;
  shelterId: string;
  isOpen: boolean;
};

export function ShelterProfileLinks(props: IProps) {
  const { className, pathname, shelterId, isOpen } = props;

  const isProfileActive = isShelterProfileRoute(pathname);

  return (
    <Sidebar.NestedLinks
      className={className}
      label="Shelter Profile"
      isActive={isProfileActive}
      collapsed={!isOpen}
      defaultExpanded={isProfileActive}
      icon={(color: string) => (
        <FileSearchOutlined className="w-4" style={{ color: color }} />
      )}
    >
      <Sidebar.Link
        to={`${shelterProfileRoute(shelterId)}/details`}
        isActive={pathname.endsWith('/details')}
        collapsed={!isOpen}
      >
        Details
      </Sidebar.Link>
      <Sidebar.Link
        to={`${shelterProfileRoute(shelterId)}/services`}
        isActive={pathname.endsWith('/services')}
        collapsed={!isOpen}
      >
        Services
      </Sidebar.Link>
    </Sidebar.NestedLinks>
  );
}
