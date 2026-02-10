import { SearchIcon } from '@monorepo/react/icons';
import { getCookie } from '@monorepo/react/shared';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ISO3166Alpha2 } from '../../../types/isoCodes';
import { Input } from '../form/input';
import { LA_COUNTY_CENTER } from '../map/constants.maps';

const DEBOUNCE_MS = 300;
const MILES_TO_METERS = 1609.34;
const BOUNDS_RADIUS_MILES = 25;

// Get config from environment
const apiUrl = import.meta.env.VITE_SHELTER_API_URL || '';
const csrfCookieName =
  import.meta.env.VITE_SHELTER_CSRF_COOKIE_NAME || 'csrftoken';
const csrfHeaderName =
  import.meta.env.VITE_SHELTER_CSRF_HEADER_NAME || 'x-csrftoken';

export type TPlaceResult = {
  id: string;
  displayName: string | null;
  formattedAddress: string | null;
  location: { lat: number; lng: number } | null;
};

type TPlacePrediction = {
  placeId: string;
  mainText: string;
  secondaryText: string;
};

type TAutocompleteSuggestion = {
  placePrediction?: {
    placeId: string;
    structuredFormat: {
      mainText: { text: string };
      secondaryText: { text: string };
    };
  };
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
        const csrfToken = getCookie(csrfCookieName)[0];

        const response = await axios.post<{
          suggestions: TAutocompleteSuggestion[];
        }>(
          `${apiUrl}/proxy/places/v1/places:autocomplete/`,
          {
            input,
            locationBias: {
              circle: {
                center: {
                  latitude: LA_COUNTY_CENTER.latitude,
                  longitude: LA_COUNTY_CENTER.longitude,
                },
                radius: BOUNDS_RADIUS_MILES * MILES_TO_METERS,
              },
            },
            includedRegionCodes: Array.isArray(countryRestrictions)
              ? countryRestrictions
              : countryRestrictions
              ? [countryRestrictions]
              : ['us'],
            fieldMask:
              'suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat',
          },
          {
            headers: {
              'Content-Type': 'application/json',
              ...(csrfToken && { [csrfHeaderName]: csrfToken }),
            },
            withCredentials: true,
          }
        );

        setPredictions(
          (response.data.suggestions || [])
            .filter(
              (
                s
              ): s is typeof s & {
                placePrediction: NonNullable<typeof s.placePrediction>;
              } => !!s.placePrediction
            )
            .map(({ placePrediction }) => ({
              placeId: placePrediction.placeId,
              mainText: placePrediction.structuredFormat?.mainText?.text || '',
              secondaryText:
                placePrediction.structuredFormat?.secondaryText?.text || '',
            }))
        );
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setPredictions([]);
      }
    },
    [countryRestrictions]
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
        // Use legacy place details API through proxy
        const response = await axios.get<{
          result: {
            name?: string;
            formatted_address?: string;
            geometry?: {
              location: { lat: number; lng: number };
            };
          };
        }>(`${apiUrl}/proxy/maps/api/place/details/json/`, {
          params: {
            place_id: placeId,
            fields: 'name,formatted_address,geometry',
          },
          withCredentials: true,
        });

        const result = response.data.result;

        onPlaceSelect({
          id: placeId,
          displayName: result.name || null,
          formattedAddress: result.formatted_address || null,
          location: result.geometry?.location || null,
        });

        setInputValue(result.formatted_address || '');
        setPredictions([]);
      } catch (error) {
        console.error('Error fetching place details:', error);
      }
    },
    [onPlaceSelect]
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
