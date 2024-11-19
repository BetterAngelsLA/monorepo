import axios from 'axios';

type TGetPlaceDetails = {
  baseUrl: string;
  placeId: string;
  fields?: string;
  withCredentials?: boolean;
};

export async function getPlaceDetailsById(props: TGetPlaceDetails) {
  const { baseUrl, fields, placeId, withCredentials } = props;

  if (!placeId) {
    throw new Error('getPlaceDetailsById: missing placeId');
  }

  const response = await axios.get(
    `${baseUrl}/proxy/maps/api/place/details/json`,
    {
      params: {
        place_id: placeId,
        fields,
        withCredentials,
      },
    }
  );

  return response.data.result as google.maps.places.PlaceResult;
}
