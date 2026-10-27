import { useState } from 'react';
import { useShelterOperatorProfile } from '../../../../hooks';
import { Tabs } from '../../../base-ui/tabs';
import { Form } from '../../../form/Form';
import { MEDIA_TABS, MEDIA_TAB_LABELS, MediaTab } from './constants';
import { ShelterMediaLinks } from './MediaLinks/ShelterMediaLinks';
import { ShelterPhotos } from './Photos/ShelterPhotos';

type TProps = {
  shelterId: string;
};

export function ShelterMedia(props: TProps) {
  const { shelterId } = props;

  const [currentTab, setCurrentTab] = useState<MediaTab>('photos');

  const { shelter } = useShelterOperatorProfile(shelterId);

  if (!shelter) {
    return null;
  }

  const { photos, heroImage, mediaLinks } = shelter;

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
        <ShelterPhotos
          shelterId={shelterId}
          photos={photos || []}
          heroImageId={heroImage?.id}
        />
      )}

      {currentTab === 'media-links' && (
        <ShelterMediaLinks
          shelterId={shelterId}
          mediaLinks={mediaLinks || []}
        />
      )}
    </div>
  );
}
