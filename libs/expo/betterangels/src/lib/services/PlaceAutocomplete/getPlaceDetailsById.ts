import axios from 'axios';

type TPlaceResult = google.maps.places.PlaceResult;

type TGetPlaceDetails = {
  baseUrl: string;
  placeId: string;
};

export async function getPlaceDetailsById(props: TGetPlaceDetails) {
  const { baseUrl, placeId } = props;

  if (!placeId) {
    throw new Error('getPlaceDetailsById: missing placeId');
  }

  const response = await axios.get(
    `${baseUrl}/proxy/maps/api/place/details/json`,
    {
      params: {
        place_id: placeId,
      },
    }
  );

  const result: TPlaceResult = response.data.result;

  const formattedAddress = result.formatted_address || '';

  return formattedAddress.substring(0, formattedAddress.lastIndexOf(','));
}
