import { useState } from 'react';
import { useAdminShelterProfile } from '../../../../hooks';
import { Tabs } from '../../../base-ui/tabs';
import { Form } from '../../../form/Form';
import { MEDIA_TABS, MEDIA_TAB_LABELS, MediaTab } from './constants';
import { ShelterPhotos } from './Photos/ShelterPhotos';

type TProps = {
  shelterId: string;
};

export function ShelterMedia(props: TProps) {
  const { shelterId } = props;

  const [currentTab, setCurrentTab] = useState<MediaTab>('photos');

  const { shelter } = useAdminShelterProfile(shelterId);

  if (!shelter) {
    return null;
  }

  const { photos } = shelter;

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
        <ShelterPhotos shelterId={shelterId} photos={photos || []} />
      )}
      {/* {currentTab === 'videos' && (
        <ShelterVideosForm onSave={() => undefined} />
      )}
      {currentTab === 'media-links' && (
        <ShelterMediaLinksForm onSave={() => undefined} />
      )} */}
    </div>
  );
}
