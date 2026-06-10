import { FileSearchOutlined } from '@ant-design/icons';
import { Sidebar } from '@monorepo/react/components';
import {
  isShelterProfileRoute,
  shelterProfileRoute,
  shelterProfileSegments,
} from '../../routing';

type IProps = {
  className?: string;
  pathname: string;
  shelterId: string;
  isOpen: boolean;
};

export function ShelterProfileLinks(props: IProps) {
  const { className, pathname, shelterId, isOpen } = props;

  return (
    <Sidebar.NestedLinks
      className={className}
      label="Shelter Profile"
      isActive={false} // style only child links as active/inactive
      collapsed={!isOpen}
      defaultExpanded={true}
      icon={(color: string) => (
        <FileSearchOutlined className="w-4" style={{ color: color }} />
      )}
    >
      <Sidebar.Content>
        <Sidebar.Link
          to={shelterProfileRoute(shelterId, shelterProfileSegments.basic)}
          isActive={isShelterProfileRoute(pathname, {
            segment: shelterProfileSegments.basic,
          })}
          collapsed={!isOpen}
          replace
        >
          Basic Info
        </Sidebar.Link>
        <Sidebar.Link
          to={shelterProfileRoute(shelterId, shelterProfileSegments.details)}
          isActive={isShelterProfileRoute(pathname, {
            segment: shelterProfileSegments.details,
          })}
          collapsed={!isOpen}
          replace
        >
          Details
        </Sidebar.Link>
        <Sidebar.Link
          to={shelterProfileRoute(
            shelterId,
            shelterProfileSegments.operatingHours
          )}
          isActive={isShelterProfileRoute(pathname, {
            segment: shelterProfileSegments.operatingHours,
          })}
          collapsed={!isOpen}
          replace
        >
          Operating Hours
        </Sidebar.Link>
        <Sidebar.Link
          to={shelterProfileRoute(shelterId, shelterProfileSegments.policies)}
          isActive={isShelterProfileRoute(pathname, {
            segment: shelterProfileSegments.policies,
          })}
          collapsed={!isOpen}
          replace
        >
          Policies
        </Sidebar.Link>
        <Sidebar.Link
          to={shelterProfileRoute(shelterId, shelterProfileSegments.services)}
          isActive={isShelterProfileRoute(pathname, {
            segment: shelterProfileSegments.services,
          })}
          collapsed={!isOpen}
          replace
        >
          Services
        </Sidebar.Link>
        <Sidebar.Link
          to={shelterProfileRoute(shelterId, shelterProfileSegments.ecosystem)}
          isActive={isShelterProfileRoute(pathname, {
            segment: shelterProfileSegments.ecosystem,
          })}
          collapsed={!isOpen}
          replace
        >
          Ecosystem
        </Sidebar.Link>
      </Sidebar.Content>
    </Sidebar.NestedLinks>
  );
}
