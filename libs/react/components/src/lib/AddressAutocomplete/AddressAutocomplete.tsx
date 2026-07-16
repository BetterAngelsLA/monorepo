import { SearchIcon } from '@monorepo/react/icons';
import { mergeCss, useDebounce } from '@monorepo/react/shared';
import {
  placeViewportToEdges,
  TPlacePrediction,
} from '@monorepo/shared/places';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Input } from '../Input';
import { LA_COUNTY_CENTER } from '../Map/constants.maps';
import { TMapBounds } from '../Map/types.maps';
import { useKeyboardListNav } from './hooks/useKeyboardListNav';
import { usePlacesClient } from './hooks/usePlacesClient';
import { ISO3166Alpha2 } from './types/isoCodes';

const DEBOUNCE_MS = 150;
const BOUNDS_RADIUS_MILES = 25;
const MIN_INPUT_LEN = 3;

export type TPlaceResult = {
  id: string;
  displayName: string | null;
  formattedAddress: string | null;
  location: { lat: number; lng: number } | null;
  /** Recommended map viewport from Places; used to fit zip codes, cities, states, etc. */
  viewport?: TMapBounds;
};

type TProps = {
  className?: string;
  placeholder?: string;
  initialValue?: string;
  onPlaceSelect: (place: TPlaceResult | null) => void;
  countryRestrictions?: ISO3166Alpha2 | ISO3166Alpha2[] | null;
  leftIcon?: React.ReactElement;
  inputClassname?: string;
  placeholderClassname?: string;
};

export function AddressAutocomplete(props: TProps) {
  const {
    onPlaceSelect,
    countryRestrictions = 'us',
    placeholder,
    initialValue = '',
    className,
    leftIcon,
    inputClassname,
    placeholderClassname,
  } = props;

  const places = usePlacesClient();
  const [inputValue, setInputValue] = useState(initialValue);
  const [predictions, setPredictions] = useState<TPlacePrediction[]>([]);
  const debouncedInput = useDebounce(inputValue, DEBOUNCE_MS);
  const justSelectedRef = useRef(false);

  const { activeIndex: activeOptionIndex, handleKeyDown } = useKeyboardListNav({
    items: predictions,
    onSelect: (p) => handleSelect(p.placeId),
  });

  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  const fetchPredictions = useCallback(
    async (input: string) => {
      if (input.length < MIN_INPUT_LEN) {
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
    [countryRestrictions, places],
  );

  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;

      return;
    }

    fetchPredictions(debouncedInput);
  }, [debouncedInput, fetchPredictions]);

  const handleInputChange = (value: string) => {
    setInputValue(value);

    if (!value.trim()) {
      onPlaceSelect(null);
      setPredictions([]);
    }
  };

  const handleSelect = useCallback(
    async (placeId: string) => {
      try {
        const result = await places.getDetails(placeId, {
          fields: 'displayName,formattedAddress,location,viewport',
        });

        onPlaceSelect({
          id: placeId,
          displayName: result.displayName || null,
          formattedAddress: result.formattedAddress || null,
          location: result.location
            ? { lat: result.location.latitude, lng: result.location.longitude }
            : null,
          viewport: result.viewport
            ? placeViewportToEdges(result.viewport)
            : undefined,
        });

        setInputValue(result.formattedAddress || '');
        setPredictions([]);
        justSelectedRef.current = true;
      } catch (error) {
        console.error('Error fetching place details:', error);
      }
    },
    [onPlaceSelect, places],
  );

  const predictionItemCss = [
    'flex',
    'flex-col',
    'py-3',
    'px-4',
    'border-b',
    'border-neutral-90',
    'cursor-pointer',
    'hover:bg-neutral-99',
    'focus:bg-neutral-99',
    'focus:outline-hidden',
  ];

  return (
    <div className={className}>
      <Input
        value={inputValue}
        placeholder={placeholder}
        className="w-full"
        inputClassname={inputClassname}
        placeholderClassname={placeholderClassname}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        iconBefore={
          leftIcon || <SearchIcon className="text-neutral-70 w-4 h-4" />
        }
      />

      {predictions.length > 0 && (
        <ul className="mt-4" role="listbox">
          {predictions.map(({ placeId, mainText, secondaryText }, idx) => (
            <li
              key={placeId}
              role="option"
              aria-selected={idx === activeOptionIndex}
              tabIndex={0}
              onClick={() => handleSelect(placeId)}
              onKeyDown={(e) => e.key === 'Enter' && handleSelect(placeId)}
              className={mergeCss([
                predictionItemCss,
                idx === activeOptionIndex && 'bg-neutral-98',
              ])}
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
