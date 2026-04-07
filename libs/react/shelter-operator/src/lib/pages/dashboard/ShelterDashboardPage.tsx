import { useQuery } from '@apollo/client/react';
import { BookCheck, Settings } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/base-ui/buttons/buttons';
import { Text } from '../../components/base-ui/text/text';
import { GetShelterNameDocument } from '../../graphql/__generated__/shelters.generated';
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
  const { id } = useParams();
  const shelterId = id ?? '';

  const { data: shelterData } = useQuery(GetShelterNameDocument, {
    variables: { id: shelterId },
    skip: !shelterId,
  });

  if (!id) return null;

  const shelterName = shelterData?.shelter?.name ?? 'Shelter Name';
  const shelterAddress = '123 Thisisastreetname Street';

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-3 px-6">
        <div>
          {/* Hard Coded For Now */}
          <Text
            variant="header-md"
            className="leading-none font-medium text-[#111827]"
          >
            {shelterName}
          </Text>
          <Text variant="body" className="mt-4 block text-[#6B7280]">
            {shelterAddress}
          </Text>
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

          <Button
            variant="primary"
            color="blue"
            leftIcon={<BookCheck size={20} color="white" />}
            rightIcon={false}
            className="text-white"
          >
            Reserve
          </Button>
        </div>
      </div>

      <SliderTabs
        activePathSuffix={TAB_CONFIG[tab].pathSuffix}
        basePath={`/operator/shelter/${shelterId}`}
        items={TAB_ITEMS}
      />

      <ShelterTabContent tab={tab} />
    </div>
  );
}
