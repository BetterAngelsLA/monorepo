import { FilterIcon, LocationIcon, SearchIcon } from '@monorepo/react/icons';
import { useAtom } from 'jotai';
import { useResetAtom } from 'jotai/utils';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { shelterPropertyFiltersAtom } from '../../atoms';
import { shelterFiltersPath } from '../../constants';
import { AddressAutocomplete, TPlaceResult } from '../AddressAutocomplete';
import { Input } from '../Input';
import { TLatLng, TMapBounds } from '../Map';
import { FilterPills } from '../ShelterFilters';
import { SheltersDisplay } from './SheltersDisplay';

type TProps = {
  locationSearchInputKey?: number;
  mapBoundsFilter?: TMapBounds;
  nameSearchPinFitRequestId?: number;
  onShelterPinsReadyForMapFit?: (pinLocations: TLatLng[]) => void;
  onNameSearch: () => void;
  setLocation: (location: TLatLng) => void;
};

export function ShelterSearch(props: TProps) {
  const {
    locationSearchInputKey = 0,
    mapBoundsFilter,
    nameSearchPinFitRequestId = 0,
    onShelterPinsReadyForMapFit,
    onNameSearch,
    setLocation,
  } = props;
  const navigate = useNavigate();
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

  function onFilterClick() {
    navigate(shelterFiltersPath);
  }

  function onNameSearchChange(value: string) {
    setNameSearchValue(value);
    if (!value.trim()) {
      setNameFilter(undefined);
    }
  }

  function onSearchClick() {
    // Name search ignores any previously-selected property filters.
    resetFilters();
    setNameFilter(nameSearchValue.trim());
    onNameSearch();
  }

  return (
    <>
      <div className="mt-4 flex flex-col items-center justify-between">
        <div className="flex items-center justify-between w-full">
          <AddressAutocomplete
            key={locationSearchInputKey}
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSearchClick();
              }
            }}
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
        propertyFilters={filters}
        nameFilter={nameFilter}
        nameSearchPinFitRequestId={nameSearchPinFitRequestId}
        onShelterPinsReadyForMapFit={onShelterPinsReadyForMapFit}
      />
    </>
  );
}
