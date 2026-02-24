import { FilterIcon } from '@monorepo/react/icons';
import { useMap } from '@vis.gl/react-google-maps';
import { useAtom } from 'jotai';
import { useResetAtom } from 'jotai/utils';
import { useEffect, useState } from 'react';
import { locationAtom, shelterFiltersAtom } from '../../atoms';
import { AddressAutocomplete, TPlaceResult } from '../AddressAutocomplete';
import { TMapBounds, toGoogleLatLng } from '../Map';
import { ModalAnimationEnum, modalAtom } from '../Modal';
import { FilterPills, FiltersActions, ShelterFilters } from '../ShelterFilters';
import { SheltersDisplay } from './SheltersDisplay';
import { TShelterPropertyFilters } from './types';

type TProps = {
  mapBoundsFilter?: TMapBounds;
};

export function ShelterSearch(props: TProps) {
  const { mapBoundsFilter } = props;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  function onPlaceSelect(place: TPlaceResult | null) {
    if (!place) {
      return;
    }

    const latitude = place.location?.lat;
    const longitude = place.location?.lng;

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

        <button onClick={onFilterClick} className="self-start ml-4 mt-4">
          <FilterIcon className="w-6 text-primary-20" />
        </button>
      </div>

      <FilterPills className="mt-2" filters={filters} />
      <SheltersDisplay
        className="mt-8"
        coordinates={location}
        mapBoundsFilter={mapBoundsFilter}
        coordinatesSource={location?.source}
        propertyFilters={queryFilters}
      />
    </>
  );
}
