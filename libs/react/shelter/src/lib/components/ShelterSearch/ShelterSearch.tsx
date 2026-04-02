import { FilterIcon, LocationIcon, SearchIcon } from '@monorepo/react/icons';
import { useAtom } from 'jotai';
import { useResetAtom } from 'jotai/utils';
import { useEffect, useState } from 'react';
import { shelterPropertyFiltersAtom } from '../../atoms';
import { AddressAutocomplete, TPlaceResult } from '../AddressAutocomplete';
import { Input } from '../Input';
import { TLatLng, TMapBounds } from '../Map';
import { ModalAnimationEnum, modalAtom } from '../Modal';
import { FilterPills, FiltersActions, ShelterFilters } from '../ShelterFilters';
import { SheltersDisplay } from './SheltersDisplay';
import { TShelterPropertyFilters } from './types';

type TProps = {
  mapBoundsFilter?: TMapBounds;
  nameSearchPinFitRequestId?: number;
  onShelterPinsReadyForMapFit?: (pinLocations: TLatLng[]) => void;
  onNameSearch: () => void;
  setLocation: (location: TLatLng) => void;
};

export function ShelterSearch(props: TProps) {
  const {
    mapBoundsFilter,
    nameSearchPinFitRequestId = 0,
    onShelterPinsReadyForMapFit,
    onNameSearch,
    setLocation,
  } = props;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_modal, setModal] = useAtom(modalAtom);
  const [queryFilters, setQueryFilters] = useState<TShelterPropertyFilters>();
  const [submitQueryTs, setSubmitQueryTs] = useState<number>();
  const [filters] = useAtom(shelterPropertyFiltersAtom);
  const [nameFilter, setNameFilter] = useState<string>();
  const resetFilters = useResetAtom(shelterPropertyFiltersAtom);
  const [nameSearchValue, setNameSearchValue] = useState('');

  function onPlaceSelect(place: TPlaceResult | null) {
    if (!place) {
      return;
    }

    const latitude = place.location?.lat;
    const longitude = place.location?.lng;

    if (!latitude || !longitude) {
      return;
    }

    onNameSearchChange('');

    setLocation({
      latitude,
      longitude,
    });
  }

  useEffect(() => {
    if (submitQueryTs === undefined) {
      return;
    }

    setQueryFilters(filters);
  }, [submitQueryTs, filters]);

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

  function onNameSearchChange(value: string) {
    setNameSearchValue(value);
    if (!value.trim()) {
      setNameFilter(undefined);
    }
  }

  function onSearchClick() {
    // Name search ignores any previously-selected property filters.
    setQueryFilters(undefined);
    resetFilters();
    setNameFilter(nameSearchValue.trim());
    console.log('nameFilter', nameFilter);
    console.log('nameSearchValue', nameSearchValue);
    onNameSearch();
  }

  return (
    <>
      <div className="mt-4 flex flex-col items-center justify-between">
        <div className="flex items-center justify-between w-full">
          <AddressAutocomplete
            className="w-full"
            placeholder="Search by location"
            onPlaceSelect={onPlaceSelect}
            leftIcon={<LocationIcon className="text-neutral-70 w-4 h-4" />}
          />
          <button onClick={onFilterClick} className="self-start ml-4 mt-4">
            <FilterIcon className="w-6 text-primary-20" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between w-full">
          <Input
            value={nameSearchValue}
            placeholder="Search by name"
            className="w-full"
            onChange={onNameSearchChange}
            leftIcon={<SearchIcon className="text-neutral-70 w-4 h-4" />}
          />

          <button onClick={onSearchClick} className="self-start ml-4 mt-4">
            <SearchIcon className="w-6 text-primary-20" />
          </button>
        </div>
      </div>

      <FilterPills className="mt-2" filters={filters} />
      <SheltersDisplay
        className="mt-8"
        mapBoundsFilter={mapBoundsFilter}
        propertyFilters={queryFilters}
        nameFilter={nameFilter}
        nameSearchPinFitRequestId={nameSearchPinFitRequestId}
        onShelterPinsReadyForMapFit={onShelterPinsReadyForMapFit}
      />
    </>
  );
}
