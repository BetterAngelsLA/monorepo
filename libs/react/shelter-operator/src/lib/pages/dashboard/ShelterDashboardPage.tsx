import { useQuery } from '@apollo/client/react';
import { BookCheck, Settings, Share } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/base-ui/buttons/buttons';
import { Text } from '../../components/base-ui/text/text';
import { BedsView } from '../../components/beds/BedsView';
import { OverviewView } from '../../components/overview/OverviewView';
import { RoomsView } from '../../components/rooms/RoomsView';
import { GetShelterNameDocument } from '../../graphql/__generated__/shelters.generated';
import { shelterManageRoute } from '../../routing';
import { ExportShelterModal } from './components/ExportShelterModal';
import { ExportStatusNotification } from './components/ExportStatusNotification';
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
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  // TEMP: visual check for both notification states. Remove once the real
  // export flow drives this.
  const [showExportNotifications, setShowExportNotifications] = useState(false);
  const { shelterId } = useParams();
  const id = shelterId ?? '';

  const { data: shelterData } = useQuery(GetShelterNameDocument, {
    variables: { id },
    skip: !id,
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
            leftIcon={<Share size={20} color="black" />}
            rightIcon={false}
            className="text-black"
            onClick={() => setIsExportModalOpen(true)}
          >
            Export Data
          </Button>
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
        basePath={shelterManageRoute(shelterId ?? '')}
        items={TAB_ITEMS}
      />

      {tab === 'rooms' && <RoomsView shelterId={id} />}
      {tab === 'overview' && <OverviewView shelterId={id} />}
      {tab === 'beds' && <BedsView shelterId={id} />}
      {tab === 'occupancy' && null}
      {tab === 'label' && null}

      <ExportShelterModal
        isOpen={isExportModalOpen}
        shelterId={shelterId}
        onClose={() => setIsExportModalOpen(false)}
        onExport={() => {
          setIsExportModalOpen(false);
          setShowExportNotifications(true);
        }}
      />

      {/* TEMP: both states rendered together for visual review. */}
      {showExportNotifications && (
        <div className="fixed right-6 top-6 z-50 flex flex-col gap-4">
          <ExportStatusNotification
            success
            description="reportname.pdf"
            onClose={() => setShowExportNotifications(false)}
          />
          <ExportStatusNotification
            success={false}
            description="[Error reason]"
            className="[animation-delay:90ms]"
            onClose={() => setShowExportNotifications(false)}
          />
        </div>
      )}
    </div>
  );
}
