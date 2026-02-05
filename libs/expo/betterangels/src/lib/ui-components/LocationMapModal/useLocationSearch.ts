import { debounce, DebouncedFunc } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
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

  // Store baseUrl in ref so debounced function always has latest value
  const baseUrlRef = useRef(baseUrl);
  baseUrlRef.current = baseUrl;

  // Create stable debounced function once
  const debouncedSearchRef = useRef<
    DebouncedFunc<(q: string) => Promise<void>>
  >(
    debounce(async (q: string) => {
      if (q.length < 3) {
        setSuggestions([]);
        return;
      }
      try {
        const results = await getPlaceAutocomplete({
          baseUrl: baseUrlRef.current,
          query: q,
        });
        setSuggestions(results);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    }, 400)
  );

  // Cleanup on unmount
  useEffect(() => {
    const debouncedFn = debouncedSearchRef.current;
    return () => {
      debouncedFn?.cancel();
    };
  }, []);

  // Trigger search when query changes
  useEffect(() => {
    if (query) {
      debouncedSearchRef.current(query);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const selectSuggestion = useCallback(
    async (place: TPlacePrediction) => {
      try {
        const r = await getPlaceDetailsById({
          baseUrl: baseUrlRef.current,
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
    [onSelect]
  );

  const clear = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    debouncedSearchRef.current?.cancel();
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    searching,
    selectSuggestion,
    clear,
  };
}
