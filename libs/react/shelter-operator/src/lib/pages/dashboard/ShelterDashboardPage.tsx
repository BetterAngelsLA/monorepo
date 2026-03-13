import { ShelterPage } from '@monorepo/react/shelter';
import { useParams } from 'react-router-dom';
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
  const { id } = useParams();

  if (!id) return null;

  return (
    <div className="w-full bg-[#F8FAFC]">
      <SliderTabs
        activePathSuffix={TAB_CONFIG[tab].pathSuffix}
        basePath={`/operator/shelter/${id}`}
        items={TAB_ITEMS}
      />
      <ShelterPage id={id} />
    </div>
  );
}
