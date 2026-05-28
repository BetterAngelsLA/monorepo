import { CloseIcon, FilterIcon, SearchIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';
import { useAtom, useSetAtom } from 'jotai';
import { useResetAtom } from 'jotai/utils';
import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { shelterPropertyFiltersAtom } from '../../atoms';
import { shelterFiltersPath } from '../../constants';
import { TPlaceResult } from '../AddressAutocomplete';
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
  onNameSearch: () => void;
  onLocationClear: () => void;
  setLocation: (location: TLatLng) => void;
};

export function ShelterSearch(props: TProps) {
  const {
    locationSearchInputKey = 0,
    mapBoundsFilter,
    nameSearchPinFitRequestId = 0,
    onShelterPinsReadyForMapFit,
    onNameSearch,
    onLocationClear,
    setLocation,
  } = props;
  const navigate = useNavigate();
  const [filters] = useAtom(shelterPropertyFiltersAtom);
  const [nameFilter, setNameFilter] = useState<string>();
  const resetFilters = useResetAtom(shelterPropertyFiltersAtom);
  const [nameSearchValue, setNameSearchValue] = useState('');
  const [locationLabel, setLocationLabel] = useState<string>();
  const setModal = useSetAtom(modalAtom);
  const nameSearchValueRef = useRef(nameSearchValue);
  nameSearchValueRef.current = nameSearchValue;

  const closeModal = useCallback(() => {
    setModal(null);
  }, [setModal]);

  function onPlaceSelect(place: TPlaceResult | null) {
    if (!place) {
      return;
    }

    const latitude = place.location?.lat;
    const longitude = place.location?.lng;

    if (!latitude || !longitude) {
      return;
    }

    setNameSearchValue('');
    setNameFilter(undefined);
    setLocationLabel(
      place.formattedAddress || place.displayName || 'Selected location'
    );

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

  function onSearchClick(value: string) {
    resetFilters();
    setNameFilter(value.trim());
    onNameSearch();
  }

  function handleDone() {
    const value = nameSearchValueRef.current.trim();
    if (value) {
      onSearchClick(value);
    }
    closeModal();
  }

  function openSearchModal() {
    setModal({
      content: (
        <SearchModalContent
          locationSearchInputKey={locationSearchInputKey}
          initialNameSearchValue={nameSearchValueRef.current}
          onPlaceSelect={onPlaceSelect}
          onNameSearchChange={onNameSearchChange}
          onSearchClick={onSearchClick}
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
            className="flex text-neutral-70 text-sm items-center border rounded-lg border-neutral-90 p-4 w-full"
          >
            <SearchIcon className="text-neutral-70 w-4 h-4 mr-4" />
            Search
          </button>
          <button onClick={onFilterClick} className="ml-4">
            <FilterIcon className="w-6 text-primary-20" />
          </button>
        </div>
      </div>

      <SearchPills
        nameFilter={nameFilter}
        locationLabel={locationLabel}
        onClearName={() => {
          setNameSearchValue('');
          setNameFilter(undefined);
        }}
        onClearLocation={() => {
          setLocationLabel(undefined);
          onLocationClear();
        }}
      />
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

const pillCss = [
  'inline-flex',
  'items-center',
  'gap-1',
  'mr-2',
  'last:mr-0',
  'pl-2',
  'pr-1',
  'py-1',
  'text-xs',
  'bg-primary-95',
  'rounded',
  'mb-2',
];

function SearchPills(props: {
  nameFilter?: string;
  locationLabel?: string;
  onClearName: () => void;
  onClearLocation: () => void;
}) {
  const { nameFilter, locationLabel, onClearName, onClearLocation } = props;

  const pills: { id: string; label: string; onClear: () => void }[] = [];

  if (nameFilter) {
    pills.push({
      id: 'name',
      label: `Name: ${nameFilter}`,
      onClear: onClearName,
    });
  }

  if (locationLabel) {
    pills.push({
      id: 'location',
      label: `Location: ${locationLabel}`,
      onClear: onClearLocation,
    });
  }

  if (!pills.length) return null;

  return (
    <div className="flex flex-wrap mt-2">
      {pills.map((pill) => (
        <div className={mergeCss(pillCss)} key={pill.id}>
          <span>{pill.label}</span>
          <button
            type="button"
            className="flex shrink-0 items-center justify-center rounded-full p-1 text-neutral-50 hover:bg-primary-90 hover:text-neutral-20"
            aria-label={`Remove ${pill.label}`}
            onClick={pill.onClear}
          >
            <CloseIcon className="w-3 h-3 bg-white-60 rounded-full p-0.5 text-primary-20" />
          </button>
        </div>
      ))}
    </div>
  );
}
