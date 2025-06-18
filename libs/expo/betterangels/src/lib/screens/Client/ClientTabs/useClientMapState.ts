import {
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Region } from 'react-native-maps';

type MapState = {
  region: Region;
};

let sharedMapState: MapState | null = null;

export function useClientMapState(clientId?: string) {
  const [mapState, setMapStateInternal] = useState<MapState | null>(
    sharedMapState
  );
  const previousClientId = useRef<string | null | undefined>(undefined);

  // Reset map state when switching to a different client
  useEffect(() => {
    if (previousClientId.current && previousClientId.current !== clientId) {
      sharedMapState = null;
      setMapStateInternal(null);
    }

    previousClientId.current = clientId;
  }, [clientId]);

  const setMapState = useCallback((next: SetStateAction<MapState | null>) => {
    setMapStateInternal((prev) => {
      const result =
        typeof next === 'function'
          ? (next as (prev: MapState | null) => MapState | null)(prev)
          : next;

      sharedMapState = result;

      return result;
    });
  }, []);

  useEffect(() => {
    console.log('################################### mapState CHANGED');
  }, [mapState]);

  return { mapState, setMapState };
}
