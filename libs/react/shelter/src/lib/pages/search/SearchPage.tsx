import { Button } from '@monorepo/react/components';
import { CloseIcon, SearchIcon } from '@monorepo/react/icons';
import { useAtomValue, useSetAtom } from 'jotai';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  shelterNameSearchValueAtom,
  shelterSearchSubmissionAtom,
} from '../../atoms';
import { AddressAutocomplete } from '../../components/AddressAutocomplete';
import { Input } from '../../components/Input';
import { TLatLng, TMapBounds } from '../../components/Map';
import { shelterHomePath } from '../../constants';

export function SearchPage() {
  const navigate = useNavigate();
  const initialNameValue = useAtomValue(shelterNameSearchValueAtom);
  const setSubmission = useSetAtom(shelterSearchSubmissionAtom);

  const [nameValue, setNameValue] = useState(initialNameValue);
  const [pendingLocation, setPendingLocation] = useState<{
    location: TLatLng;
    mapBounds?: TMapBounds;
  } | null>(null);

  function handleClose() {
    navigate(shelterHomePath);
  }

  function submit(name: string) {
    setSubmission({ nameValue: name, pendingLocation });
    navigate(shelterHomePath);
  }

  function handleDone() {
    submit(nameValue);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit(nameValue);
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
          value={nameValue}
          placeholder="Search by name"
          className="w-full rounded-b-none border-b-0"
          onChange={setNameValue}
          onKeyDown={handleSearchKeyDown}
          leftIcon={<SearchIcon className="text-neutral-70 w-4 h-4" />}
        />
        <AddressAutocomplete
          className="w-full"
          inputClassname="rounded-t-none"
          placeholder="Search by location"
          onPlaceSelect={(place) => {
            if (!place?.location) return;
            setPendingLocation({
              location: {
                latitude: place.location.lat,
                longitude: place.location.lng,
              },
              mapBounds: place.viewport,
            });
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
