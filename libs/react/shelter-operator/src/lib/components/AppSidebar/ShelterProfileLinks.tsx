import { Sidebar } from '@monorepo/react/components';
import {
  isShelterProfileRoute,
  shelterProfileRoute,
  profileRouteConfig,
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
    >
      <Sidebar.Content>
        <Sidebar.Link
          to={shelterProfileRoute(shelterId, profileRouteConfig.children.basic)}
          isActive={isShelterProfileRoute(pathname, {
            segment: profileRouteConfig.children.basic,
          })}
          collapsed={!isOpen}
          replace
        >
          Basic Info
        </Sidebar.Link>
        <Sidebar.Link
          to={shelterProfileRoute(shelterId, profileRouteConfig.children.details)}
          isActive={isShelterProfileRoute(pathname, {
            segment: profileRouteConfig.children.details,
          })}
          collapsed={!isOpen}
          replace
        >
          Details
        </Sidebar.Link>
        <Sidebar.Link
          to={shelterProfileRoute(
            shelterId,
            profileRouteConfig.children.operatingHours
          )}
          isActive={isShelterProfileRoute(pathname, {
            segment: profileRouteConfig.children.operatingHours,
          })}
          collapsed={!isOpen}
          replace
        >
          Operating Hours
        </Sidebar.Link>
        <Sidebar.Link
          to={shelterProfileRoute(shelterId, profileRouteConfig.children.policies)}
          isActive={isShelterProfileRoute(pathname, {
            segment: profileRouteConfig.children.policies,
          })}
          collapsed={!isOpen}
          replace
        >
          Policies
        </Sidebar.Link>
        <Sidebar.Link
          to={shelterProfileRoute(shelterId, profileRouteConfig.children.services)}
          isActive={isShelterProfileRoute(pathname, {
            segment: profileRouteConfig.children.services,
          })}
          collapsed={!isOpen}
          replace
        >
          Services
        </Sidebar.Link>
        <Sidebar.Link
          to={shelterProfileRoute(shelterId, profileRouteConfig.children.ecosystem)}
          isActive={isShelterProfileRoute(pathname, {
            segment: profileRouteConfig.children.ecosystem,
          })}
          collapsed={!isOpen}
          replace
        >
          Ecosystem
        </Sidebar.Link>
        <Sidebar.Link
          to={shelterProfileRoute(shelterId, profileRouteConfig.children.media)}
          isActive={isShelterProfileRoute(pathname, {
            segment: profileRouteConfig.children.media,
          })}
          collapsed={!isOpen}
          replace
        >
          Media
        </Sidebar.Link>
      </Sidebar.Content>
    </Sidebar.NestedLinks>
  );
}
