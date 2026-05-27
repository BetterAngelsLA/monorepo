import { AddressAutocomplete, TPlaceResult } from '@monorepo/react/components';
import { MapPinIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';
import { AdvancedMarker, Map as GoogleMap } from '@vis.gl/react-google-maps';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '../../../../../components/base-ui/buttons/buttons';

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
  expandable?: boolean;
  isViewMode?: boolean;
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
  expandable,
  isViewMode,
}: LocationPickerProps) {
  const hasLocation = !!(value?.latitude && value?.longitude);

  const [mapExpanded, setMapExpanded] = useState<boolean>(false);

  const isViewEditMode = typeof isViewMode === 'boolean';

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

  const mapHeightCss = expandable && !mapExpanded ? 'h-[150px]' : 'h-[300px]';

  return (
    <div
      className={mergeCss(['flex flex-col gap-4', isViewEditMode && 'pl-5'])}
    >
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {(!isViewEditMode || !isViewMode) && (
        <AddressAutocomplete
          placeholder="Search address"
          onPlaceSelect={handlePlaceSelect}
        />
      )}

      {isViewMode && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">{value?.place ?? ''}</span>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div
        className={mergeCss([
          'w-full rounded-md overflow-hidden border border-gray-300 shadow-xs relative',
          mapHeightCss,
        ])}
      >
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

        {expandable && (
          <Button
            variant="floating"
            onClick={() => setMapExpanded(!mapExpanded)}
            className="z-50 absolute top-4 right-4 px-3 py-3 text-base"
            leftIcon={
              mapExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )
            }
          />
        )}
      </div>
    </div>
  );
}
