import { FilterIcon } from '@monorepo/react/icons';
import { useMap } from '@vis.gl/react-google-maps';
import { useAtom } from 'jotai';
import { useResetAtom } from 'jotai/utils';
import { useEffect, useState } from 'react';
import { locationAtom } from '../../atoms/locationAtom';
import { modalAtom } from '../../atoms/modalAtom';
import { shelterFiltersAtom } from '../../atoms/shelterFiltersAtom';
import { ModalAnimationEnum } from '../../modal/modal';
import { AddressAutocomplete } from '../address/AddressAutocomplete';
import { toGoogleLatLng } from '../map/utils/toGoogleLatLng';
import { FilterPills } from '../shelterFilter/filterPills';
import { FiltersActions } from '../shelterFilter/filtersActions';
import { ShelterFilters } from '../shelterFilter/shelterFilters';
import { SheltersDisplay, TShelterPropertyFilters } from './sheltersDisplay';

export function ShelterSearch() {
  const [_modal, setModal] = useAtom(modalAtom);
  const [location, setLocation] = useAtom(locationAtom);
  const [queryFilters, setQueryFilters] = useState<TShelterPropertyFilters>();
  const [submitQueryTs, setSubmitQueryTs] = useState<number>();
  const [filters] = useAtom(shelterFiltersAtom);
  const resetFilters = useResetAtom(shelterFiltersAtom);

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

  useEffect(() => {
    if (submitQueryTs === undefined) {
      return;
    }

    setQueryFilters(filters);
  }, [submitQueryTs]);

  function onSubmitFilters() {
    setSubmitQueryTs(Date.now());
    setModal(null);
  }

  function onFilterClick() {
    setModal({
      content: <ShelterFilters className="w-full" />,
      animation: ModalAnimationEnum.SLIDE_UP,
      type: 'fullscreen',
      footer: <FiltersActions className="pb-8" onDone={onSubmitFilters} />,
      onClose: resetFilters,
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

      <FilterPills className="mt-2" filters={filters} />

      <SheltersDisplay
        className="mt-8"
        coordinates={location}
        coordinatesSource={location?.source}
        propertyFilters={queryFilters}
      />
    </>
  );
}
