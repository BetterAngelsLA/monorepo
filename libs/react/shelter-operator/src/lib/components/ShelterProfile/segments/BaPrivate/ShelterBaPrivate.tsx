import { useState } from 'react';
import { Tabs } from '../../../base-ui/tabs';
import { Form } from '../../../form/Form';
import {
  BA_PRIVATE_TAB_LABELS,
  BA_PRIVATE_TABS,
  BaPrivateTab,
} from './constants';
import { ShelterContactsTab } from './Contacts/ShelterContactsTab';
import { ShelterReviewTab } from './Review/ShelterReviewTab';

type TProps = {
  shelterId: string;
};

export function ShelterBaPrivate(props: TProps) {
  const { shelterId } = props;

  const [currentTab, setCurrentTab] = useState<BaPrivateTab>('contacts');

  return (
    <div className="px-6 flex-col flex-1 pb-48">
      <Form.Header title="BA Private fields" className="pl-5" />

      <Tabs
        tabs={BA_PRIVATE_TABS}
        selectedTab={currentTab}
        onTabPress={setCurrentTab}
        getLabel={(tab) => BA_PRIVATE_TAB_LABELS[tab]}
      />

      {currentTab === 'contacts' && (
        <ShelterContactsTab shelterId={shelterId} />
      )}

      {currentTab === 'review' && <ShelterReviewTab />}
    </div>
  );
}
