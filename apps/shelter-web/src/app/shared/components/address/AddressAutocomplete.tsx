import { SearchIcon } from '@monorepo/react/icons';
import { TPlacePrediction } from '@monorepo/shared/places';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ISO3166Alpha2 } from '../../../types/isoCodes';
import { usePlacesClient } from '../../hooks/usePlacesClient';
import { Input } from '../form/input';
import { LA_COUNTY_CENTER } from '../map/constants.maps';

const DEBOUNCE_MS = 300;
const BOUNDS_RADIUS_MILES = 25;

export type TPlaceResult = {
  id: string;
  displayName: string | null;
  formattedAddress: string | null;
  location: { lat: number; lng: number } | null;
};

type TProps = {
  className?: string;
  placeholder?: string;
  onPlaceSelect: (place: TPlaceResult | null) => void;
  countryRestrictions?: ISO3166Alpha2 | ISO3166Alpha2[] | null;
};

export function AddressAutocomplete(props: TProps) {
  const {
    onPlaceSelect,
    countryRestrictions = 'us',
    placeholder,
    className = '',
  } = props;

  const places = usePlacesClient();
  const [inputValue, setInputValue] = useState('');
  const [predictions, setPredictions] = useState<TPlacePrediction[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const fetchPredictions = useCallback(
    async (input: string) => {
      if (!input || input.length < 3) {
        setPredictions([]);
        return;
      }

      try {
        const regionCodes = Array.isArray(countryRestrictions)
          ? countryRestrictions
          : countryRestrictions
          ? [countryRestrictions]
          : ['us'];

        const results = await places.autocomplete(input, {
          boundsCenter: LA_COUNTY_CENTER,
          boundsRadiusMiles: BOUNDS_RADIUS_MILES,
          includedRegionCodes: regionCodes,
        });

        setPredictions(results);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setPredictions([]);
      }
    },
    [countryRestrictions, places]
  );

  const handleInputChange = (value: string) => {
    setInputValue(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => fetchPredictions(value),
      DEBOUNCE_MS
    );
  };

  const handleSelect = useCallback(
    async (placeId: string) => {
      try {
        const result = await places.getDetails(placeId, {
          fields: 'displayName,formattedAddress,location',
        });

        onPlaceSelect({
          id: placeId,
          displayName: result.displayName || null,
          formattedAddress: result.formattedAddress || null,
          location: result.location
            ? { lat: result.location.latitude, lng: result.location.longitude }
            : null,
        });

        setInputValue(result.formattedAddress || '');
        setPredictions([]);
      } catch (error) {
        console.error('Error fetching place details:', error);
      }
    },
    [onPlaceSelect, places]
  );

  return (
    <div className={className}>
      <Input
        value={inputValue}
        placeholder={placeholder}
        className="w-full"
        onChange={handleInputChange}
        leftIcon={<SearchIcon className="text-neutral-70 w-4 h-4" />}
      />

      {predictions.length > 0 && (
        <ul className="mt-4" role="listbox">
          {predictions.map(({ placeId, mainText, secondaryText }) => (
            <li
              key={placeId}
              role="option"
              aria-selected={false}
              tabIndex={0}
              onClick={() => handleSelect(placeId)}
              onKeyDown={(e) => e.key === 'Enter' && handleSelect(placeId)}
              className="flex flex-col py-3 px-4 border-b border-neutral-90 cursor-pointer hover:bg-neutral-95 focus:bg-neutral-95 focus:outline-none"
            >
              <span className="text-sm font-medium">{mainText}</span>
              <span className="text-xs text-neutral-60">
                {secondaryText.replace(/, USA$/, '')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
