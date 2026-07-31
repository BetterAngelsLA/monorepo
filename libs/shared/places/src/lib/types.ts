export type TPlaceLatLng = {
  latitude: number;
  longitude: number;
};

/** Diagonal corners of the recommended map viewport for a place (Places API). */
export type TPlaceViewport = {
  low: TPlaceLatLng;
  high: TPlaceLatLng;
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
  /** Recommended bounds for displaying this place on a map; may be absent. */
  viewport?: TPlaceViewport;
  addressComponents?: TAddressComponent[];
};
