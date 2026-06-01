import { FilterIcon, SearchIcon } from '@monorepo/react/icons';
import { useAtom, useSetAtom } from 'jotai';
import { useResetAtom } from 'jotai/utils';
import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { shelterPropertyFiltersAtom } from '../../atoms';
import { shelterFiltersPath } from '../../constants';
import { TLatLng, TMapBounds } from '../Map';
import { ModalAnimationEnum } from '../Modal';
import { modalAtom } from '../Modal/modalAtom';
import { FilterPills } from '../ShelterFilters';
import { SearchModalContent, SearchModalFooter } from './SearchModalContent';
import { SheltersDisplay } from './SheltersDisplay';

type TProps = {
  locationSearchInputKey?: number;
  mapBoundsFilter?: TMapBounds;
  nameSearchPinFitRequestId?: number;
  onShelterPinsReadyForMapFit?: (pinLocations: TLatLng[]) => void;
  onNameSearch: (options?: { preserveMapBounds?: boolean }) => void;
  setLocation: (location: TLatLng, mapBounds?: TMapBounds) => void;
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
  const setModal = useSetAtom(modalAtom);
  const nameSearchValueRef = useRef(nameSearchValue);
  nameSearchValueRef.current = nameSearchValue;
  const pendingSelectionRef = useRef<{
    location?: TLatLng;
    mapBounds?: TMapBounds;
  } | null>(null);

  const closeModal = useCallback(() => {
    setModal(null);
  }, [setModal]);

  function onFilterClick() {
    navigate(shelterFiltersPath);
  }

  function onNameSearchChange(value: string) {
    setNameSearchValue(value);
    if (!value.trim()) {
      setNameFilter(undefined);
    }
  }

  function applyNameSearch(
    value: string,
    options?: { preserveMapBounds?: boolean }
  ) {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    resetFilters();
    setNameFilter(trimmed);
    onNameSearch({
      preserveMapBounds:
        options?.preserveMapBounds ??
        !!pendingSelectionRef.current?.location,
    });
  }

  function onSearchClick(value: string) {
    applyNameSearch(value);
  }

  function onSearchLocationSelect(location: TLatLng, mapBounds?: TMapBounds) {
    pendingSelectionRef.current = { location, mapBounds };
  }

  function handleDone() {
    const pending = pendingSelectionRef.current;
    const preserveMapBounds = !!pending?.location;

    if (pending?.location) {
      setLocation(pending.location, pending.mapBounds);
    }

    applyNameSearch(nameSearchValueRef.current, { preserveMapBounds });

    pendingSelectionRef.current = null;
    closeModal();
  }

  function openSearchModal() {
    pendingSelectionRef.current = null;
    setModal({
      content: (
        <SearchModalContent
          locationSearchInputKey={locationSearchInputKey}
          initialNameSearchValue={nameSearchValueRef.current}
          onNameSearchChange={onNameSearchChange}
          onSearchClick={onSearchClick}
          setLocation={onSearchLocationSelect}
        />
      ),
      type: 'fullscreen',
      animation: ModalAnimationEnum.SLIDE_UP,
      footer: <SearchModalFooter onDone={handleDone} />,
    });
  }

  return (
    <>
      <div className="mt-4 flex flex-col items-center justify-between">
        <div className="flex items-center justify-between w-full">
          <button
            onClick={openSearchModal}
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
