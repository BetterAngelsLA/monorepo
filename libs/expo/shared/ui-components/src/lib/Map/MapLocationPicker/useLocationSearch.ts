import { TPlacePrediction } from '@monorepo/expo/shared/services';
import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGooglePlaces } from '../../providers/GooglePlacesProvider';
import { TLocationData } from './types';

interface UseLocationSearchOptions {
  onSelect: (location: TLocationData) => void;
}

export function useLocationSearch({ onSelect }: UseLocationSearchOptions) {
  const places = useGooglePlaces();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<TPlacePrediction[]>([]);

  const searching = suggestions.length > 0;

  const debouncedSearch = useMemo(
    () =>
      debounce(async (q: string) => {
        if (q.length < 3) {
          setSuggestions([]);
          return;
        }
        try {
          const results = await places.autocomplete(q);
          setSuggestions(results);
        } catch (err) {
          console.error('Error fetching suggestions:', err);
        }
      }, 400),
    [places]
  );

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  useEffect(() => {
    if (query) {
      debouncedSearch(query);
    } else {
      setSuggestions([]);
    }
  }, [query, debouncedSearch]);

  const selectSuggestion = useCallback(
    async (place: TPlacePrediction) => {
      try {
        const r = await places.getDetails(place.placeId, {
          fields: 'location,addressComponents',
        });
        const loc = r.location;
        if (!loc) return;
        const name = place.description.split(', ')[0];
        onSelect({
          latitude: loc.latitude,
          longitude: loc.longitude,
          name,
          address: place.description,
          addressComponents: r.addressComponents || [],
        });
        setQuery('');
        setSuggestions([]);
      } catch (err) {
        console.error('Error selecting suggestion:', err);
      }
    },
    [places, onSelect]
  );

  const clear = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    debouncedSearch.cancel();
  }, [debouncedSearch]);

  return {
    query,
    setQuery,
    suggestions,
    searching,
    selectSuggestion,
    clear,
  };
}
