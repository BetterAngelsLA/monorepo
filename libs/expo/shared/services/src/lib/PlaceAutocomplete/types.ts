export type TPlaceLatLng = {
  lat: number;
  lng: number;
};

export type TPlacePrediction = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

export type TAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

export type TPlaceDetails = {
  formatted_address?: string;
  address_components?: TAddressComponent[];
  geometry?: {
    location: TPlaceLatLng;
  };
  name?: string;
};
