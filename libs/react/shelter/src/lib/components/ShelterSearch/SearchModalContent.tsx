import { Button } from '@monorepo/react/components';
import { LocationIcon, SearchIcon } from '@monorepo/react/icons';
import { useState } from 'react';
import { AddressAutocomplete } from '../AddressAutocomplete';
import { Input } from '../Input';
import { TLatLng } from '../Map';

type TProps = {
  locationSearchInputKey?: number;
  initialNameSearchValue: string;
  onNameSearchChange: (value: string) => void;
  onSearchClick: (value: string) => void;
  setLocation: (location: TLatLng) => void;
};

export function SearchModalContent(props: TProps) {
  const {
    locationSearchInputKey,
    initialNameSearchValue,
    onNameSearchChange,
    onSearchClick,
    setLocation,
  } = props;

  const [nameValue, setNameValue] = useState(initialNameSearchValue);

  function handleNameChange(value: string) {
    setNameValue(value);
    onNameSearchChange(value);
  }

  function handleSearchClick() {
    onSearchClick(nameValue);
  }

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-semibold mb-4">Search</h2>

      <Input
        value={nameValue}
        placeholder="Search by name"
        className="w-full rounded-b-none border-b-0"
        onChange={handleNameChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSearchClick();
          }
        }}
        leftIcon={<SearchIcon className="text-neutral-70 w-4 h-4" />}
      />
      <AddressAutocomplete
        key={locationSearchInputKey}
        className="w-full"
        inputClassname="rounded-t-none"
        placeholder="Search by location"
        onPlaceSelect={(place) => {
          if (!place?.location) return;
          setLocation({
            latitude: place.location.lat,
            longitude: place.location.lng,
          });
        }}
        leftIcon={<LocationIcon className="text-neutral-70 w-4 h-4" />}
      />
    </div>
  );
}

type TFooterProps = {
  onDone: () => void;
};

export function SearchModalFooter(props: TFooterProps) {
  const { onDone } = props;

  return (
    <div className="flex items-center justify-center p-4 bg-white pb-8">
      <Button
        onClick={onDone}
        variant="secondary"
        size="lg"
        className="w-[132px] bg-primary-60 text-white text-base"
      >
        Done
      </Button>
    </div>
  );
}
