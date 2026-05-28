import { Button } from '@monorepo/react/components';
import { LocationIcon, SearchIcon } from '@monorepo/react/icons';
import { useState } from 'react';
import { AddressAutocomplete, TPlaceResult } from '../AddressAutocomplete';
import { Input } from '../Input';

type TProps = {
  locationSearchInputKey?: number;
  initialNameSearchValue: string;
  onPlaceSelect: (place: TPlaceResult | null) => void;
  onNameSearchChange: (value: string) => void;
  onSearchClick: (value: string) => void;
};

export function SearchModalContent(props: TProps) {
  const {
    locationSearchInputKey,
    initialNameSearchValue,
    onPlaceSelect,
    onNameSearchChange,
    onSearchClick,
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
      <AddressAutocomplete
        key={locationSearchInputKey}
        className="w-full"
        placeholder="Search by location"
        onPlaceSelect={onPlaceSelect}
        leftIcon={<LocationIcon className="text-neutral-70 w-4 h-4" />}
      />
      <div className="mt-2">
        <Input
          value={nameValue}
          placeholder="Search by name"
          className="w-full"
          onChange={handleNameChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearchClick();
            }
          }}
          leftIcon={<SearchIcon className="text-neutral-70 w-4 h-4" />}
        />
      </div>
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
