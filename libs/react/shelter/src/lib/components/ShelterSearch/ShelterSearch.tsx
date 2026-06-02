import { FilterIcon, SearchIcon } from '@monorepo/react/icons';
import { useAtom, useSetAtom } from 'jotai';
import { useResetAtom } from 'jotai/utils';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  shelterNameSearchValueAtom,
  shelterPropertyFiltersAtom,
  shelterSearchSubmissionAtom,
} from '../../atoms';
import { shelterFiltersPath, shelterSearchPath } from '../../constants';
import { TLatLng, TMapBounds } from '../Map';
import { FilterPills } from '../ShelterFilters';
import { SheltersDisplay } from './SheltersDisplay';

type TProps = {
  mapBoundsFilter?: TMapBounds;
  nameSearchPinFitRequestId?: number;
  onShelterPinsReadyForMapFit?: (pinLocations: TLatLng[]) => void;
  onNameSearch: (options?: { preserveMapBounds?: boolean }) => void;
  setLocation: (location: TLatLng, mapBounds?: TMapBounds) => void;
};

export function ShelterSearch(props: TProps) {
  const {
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
  const setNameSearchValue = useSetAtom(shelterNameSearchValueAtom);
  const [searchSubmission, setSearchSubmission] = useAtom(
    shelterSearchSubmissionAtom
  );

  // React to submissions from SearchPage
  useEffect(() => {
    if (!searchSubmission) return;

    const { nameValue, pendingLocation } = searchSubmission;
    setSearchSubmission(null);

    if (pendingLocation?.location) {
      setLocation(pendingLocation.location, pendingLocation.mapBounds);
    }

    const trimmed = nameValue.trim();
    if (trimmed) {
      resetFilters();
      setNameFilter(trimmed);
      setNameSearchValue(trimmed);
      onNameSearch({ preserveMapBounds: !!pendingLocation?.location });
    } else if (pendingLocation?.location) {
      // Location only — let the map's location effect handle the search
      setNameFilter(undefined);
      setNameSearchValue('');
    }
  }, [
    searchSubmission,
    setSearchSubmission,
    setLocation,
    resetFilters,
    setNameSearchValue,
    onNameSearch,
  ]);

  function onFilterClick() {
    navigate(shelterFiltersPath);
  }

  function onSearchClick() {
    navigate(shelterSearchPath);
  }

  return (
    <>
      <div className="mt-4 flex flex-col items-center justify-between">
        <div className="flex items-center justify-between w-full">
          <button
            onClick={onSearchClick}
            className="flex text-neutral-70 text-sm items-center border rounded-lg border-neutral-90 p-4 w-full cursor-pointer"
          >
            <SearchIcon className="text-neutral-70 w-4 h-4 mr-4" />
            Search
          </button>
          <button onClick={onFilterClick} className="ml-4">
            <FilterIcon className="w-6 text-primary-20" />
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
