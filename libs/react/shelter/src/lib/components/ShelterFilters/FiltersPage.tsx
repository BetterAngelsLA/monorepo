import { CloseIcon } from '@monorepo/react/icons';
import { useAtom } from 'jotai';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  nullShelterPropertyFilters,
  shelterPropertyFiltersAtom,
} from '../../atoms';
import { shelterHomePath } from '../../constants';
import { FiltersActions } from './FiltersActions';
import { ShelterFilters } from './ShelterFilters';

export function FiltersPage() {
  const navigate = useNavigate();
  const [atomFilters, setAtomFilters] = useAtom(shelterPropertyFiltersAtom);
  const [draftFilters, setDraftFilters] = useState(() => atomFilters);

  function handleClose() {
    navigate(shelterHomePath);
  }

  function handleDone() {
    setAtomFilters(draftFilters);
    navigate(shelterHomePath);
  }

  function handleReset() {
    setDraftFilters(nullShelterPropertyFilters);
  }

  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 z-modal bg-white flex flex-col animate-slideInUp overflow-x-hidden overflow-y-auto">
      <div className="md:pt-8 p-6 md:p-10 max-h-[calc(100vh-88px)] overflow-hidden overflow-y-auto">
        <div className="flex justify-between align-center mt-0 mb-4">
          <button
            className="ml-auto"
            onClick={handleClose}
            aria-label="Close filters"
          >
            <CloseIcon className="w-4" />
          </button>
        </div>
        <div className="w-full h-full">
          <ShelterFilters
            className="w-full"
            filters={draftFilters}
            onFiltersChange={setDraftFilters}
          />
        </div>
      </div>
      <div className="w-full mt-auto shadow-[0_-2px_4px_0px_rgba(0,0,0,0.05)]">
        <FiltersActions
          className="pb-8"
          onDone={handleDone}
          onReset={handleReset}
        />
      </div>
    </div>
  );
}
