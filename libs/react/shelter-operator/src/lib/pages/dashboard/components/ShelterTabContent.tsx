import { useOutletContext } from 'react-router-dom';
import type { Shelter } from '../../../types/shelter';
import type { OperatorDashboardLayoutContext } from '../OperatorDashboardLayout';

// the operator context is so we can query shelter information by shelterID + orgID later on

type ShelterTab = 'overview' | 'rooms' | 'beds' | 'occupancy' | 'label';

type TabContentProps = {
  shelter?: Shelter;
  selectedOrganizationId: string;
};

export function OverviewTabContent() {
  return;
}

export function RoomsTabContent() {
  return <p>Rooms</p>;
}

export function BedsTabContent() {
  return;
}

export function OccupancyTabContent() {
  return;
}

export function LabelTabContent() {
  return;
}

export function ShelterTabContent({
  tab,
  shelter,
}: {
  tab: ShelterTab;
  shelter?: Shelter;
}) {
  const { selectedOrganizationId } =
    useOutletContext<OperatorDashboardLayoutContext>();

  switch (tab) {
    case 'overview':
      return <OverviewTabContent />;
    case 'rooms':
      return <RoomsTabContent />;
    case 'beds':
      return <BedsTabContent />;
    case 'occupancy':
      return <OccupancyTabContent />;
    case 'label':
      return <LabelTabContent />;
    default:
      return null;
  }
}
