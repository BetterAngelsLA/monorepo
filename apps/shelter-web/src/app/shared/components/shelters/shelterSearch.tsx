import { FilterIcon } from '@monorepo/react/icons';
import { useAtom } from 'jotai';
import { useResetAtom } from 'jotai/utils';
import { useEffect, useState } from 'react';
import { locationAtom } from '../../atoms/locationAtom';
import { modalAtom } from '../../atoms/modalAtom';
import { shelterFiltersAtom } from '../../atoms/shelterFiltersAtom';
import { ModalAnimationEnum } from '../../modal/modal';
import {
  AddressAutocomplete,
  TPlaceResult,
} from '../address/AddressAutocomplete';
import { TMapBounds } from '@monorepo/react/components';
import { FilterPills } from '../shelterFilter/filterPills';
import { FiltersActions } from '../shelterFilter/filtersActions';
import { ShelterFilters } from '../shelterFilter/shelterFilters';
import { SheltersDisplay, TShelterPropertyFilters } from './sheltersDisplay';

type TProps = {
  mapBoundsFilter?: TMapBounds;
};

export function ShelterSearch(props: TProps) {
  const { mapBoundsFilter } = props;
  const [location, setLocation] = useAtom(locationAtom);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_modal, setModal] = useAtom(modalAtom);
  const [queryFilters, setQueryFilters] = useState<TShelterPropertyFilters>();
  const [submitQueryTs, setSubmitQueryTs] = useState<number>();
  const [filters] = useAtom(shelterFiltersAtom);
  const resetFilters = useResetAtom(shelterFiltersAtom);

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
  }, [filters, submitQueryTs]);

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
        propertyFilters={queryFilters}
      />
    </>
  );
}
