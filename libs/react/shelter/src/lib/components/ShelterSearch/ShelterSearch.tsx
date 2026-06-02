import { FilterIcon, SearchIcon } from '@monorepo/react/icons';
import { useAtom, useSetAtom } from 'jotai';
import { useResetAtom } from 'jotai/utils';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  shelterLocationSearchInputAtom,
  shelterNameSearchAtom,
  shelterNameSearchInputAtom,
  shelterPropertyFiltersAtom,
  shelterSearchRequestAtom,
} from '../../atoms';
import { shelterFiltersPath, shelterSearchPath } from '../../constants';
import { TLatLng, TMapBounds } from '../Map';
import { FilterPills } from '../ShelterFilters';
import { SheltersDisplay } from './SheltersDisplay';

type TProps = {
  mapBoundsFilter?: TMapBounds;
  nameSearchPinFitRequestId?: number;
  onShelterPinsReadyForMapFit?: (pinLocations: TLatLng[]) => void;
  onNameSearch: (options?: {
    preserveMapBounds?: boolean;
    restoreMapBounds?: boolean;
  }) => void;
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
  const setNameSearch = useSetAtom(shelterNameSearchAtom);
  const resetFilters = useResetAtom(shelterPropertyFiltersAtom);
  const setNameSearchInput = useSetAtom(shelterNameSearchInputAtom);
  const setLocationSearchInput = useSetAtom(shelterLocationSearchInputAtom);
  const [searchRequest, setSearchRequest] = useAtom(shelterSearchRequestAtom);

  // React to search requests from SearchPage
  useEffect(() => {
    if (!searchRequest) return;

    const { name, location, mapBounds, displayText } = searchRequest;
    setSearchRequest(null);

    if (location) {
      setLocation(location, mapBounds);
      setLocationSearchInput(displayText ?? '');
    }

    const trimmed = name.trim();
    if (trimmed) {
      resetFilters();
      setNameSearch(trimmed);
      setNameSearchInput(trimmed);
      onNameSearch({ preserveMapBounds: !!location });
    } else {
      // Name cleared: reset name filter and re-fire with current map bounds.
      // If there's also a location, the map's location effect fires its own
      // search; otherwise restore map bounds so results don't stay blank.
      setNameSearch(undefined);
      setNameSearchInput('');
      if (!location) {
        onNameSearch({ restoreMapBounds: true });
      }
    }
  }, [
    searchRequest,
    setSearchRequest,
    setLocation,
    resetFilters,
    setNameSearch,
    setNameSearchInput,
    setLocationSearchInput,
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
        nameSearchPinFitRequestId={nameSearchPinFitRequestId}
        onShelterPinsReadyForMapFit={onShelterPinsReadyForMapFit}
      />
    </>
  );
}
