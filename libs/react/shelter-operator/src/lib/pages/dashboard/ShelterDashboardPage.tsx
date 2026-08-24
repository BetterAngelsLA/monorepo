import { useQuery } from '@apollo/client/react';
import { Settings } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/base-ui/buttons/buttons';
import { Text } from '../../components/base-ui/text/text';
import { ReportsView } from '../../components/reports/ReportsView';
import { OperatorShelterSummaryDocument } from '../../graphql/__generated__/shelters.generated';
import { shelterMgmtRoute } from '../../routing';
import SliderTabs, { type SliderTabItem } from './components/SliderTabs';

type ShelterTab = 'reports';

const TAB_CONFIG: Record<ShelterTab, SliderTabItem> = {
  reports: { label: 'Reports', pathSuffix: '' },
};

const TAB_ITEMS: SliderTabItem[] = [TAB_CONFIG.reports];

export default function ShelterDashboardPage({ tab }: { tab: ShelterTab }) {
  const { shelterId } = useParams();
  const id = shelterId ?? '';

  const { data: shelterData } = useQuery(OperatorShelterSummaryDocument, {
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
        basePath={shelterMgmtRoute(shelterId ?? '')}
        items={TAB_ITEMS}
      />

      {tab === 'reports' && <ReportsView shelterId={id} />}
    </div>
  );
}
