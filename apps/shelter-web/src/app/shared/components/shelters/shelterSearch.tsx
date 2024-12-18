import { FilterIcon } from '@monorepo/react/icons';
import { useMap } from '@vis.gl/react-google-maps';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { locationAtom } from '../../atoms/locationAtom';
import { modalAtom } from '../../atoms/modalAtom';
import { ModalAnimationEnum } from '../../modal/modal';
import { AddressAutocomplete } from '../address/AddressAutocomplete';
import { toGoogleLatLng } from '../map/utils/toGoogleLatLng';
import { SheltersDisplay } from './sheltersDisplay';

export function ShelterSearch() {
  const [location, setLocation] = useAtom(locationAtom);
  const [_modal, setModal] = useAtom(modalAtom);

  const map = useMap();

  useEffect(() => {
    if (!map) {
      return;
    }

    const center = toGoogleLatLng(location);

    center && map.setCenter(center);
  }, [map, location]);

  function onPlaceSelect(address: google.maps.places.PlaceResult | null) {
    if (!address) {
      return;
    }

    const { geometry } = address;

    const latitude = geometry?.location?.lat();
    const longitude = geometry?.location?.lng();

    if (!latitude || !longitude) {
      return;
    }

    setLocation({
      latitude,
      longitude,
      source: 'address',
    });
  }

  function onFilterClick() {
    setModal({
      content: 'hello there',
      animation: ModalAnimationEnum.EXPAND,
      closeOnMaskClick: true,
    });
  }

  return (
    <>
      <div className="mt-4 flex items-center justify-between">
        <AddressAutocomplete
          className="w-full"
          placeholder="Search address"
          onPlaceSelect={onPlaceSelect}
        />

        <button onClick={onFilterClick}>
          <FilterIcon className="w-6 ml-4 text-primary-20" />
        </button>
      </div>

      <SheltersDisplay
        className="mt-8"
        coordinates={location}
        coordinatesSource={location?.source}
      />
    </>
  );
}
