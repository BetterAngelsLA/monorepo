import { Sidebar } from '@monorepo/react/components';
import {
  isShelterMgmtRoute,
  mgmtRouteConfig,
  shelterMgmtRoute,
} from '../../routing';

type IProps = {
  className?: string;
  pathname: string;
  shelterId: string;
  isOpen: boolean;
};

export function ShelterMgmtLinks(props: IProps) {
  const { className, pathname, shelterId, isOpen } = props;

  return (
    <Sidebar.NestedLinks
      className={className}
      label="Shelter Management"
      isActive={false} // style only child links as active/inactive
      collapsed={!isOpen}
      defaultExpanded={true}
    >
      <Sidebar.Content>
        <Sidebar.Link
          to={shelterMgmtRoute(shelterId, mgmtRouteConfig.children.beds)}
          isActive={isShelterMgmtRoute(pathname, {
            segment: mgmtRouteConfig.children.beds,
          })}
          collapsed={!isOpen}
          replace
        >
          Beds
        </Sidebar.Link>
        <Sidebar.Link
          to={shelterMgmtRoute(shelterId, mgmtRouteConfig.children.rooms)}
          isActive={isShelterMgmtRoute(pathname, {
            segment: mgmtRouteConfig.children.rooms,
          })}
          collapsed={!isOpen}
          replace
        >
          Rooms
        </Sidebar.Link>
        <Sidebar.Link
          to={shelterMgmtRoute(
            shelterId,
            mgmtRouteConfig.children.reservations,
          )}
          isActive={isShelterMgmtRoute(pathname, {
            segment: mgmtRouteConfig.children.reservations,
          })}
          collapsed={!isOpen}
          replace
        >
          Reservations
        </Sidebar.Link>
        <Sidebar.Link
          to={shelterMgmtRoute(shelterId, mgmtRouteConfig.children.occupants)}
          isActive={isShelterMgmtRoute(pathname, {
            segment: mgmtRouteConfig.children.occupants,
          })}
          collapsed={!isOpen}
          replace
        >
          Occupants
        </Sidebar.Link>
        <Sidebar.Link
          to={shelterMgmtRoute(shelterId, mgmtRouteConfig.children.reports)}
          isActive={isShelterMgmtRoute(pathname, {
            segment: mgmtRouteConfig.children.reports,
          })}
          collapsed={!isOpen}
          replace
        >
          Reports
        </Sidebar.Link>
      </Sidebar.Content>
    </Sidebar.NestedLinks>
  );
}
