import { BookCheck, Settings } from 'lucide-react';
import { useLocation, useParams } from 'react-router-dom';
import { Button } from '../../components/base-ui/buttons/buttons';
import type { Shelter } from '../../types/shelter';
import { ShelterTabContent } from './components/ShelterTabContent';
import SliderTabs, { type SliderTabItem } from './components/SliderTabs';

type ShelterTab = 'overview' | 'rooms' | 'beds' | 'occupancy' | 'label';

const TAB_CONFIG: Record<ShelterTab, SliderTabItem> = {
  overview: { label: 'Overview', pathSuffix: '' },
  rooms: { label: 'Rooms', pathSuffix: 'rooms' },
  beds: { label: 'Beds', pathSuffix: 'beds' },
  occupancy: { label: 'Occupancy', pathSuffix: 'occupancy' },
  label: { label: 'Label', pathSuffix: 'label' },
};

const TAB_ITEMS: SliderTabItem[] = [
  TAB_CONFIG.overview,
  TAB_CONFIG.rooms,
  TAB_CONFIG.beds,
  TAB_CONFIG.occupancy,
  TAB_CONFIG.label,
];

export default function ShelterDashboardPage({ tab }: { tab: ShelterTab }) {
  const location = useLocation();
  const { id } = useParams();
  const shelterId = id ?? '';
  const routeState = (location.state as { shelter?: Shelter } | null) ?? null;

  if (!id) return null;

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-3 px-6 py-4">
        <div>
          {/* Hard Coded For Now*/}
          <h1 className="text-[36px] font-semibold leading-none text-[#111827]">
            {routeState !== null ? routeState?.shelter.name : 'Shelter Name'}
          </h1>
          <p className="mt-4 text-[20px] text-[#6B7280]">
            {routeState !== null
              ? routeState?.shelter.address
              : '123 Thisisastreetname Street'}
          </p>
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
          {/* CHANGE TO FLOATING COLORS */}
          <Button
            variant="primary"
            leftIcon={<BookCheck size={20} color="black" />}
            rightIcon={false}
            className="text-black"
          >
            Reserve
          </Button>
        </div>
      </div>

      <SliderTabs
        activePathSuffix={TAB_CONFIG[tab].pathSuffix}
        basePath={`/operator/shelter/${shelterId}`}
        items={TAB_ITEMS}
        linkState={routeState ?? undefined}
      />

      <ShelterTabContent tab={tab} shelter={routeState?.shelter} />
    </div>
  );
}
