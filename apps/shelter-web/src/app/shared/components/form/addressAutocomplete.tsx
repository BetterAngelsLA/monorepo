import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useEffect, useRef, useState } from 'react';
import { TAddress } from '../maps/types.maps';
import {
  LA_COUNTY_CENTER,
  getPlacesBounds,
} from '../maps/utils/getPlacesBounds';
import { Input } from './input';

const boundsLA = getPlacesBounds({
  boundsCenter: LA_COUNTY_CENTER,
  boundsRadiusMiles: 25,
});

type TPlaceAutocomplete = {
  onAddressSelect: (address: TAddress | null) => void;
};

export const AddressAutocomplete = (props: TPlaceAutocomplete) => {
  const { onAddressSelect } = props;

  const [placeAutocomplete, setPlaceAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary('places');

  useEffect(() => {
    if (!places || !inputRef.current) {
      return;
    }

    // google.maps.places.AutocompleteOptions does not look correct
    const options = {
      fields: ['geometry', 'name', 'formatted_address'],
      locationBias: boundsLA,
    };

    const autocomplete = new places.Autocomplete(inputRef.current, options);

    setPlaceAutocomplete(autocomplete);

    return () => {
      autocomplete.unbindAll();
    };
  }, [places]);

  useEffect(() => {
    if (!placeAutocomplete) {
      return;
    }

    const handlePlaceChange = () => {
      const placeResult = placeAutocomplete.getPlace();

      if (!placeResult) {
        return;
      }

      const formattedAddress = placeResult.formatted_address;
      const latitude = placeResult.geometry?.location?.lat();
      const longtitude = placeResult.geometry?.location?.lng();

      if (!formattedAddress || !latitude || !longtitude) {
        onAddressSelect(null);

        return;
      }

      onAddressSelect({
        address: formattedAddress,
        lat: latitude,
        lng: longtitude,
      });
    };

    placeAutocomplete.addListener('place_changed', handlePlaceChange);

    return () => {
      google.maps.event.clearInstanceListeners(placeAutocomplete);
    };
  }, [placeAutocomplete]);

  return <Input ref={inputRef} placeholder="Search address" className="mt-4" />;
};
