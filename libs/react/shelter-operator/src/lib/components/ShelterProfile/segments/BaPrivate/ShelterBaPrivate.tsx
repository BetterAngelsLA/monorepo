import { useMemo, useState } from 'react';
import { useBaPrivatePermissions } from '../../../../hooks';
import { Tabs } from '../../../base-ui/tabs';
import { BA_PRIVATE_TAB_LABELS, BaPrivateTab } from './constants';
import { ShelterContacts } from './Contacts';
import { ShelterReview } from './Review';

type TProps = {
  shelterId: string;
};

export function ShelterBaPrivate(props: TProps) {
  const { shelterId } = props;

  const { additionalContactsPermissions, baReviewPermissions } =
    useBaPrivatePermissions();

  // Each tab is a BA-private section with its own global-tier gate, so a tab
  // only exists when the user can view that section's backend data.
  const visibleTabs = useMemo(() => {
    const tabs: BaPrivateTab[] = [];

    if (additionalContactsPermissions.canView) {
      tabs.push('contacts');
    }

    if (baReviewPermissions.canView) {
      tabs.push('review');
    }

    return tabs;
  }, [additionalContactsPermissions.canView, baReviewPermissions.canView]);

  const [currentTab, setCurrentTab] = useState<BaPrivateTab>('contacts');

  if (!visibleTabs.length) {
    return null;
  }

  const selectedTab = visibleTabs.includes(currentTab)
    ? currentTab
    : visibleTabs[0];

  return (
    <div className="px-6 flex-col flex-1 pb-48">
      <Tabs
        tabs={visibleTabs}
        selectedTab={selectedTab}
        onTabPress={setCurrentTab}
        getLabel={(tab) => BA_PRIVATE_TAB_LABELS[tab]}
      />

      {selectedTab === 'contacts' && <ShelterContacts shelterId={shelterId} />}

      {selectedTab === 'review' && <ShelterReview shelterId={shelterId} />}
    </div>
  );
}
