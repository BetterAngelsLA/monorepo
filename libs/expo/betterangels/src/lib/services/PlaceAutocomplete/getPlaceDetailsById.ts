import axios from 'axios';

/**
 * Get place details by place ID using the Google Places API.
 */
export async function getPlaceDetailsById(
  baseUrl: string,
  placeId: string,
  fields = 'formatted_address,address_component'
): Promise<google.maps.places.PlaceResult> {
  const response = await axios.get(
    `${baseUrl}/proxy/maps/api/place/details/json`,
    {
      params: { place_id: placeId, fields },
      withCredentials: true,
    }
  );

  return response.data.result;
}
