import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { SHELTERS_MAP_ID } from '../../constants.app';
import { MaxWLayout } from '../../layout/maxWLayout';
import { locationAtom } from '../../shared/atoms/locationAtom';
import { modalAtom } from '../../shared/atoms/modalAtom';
import { sheltersAtom } from '../../shared/atoms/sheltersAtom';
import { Map } from '../../shared/components/map/map';
import { TLatLng, TMarker } from '../../shared/components/map/types.maps';
import {
  ShelterCard,
  TShelter,
} from '../../shared/components/shelter/shelterCard';
import { ShelterSearch } from '../../shared/components/shelters/shelterSearch';
import { ModalAnimationEnum } from '../../shared/modal/modal';

export function Home() {
  const [_location, setLocation] = useAtom(locationAtom);
  const [_modal, setModal] = useAtom(modalAtom);
  const [shelterMarkers, setShelterMarkers] = useState<TMarker[]>([]);
  const [shelters] = useAtom(sheltersAtom);

  const handleClick = (markerId: string | null) => {
    if (!markerId) {
      return;
    }
    setModal({
      content: (
        <ShelterCard
          className="mt-4"
          shelter={
            shelters.find((shelter) => shelter.id === markerId) as TShelter
          }
        />
      ),
      animation: ModalAnimationEnum.EXPAND,
      closeOnMaskClick: false,
    });
  };

  useEffect(() => {
    const markers = shelters
      .filter((shelter) => !!shelter.location)
      .map((shelter) => {
        return {
          id: shelter.id,
          position: shelter.location,
          label: shelter.name,
        } as TMarker;
      });

    setShelterMarkers(markers);
  }, [shelters]);

  function onCenterSelect(center: TLatLng) {
    setLocation({
      ...center,
      source: 'currentLocation',
    });
  }

  return (
    <>
      <MaxWLayout className="-mx-4">
        <Map
          className="h-[70vh] md:h-80"
          mapId={SHELTERS_MAP_ID}
          markers={shelterMarkers}
          onCenterSelect={onCenterSelect}
          onClick={handleClick}
        />
      </MaxWLayout>
      <ShelterSearch />
    </>
  );
}
