import { SearchIcon } from '@monorepo/react/icons';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ISO3166Alpha2 } from '../../../types/isoCodes';
import { Input } from '../form/input';
import { LA_COUNTY_CENTER } from '../map/constants.maps';
import { getPlacesBounds } from '../map/utils/getPlacesBounds';

const boundsLA = getPlacesBounds({
  boundsCenter: LA_COUNTY_CENTER,
  boundsRadiusMiles: 25,
});

const DEBOUNCE_MS = 300;

export type TPlaceResult = {
  id: string;
  displayName: string | null;
  formattedAddress: string | null;
  location: google.maps.LatLng | null;
  viewport: google.maps.LatLngBounds | null;
};

type TPlacePrediction = {
  placeId: string;
  mainText: string;
  secondaryText: string;
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
  const [sessionToken, setSessionToken] =
    useState<google.maps.places.AutocompleteSessionToken>();
  const [predictions, setPredictions] = useState<TPlacePrediction[]>([]);

  // Wait for places library to load before creating session token
  const places = useMapsLibrary('places');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!places) return;
    setSessionToken(new google.maps.places.AutocompleteSessionToken());
  }, [places]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const fetchPredictions = useCallback(
    async (input: string) => {
      if (!input || !sessionToken) {
        setPredictions([]);
        return;
      }

      try {
        const { suggestions } =
          await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            {
              input,
              sessionToken,
              locationBias: boundsLA,
              includedRegionCodes: Array.isArray(countryRestrictions)
                ? countryRestrictions
                : countryRestrictions
                ? [countryRestrictions]
                : ['us'],
            }
          );

        setPredictions(
          suggestions
            .filter((s) => s.placePrediction)
            .map(({ placePrediction }) => ({
              placeId: placePrediction!.placeId,
              mainText: placePrediction!.mainText?.text || '',
              secondaryText: placePrediction!.secondaryText?.text || '',
            }))
        );
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setPredictions([]);
      }
    },
    [sessionToken, countryRestrictions]
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
        const place = new google.maps.places.Place({ id: placeId });
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'viewport'],
        });

        onPlaceSelect({
          id: placeId,
          displayName: place.displayName || null,
          formattedAddress: place.formattedAddress || null,
          location: place.location || null,
          viewport: place.viewport || null,
        });

        setInputValue(place.formattedAddress || '');
        setPredictions([]);
        setSessionToken(new google.maps.places.AutocompleteSessionToken());
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
