import { useState } from 'react';
import { Tabs } from '../../../base-ui/tabs';
import { Form } from '../../../form/Form';
import { MEDIA_TABS, MEDIA_TAB_LABELS, MediaTab } from './constants';
import { ShelterMediaLinksForm } from './MediaLinks/ShelterMediaLinksForm';
import { ShelterPhotosForm } from './Photos/ShelterPhotosForm';
import { ShelterVideosForm } from './Videos/ShelterVideosForm';

type TProps = {
  shelterId: string;
};

export function ShelterMedia(props: TProps) {
  const { shelterId: _shelterId } = props;

  const [currentTab, setCurrentTab] = useState<MediaTab>('photos');

  return (
    <div className="px-6 flex-col flex-1 pb-72">
      <Form.Header title="Shelter Media" className="pl-5" />

      <Tabs
        tabs={MEDIA_TABS}
        selectedTab={currentTab}
        onTabPress={setCurrentTab}
        getLabel={(tab) => MEDIA_TAB_LABELS[tab]}
      />

      {currentTab === 'photos' && (
        <ShelterPhotosForm onSave={() => undefined} />
      )}
      {currentTab === 'videos' && (
        <ShelterVideosForm onSave={() => undefined} />
      )}
      {currentTab === 'media-links' && (
        <ShelterMediaLinksForm onSave={() => undefined} />
      )}
    </div>
  );
}
