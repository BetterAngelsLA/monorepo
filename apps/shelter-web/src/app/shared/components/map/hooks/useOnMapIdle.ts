import { useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';

const idleHandlers = new Set<() => void>();
let listener: google.maps.MapsEventListener | null = null;

export function useOnMapIdle(handler: () => void) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    idleHandlers.add(handler);

    if (!listener) {
      listener = google.maps.event.addListener(map, 'idle', () => {
        idleHandlers.forEach((h) => h());
      });
    }

    return () => {
      idleHandlers.delete(handler);

      if (idleHandlers.size === 0 && listener) {
        listener.remove();
        listener = null;
      }
    };
  }, [map, handler]);
}
