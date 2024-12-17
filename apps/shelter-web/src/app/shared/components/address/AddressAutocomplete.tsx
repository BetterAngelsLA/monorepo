import { SearchIcon } from '@monorepo/react/icons';
import { useApiIsLoaded, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useCallback, useEffect, useState } from 'react';
import { ISO3166Alpha2 } from '../../../types/isoCodes';
import { Input } from '../form/input';
import { LA_COUNTY_CENTER, getPlacesBounds } from '../maps/getPlacesBounds';
import { AddressSuggestion } from './addressSuggestion';

const boundsLA = getPlacesBounds({
  boundsCenter: LA_COUNTY_CENTER,
  boundsRadiusMiles: 25,
});

type TPlaceAutocomplete = {
  className?: string;
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
  countryRestrictions?: ISO3166Alpha2 | ISO3166Alpha2[] | null;
};

export const AddressAutocomplete = (props: TPlaceAutocomplete) => {
  const { onPlaceSelect, countryRestrictions = 'us', className = '' } = props;

  const apiIsLoaded = useApiIsLoaded();

  const [inputValue, setInputValue] = useState<string>('');
  const [sessionToken, setSessionToken] = useState<
    google.maps.places.AutocompleteSessionToken | undefined
  >(undefined);
  const [autocompleteService, setAutocompleteService] =
    useState<google.maps.places.AutocompleteService | null>(null);
  const [predictionResults, setPredictionResults] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);

  const places = useMapsLibrary('places');

  useEffect(() => {
    if (!apiIsLoaded) {
      return;
    }

    setAutocompleteService(new google.maps.places.AutocompleteService());
    setSessionToken(new google.maps.places.AutocompleteSessionToken()); // 1
  }, [places]);

  const fetchPredictions = useCallback(
    async (inputValue: string) => {
      if (!autocompleteService || !inputValue || !sessionToken) {
        setPredictionResults([]);
        return;
      }

      const request: google.maps.places.AutocompletionRequest = {
        input: inputValue,
        sessionToken,
        locationBias: boundsLA,
        region: 'us',
        componentRestrictions: {
          country: countryRestrictions,
        },
      };

      autocompleteService.getPlacePredictions(
        request,
        (predictions, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            setPredictionResults(predictions);
          } else {
            setPredictionResults([]);
          }
        }
      );
    },
    [autocompleteService, sessionToken]
  );

  const onInputChange = useCallback(
    (value: string) => {
      setInputValue(value);
      fetchPredictions(value);
    },
    [setInputValue, fetchPredictions]
  );

  const handleSuggestionClick = useCallback(
    (placeId: string) => {
      if (!window.google) {
        console.error('Google Maps API is not loaded.');

        return;
      }

      const placesService = new google.maps.places.PlacesService(
        document.createElement('div')
      );

      const request: google.maps.places.PlaceDetailsRequest = {
        placeId,
        fields: ['geometry', 'name', 'formatted_address'],
        sessionToken,
      };

      placesService.getDetails(request, (placeDetails, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          placeDetails
        ) {
          onPlaceSelect(placeDetails);
          setInputValue(placeDetails.formatted_address || '');
          setSessionToken(new google.maps.places.AutocompleteSessionToken());
          setPredictionResults([]);
        }
      });
    },
    [onPlaceSelect, sessionToken]
  );

  return (
    <div className={className}>
      <Input
        value={inputValue}
        placeholder="Search address"
        className="mt-4"
        onChange={onInputChange}
        leftIcon={<SearchIcon className="text-neutral-70 w-4 h-4" />}
      />

      {!!predictionResults.length && (
        <ul className="mt-4">
          {predictionResults.map((suggestion) => {
            const { place_id } = suggestion;

            return (
              <AddressSuggestion
                key={place_id}
                onClick={() => handleSuggestionClick(place_id)}
                item={suggestion}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
};
