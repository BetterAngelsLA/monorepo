import { useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';

/**
 * Subscribe to a Google Map event and clean up on unmount or deps change.
 *
 * @param eventName  the name of the event, e.g. 'idle', 'click', etc.
 * @param handler    callback to run when the event fires
 */

export function useMapEvent<K extends keyof google.maps.Map>(
  eventName: K,
  handler: (this: google.maps.Map, ...args: any[]) => void
) {
  const map = useMap();

  useEffect(() => {
    if (!map) {
      return;
    }

    const listener = (map as any).addListener(eventName, handler);

    return () => {
      listener.remove();
    };
  }, [map, eventName, handler]);
}
