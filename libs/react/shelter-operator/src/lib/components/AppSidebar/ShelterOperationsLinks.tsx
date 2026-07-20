import { Sidebar } from '@monorepo/react/components';
import {
  isShelterOperationsRoute,
  shelterOperationsRoute,
  shelterOperationsSegments,
} from '../../routing';

type IProps = {
  className?: string;
  pathname: string;
  shelterId: string;
  isOpen: boolean;
};

export function ShelterOperationsLinks(props: IProps) {
  const { className, pathname, shelterId, isOpen } = props;

  return (
    <Sidebar.NestedLinks
      className={className}
      label="Shelter Operations"
      isActive={false} // style only child links as active/inactive
      collapsed={!isOpen}
      defaultExpanded={true}
    >
      <Sidebar.Content>
        <Sidebar.Link
          to={shelterOperationsRoute(shelterId, shelterOperationsSegments.beds)}
          isActive={isShelterOperationsRoute(pathname, {
            segment: shelterOperationsSegments.beds,
          })}
          collapsed={!isOpen}
          replace
        >
          Beds
        </Sidebar.Link>
      </Sidebar.Content>
    </Sidebar.NestedLinks>
  );
}
