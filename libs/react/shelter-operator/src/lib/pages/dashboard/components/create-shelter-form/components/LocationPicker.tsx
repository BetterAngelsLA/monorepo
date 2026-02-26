import { AddressAutocomplete, TPlaceResult } from '@monorepo/react/components';
import { MapPinIcon } from '@monorepo/react/icons';
import { AdvancedMarker, Map as GoogleMap } from '@vis.gl/react-google-maps';
import { useCallback } from 'react';

interface LocationPickerProps {
  value: {
    place: string;
    latitude?: number;
    longitude?: number;
  } | null;
  onChange: (
    value: { place: string; latitude: number; longitude: number } | null
  ) => void;
  error?: string;
  label?: string;
}

const SHELTER_MAP_ID = 'SHELTER_LOCATION_MAP';
const DEFAULT_CENTER = { lat: 34.04499, lng: -118.251601 };
const DEFAULT_ZOOM = 10;
const SELECTED_ZOOM = 15;

export function LocationPicker({
  value,
  onChange,
  error,
  label = 'Location',
}: LocationPickerProps) {
  const hasLocation = !!(value?.latitude && value?.longitude);

  const center = hasLocation
    ? { lat: value.latitude as number, lng: value.longitude as number }
    : DEFAULT_CENTER;

  const handlePlaceSelect = useCallback(
    (place: TPlaceResult | null) => {
      if (!place?.location) {
        onChange(null);
        return;
      }

      onChange({
        place: place.formattedAddress || place.displayName || '',
        latitude: place.location.lat,
        longitude: place.location.lng,
      });
    },
    [onChange]
  );

  return (
    <div className="flex flex-col gap-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <AddressAutocomplete
        placeholder="Search address"
        onPlaceSelect={handlePlaceSelect}
      />

      {value?.place && (
        <div className="text-sm text-gray-600">
          Selected: <span className="font-medium">{value.place}</span>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="w-full h-[300px] rounded-md overflow-hidden border border-gray-300 shadow-sm">
        <GoogleMap
          mapId={SHELTER_MAP_ID}
          className="w-full h-full"
          center={center}
          zoom={hasLocation ? SELECTED_ZOOM : DEFAULT_ZOOM}
          disableDefaultUI
          gestureHandling="greedy"
        >
          {hasLocation && (
            <AdvancedMarker position={center} zIndex={99}>
              <MapPinIcon className="h-10" type="secondary" />
            </AdvancedMarker>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
