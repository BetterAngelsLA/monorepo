import axios from 'axios';

type TGetPlaceDetailsProps = {
  baseUrl: string;
  placeId: string;
  fields?: string;
};

/**
 * Get place details by place ID using the Google Places API.
 */
export async function getPlaceDetailsById(
  props: TGetPlaceDetailsProps
): Promise<google.maps.places.PlaceResult> {
  const {
    baseUrl,
    placeId,
    fields = 'formatted_address,address_component',
  } = props;

  const response = await axios.get(
    `${baseUrl}/proxy/maps/api/place/details/json`,
    {
      params: { place_id: placeId, fields },
      withCredentials: true,
    }
  );

  return response.data.result;
}
