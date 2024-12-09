import {
  APIProvider,
  AdvancedMarker,
  Map,
  Pin,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { useEffect, useRef, useState } from 'react';
import { HorizontalLayout } from '../../../layout/horizontalLayout';

export const LA_COUNTY_CENTER_LAT = 34.04499;
export const LA_COUNTY_CENTER_LNG = -118.251601;

const GOOGLE_MAPS_API_KEY = 'AIzaSyBRxhdZHuJpc_stQ2k14ALu5lb3jXsle8I';

const API_KEY = GOOGLE_MAPS_API_KEY;

export const AddressField = () => {
  const [selectedPlace, setSelectedPlace] =
    useState<google.maps.places.PlaceResult | null>(null);

  const [markerRef, marker] = useAdvancedMarkerRef();

  useEffect(() => {}, [selectedPlace]);

  const laCHlat = 34.054549159976425;
  const laCHlong = -118.24239580795084;

  return (
    <APIProvider
      apiKey={API_KEY}
      solutionChannel="GMP_devsite_samples_v3_rgmautocomplete"
    >
      <Map
        mapId={'bf51a910020fa25a'}
        defaultZoom={11}
        defaultCenter={{
          lat: LA_COUNTY_CENTER_LAT,
          lng: LA_COUNTY_CENTER_LNG,
        }}
        //   defaultBounds?: google.maps.LatLngBoundsLiteral & {
        //     padding?: number | google.maps.Padding;
        // };
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        className="h-96 w-full"
      >
        <AdvancedMarker
          ref={markerRef}
          position={{
            lat: LA_COUNTY_CENTER_LAT,
            lng: LA_COUNTY_CENTER_LNG,
          }}
        >
          <Pin background={'red'} borderColor={'black'} glyphColor={'green'} />
        </AdvancedMarker>
      </Map>
      {/* <MapControl position={ControlPosition.BOTTOM}> */}
      <div className="my-8">
        <PlaceAutocomplete onPlaceSelect={setSelectedPlace} />
      </div>
      {/* </MapControl> */}
      <MapHandler place={selectedPlace} marker={marker} />
    </APIProvider>
  );
};

interface MapHandlerProps {
  place: google.maps.places.PlaceResult | null;
  marker: google.maps.marker.AdvancedMarkerElement | null;
}

const MapHandler = ({ place, marker }: MapHandlerProps) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !place || !marker) return;

    if (place.geometry?.viewport) {
      map.fitBounds(place.geometry?.viewport);
    }
    marker.position = place.geometry?.location;
  }, [map, place, marker]);

  return null;
};

interface PlaceAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
}

const PlaceAutocomplete = ({ onPlaceSelect }: PlaceAutocompleteProps) => {
  const [placeAutocomplete, setPlaceAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary('places');

  useEffect(() => {
    if (!places || !inputRef.current) {
      return;
    }

    const options = {
      fields: ['geometry', 'name', 'formatted_address'],
    };

    setPlaceAutocomplete(new places.Autocomplete(inputRef.current, options));
  }, [places]);

  useEffect(() => {
    console.log(
      '################################### onPlaceSelect / placeAutocomplete changed'
    );
    if (!placeAutocomplete) return;

    placeAutocomplete.addListener('place_changed', () => {
      console.log('################################### PLACE CHANGED');
      console.log(placeAutocomplete.getPlace());
      console.log();
      onPlaceSelect(placeAutocomplete.getPlace());
    });
  }, [onPlaceSelect, placeAutocomplete]);

  const inputCss = [
    'w-full',
    'px-4',
    'py-2',
    'border ',
    'border-gray-500',
    'rounded-2xl',
    'text-sm',
    'placeholder:text-sm',
  ].join(' ');

  return (
    <HorizontalLayout>
      <input ref={inputRef} placeholder="search address" className={inputCss} />
    </HorizontalLayout>
  );
};
