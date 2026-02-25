export type TPlaceLatLng = {
  latitude: number;
  longitude: number;
};

export type TPlacePrediction = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

export type TAddressComponent = {
  longText: string;
  shortText: string;
  types: string[];
};

export type TPlaceDetails = {
  displayName?: string;
  formattedAddress?: string;
  location?: TPlaceLatLng;
  addressComponents?: TAddressComponent[];
};
