import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TPlacePrediction,
  getPlaceAutocomplete,
  getPlaceDetailsById,
} from '../../services';
import { TLocationData } from './types';

interface UseLocationSearchOptions {
  baseUrl: string;
  onSelect: (location: TLocationData) => void;
}

export function useLocationSearch({
  baseUrl,
  onSelect,
}: UseLocationSearchOptions) {
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
          const results = await getPlaceAutocomplete({ baseUrl, query: q });
          setSuggestions(results);
        } catch (err) {
          console.error('Error fetching suggestions:', err);
        }
      }, 400),
    [baseUrl]
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
        const r = await getPlaceDetailsById({
          baseUrl,
          placeId: place.placeId,
          fields: 'geometry,address_component',
        });
        const loc = r.geometry?.location;
        if (!loc) return;
        const name = place.description.split(', ')[0];
        onSelect({
          latitude: loc.lat,
          longitude: loc.lng,
          name,
          address: place.description,
          addressComponents: r.address_components || [],
        });
        setQuery('');
        setSuggestions([]);
      } catch (err) {
        console.error('Error selecting suggestion:', err);
      }
    },
    [baseUrl, onSelect]
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
