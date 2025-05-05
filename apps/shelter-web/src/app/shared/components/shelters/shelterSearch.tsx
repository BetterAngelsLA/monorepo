import { FilterIcon } from '@monorepo/react/icons';
import { useAtom } from 'jotai';
import { useResetAtom } from 'jotai/utils';
import { useEffect, useState } from 'react';
import { modalAtom } from '../../atoms/modalAtom';
import { shelterFiltersAtom } from '../../atoms/shelterFiltersAtom';
import { ModalAnimationEnum } from '../../modal/modal';
import { AddressAutocomplete } from '../address/AddressAutocomplete';
import { LatLngLiteral, TMapBounds } from '../map/types.maps';
import { FilterPills } from '../shelterFilter/filterPills';
import { FiltersActions } from '../shelterFilter/filtersActions';
import { ShelterFilters } from '../shelterFilter/shelterFilters';
import { SheltersDisplay, TShelterPropertyFilters } from './sheltersDisplay';

type TProps = {
  mapBoundsFilter?: TMapBounds;
  onLocationSelect?: (coordinates: LatLngLiteral) => void;
};

export function ShelterSearch(props: TProps) {
  const { mapBoundsFilter, onLocationSelect } = props;

  const [_modal, setFilterModal] = useAtom(modalAtom);
  // const [location, setLocation] = useAtom(locationAtom);
  const [queryFilters, setQueryFilters] = useState<TShelterPropertyFilters>();
  const [submitQueryTs, setSubmitQueryTs] = useState<number>();
  const [filters] = useAtom(shelterFiltersAtom);
  const resetFilters = useResetAtom(shelterFiltersAtom);

  function onPlaceSelect(address: google.maps.places.PlaceResult | null) {
    const location = address?.geometry?.location;

    if (!location) {
      return;
    }

    onLocationSelect?.({
      lat: location.lat(),
      lng: location.lng(),
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
    setFilterModal(null);
  }

  function onFilterClick() {
    setFilterModal({
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
        // coordinates={location}
        mapBoundsFilter={mapBoundsFilter}
        // coordinatesSource={location?.source}
        propertyFilters={queryFilters}
      />
    </>
  );
}
