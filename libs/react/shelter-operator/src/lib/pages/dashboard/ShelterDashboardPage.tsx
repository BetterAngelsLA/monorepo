import { useQuery } from '@apollo/client/react';
import { Settings } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/base-ui/buttons/buttons';
import { Text } from '../../components/base-ui/text/text';
import { BedsView } from '../../components/beds/BedsView';
import { OccupantsView } from '../../components/occupants/OccupantsView';
import { OverviewView } from '../../components/overview/OverviewView';
import { ReservationsView } from '../../components/reservations/ReservationsView';
import { RoomsView } from '../../components/rooms/RoomsView';
import { GetShelterSummaryDocument } from '../../graphql/__generated__/shelters.generated';
import { shelterManageRoute } from '../../routing';
import SliderTabs, { type SliderTabItem } from './components/SliderTabs';

type ShelterTab = 'overview' | 'rooms' | 'beds' | 'reservations' | 'occupancy';

const TAB_CONFIG: Record<ShelterTab, SliderTabItem> = {
  overview: { label: 'Overview', pathSuffix: '' },
  rooms: { label: 'Rooms', pathSuffix: 'rooms' },
  beds: { label: 'Beds', pathSuffix: 'beds' },
  reservations: { label: 'Reservations', pathSuffix: 'reservations' },
  occupancy: { label: 'Occupants', pathSuffix: 'occupancy' },
};

const TAB_ITEMS: SliderTabItem[] = [
  TAB_CONFIG.overview,
  TAB_CONFIG.rooms,
  TAB_CONFIG.beds,
  TAB_CONFIG.reservations,
  TAB_CONFIG.occupancy,
];

export default function ShelterDashboardPage({ tab }: { tab: ShelterTab }) {
  const { shelterId } = useParams();
  const id = shelterId ?? '';

  const { data: shelterData } = useQuery(GetShelterSummaryDocument, {
    variables: { id },
    skip: !id,
  });

  if (!id) return null;

  const shelterName = shelterData?.operatorShelter?.name ?? 'Shelter Name';
  const shelterAddress =
    shelterData?.operatorShelter?.location?.place ?? undefined;

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-3 px-6">
        <div>
          <Text
            variant="header-md"
            className="leading-none font-medium text-[#111827]"
          >
            {shelterName}
          </Text>
          {shelterAddress && (
            <Text variant="body" className="mt-4 block text-[#6B7280]">
              {shelterAddress}
            </Text>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            leftIcon={<Settings size={20} color="black" />}
            rightIcon={false}
            className="text-black"
          >
            Settings
          </Button>
        </div>
      </div>

      <SliderTabs
        activePathSuffix={TAB_CONFIG[tab].pathSuffix}
        basePath={shelterManageRoute(shelterId ?? '')}
        items={TAB_ITEMS}
      />

      {tab === 'rooms' && <RoomsView shelterId={id} />}
      {tab === 'overview' && <OverviewView shelterId={id} />}
      {tab === 'beds' && <BedsView shelterId={id} />}
      {tab === 'occupancy' && <OccupantsView shelterId={id} />}
      {tab === 'reservations' && <ReservationsView shelterId={id} />}
    </div>
  );
}
