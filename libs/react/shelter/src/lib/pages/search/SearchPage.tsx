import { AddressAutocomplete, Button } from '@monorepo/react/components';
import { CloseIcon, SearchIcon } from '@monorepo/react/icons';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  shelterLocationSearchInputAtom,
  shelterNameSearchInputAtom,
  shelterSearchPendingLocationAtom,
  shelterSearchRequestAtom,
} from '../../atoms';
import { Input } from '../../components/Input';
import { shelterHomePath } from '../../constants';

export function SearchPage() {
  const navigate = useNavigate();
  const initialNameInput = useAtomValue(shelterNameSearchInputAtom);
  const locationInput = useAtomValue(shelterLocationSearchInputAtom);
  const setLocationInput = useSetAtom(shelterLocationSearchInputAtom);
  const setSearchRequest = useSetAtom(shelterSearchRequestAtom);
  const [pendingLocation, setPendingLocation] = useAtom(
    shelterSearchPendingLocationAtom,
  );

  const [nameInput, setNameInput] = useState(initialNameInput);

  function handleClose() {
    navigate(shelterHomePath);
  }

  function submit(name: string) {
    setSearchRequest({
      name,
      location: pendingLocation?.location ?? null,
      mapBounds: pendingLocation?.mapBounds,
      displayText: pendingLocation?.displayText,
    });
    navigate(shelterHomePath);
  }

  function handleDone() {
    submit(nameInput);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit(nameInput);
    }
  }

  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 z-modal bg-white flex flex-col animate-slideInUp overflow-x-hidden overflow-y-auto">
      <div className="md:pt-8 p-6 md:p-10 flex-1">
        <div className="flex justify-between items-center mt-0 mb-4">
          <h2 className="text-xl font-semibold">Search</h2>
          <button onClick={handleClose} aria-label="Close search">
            <CloseIcon className="w-4" />
          </button>
        </div>

        <Input
          value={nameInput}
          placeholder="Search by name"
          className="w-full rounded-b-none border-b-0"
          onChange={setNameInput}
          onKeyDown={handleSearchKeyDown}
          leftIcon={<SearchIcon className="text-neutral-70 w-4 h-4" />}
        />

        <AddressAutocomplete
          className="w-full"
          inputClassname="bg-white border border-neutral-90 rounded-t-none"
          placeholderClassname="placeholder:text-sm placeholder:text-neutral-40"
          placeholder="Search by location"
          initialValue={locationInput}
          onPlaceSelect={(place) => {
            if (!place?.location) {
              setPendingLocation(null);
              setLocationInput('');
              return;
            }
            const displayText =
              place.formattedAddress ?? place.displayName ?? '';
            setPendingLocation({
              location: {
                latitude: place.location.lat,
                longitude: place.location.lng,
              },
              mapBounds: place.viewport,
              displayText,
            });
            setLocationInput(displayText);
          }}
        />
      </div>

      <div className="w-full mt-auto shadow-[0_-2px_4px_0px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-center p-4 pb-8">
          <Button
            onClick={handleDone}
            variant="secondary"
            size="lg"
            className="w-[132px] bg-primary-60 text-white text-base"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
