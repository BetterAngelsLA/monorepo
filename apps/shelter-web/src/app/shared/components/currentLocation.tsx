import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { minutesToMiliSeconds } from '../../shared/utils/time';

const POSITION_TIMEOUT_MINUTES = 10;

type TCoordinates = {
  latitude: number;
  longitude: number;
};

export function CurrentLocation() {
  const stableRef: MutableRefObject<number> = useRef<number>(0);

  const geolocationSupported = !!navigator.geolocation;

  const [location, setLocation] = useState<TCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const onLocationSuccess = (position: GeolocationPosition): void => {
    const { latitude, longitude } = position.coords;

    setLocation({ latitude, longitude });
    setLoading(false);
    setError(null);
  };

  const onLocationError = (err: GeolocationPositionError): void => {
    setLoading(false);
    setError(err.message);
    setLocation(null);
  };

  const getLocation = (): void => {
    if (!navigator.geolocation) {
      setLoading(false);
      setError('Geolocation is not supported by your browser.');

      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: minutesToMiliSeconds(POSITION_TIMEOUT_MINUTES),
      maximumAge: 0,
    };

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      onLocationSuccess,
      onLocationError,
      options
    );
  };

  if (!geolocationSupported) {
    return (
      <p className="border mt-12 p-2">
        Geolocation not supported in your browser (tempo notice only)
      </p>
    );
  }

  useEffect(() => {
    if (stableRef.current > 0) {
      return;
    }

    stableRef.current = 1;

    getLocation();
  }, [getLocation]);

  return (
    <div className="mt-8 p-2 bg-primary border-2 rounded">
      {location && (
        <p>
          Latitude: {location.latitude}, Longitude: {location.longitude}
        </p>
      )}

      {loading && <div>...checking location</div>}

      {error && <p className="text-red-500">Error: {error}</p>}
    </div>
  );
}
