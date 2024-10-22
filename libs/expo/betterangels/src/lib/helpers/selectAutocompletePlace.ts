import axios from 'axios';

export default async function selectAutocompletePlace<T>(
  apiUrl: string,
  place: any,
  field: keyof T,
  setPlace: (field: keyof T, value: string) => void,
  resetAutocomplete: (e: any[]) => void
) {
  const placeId = place.place_id;
  try {
    const response = await axios.get(
      `${apiUrl}/proxy/maps/api/place/details/json`,
      {
        params: {
          place_id: placeId,
        },
      }
    );
    const formattedAddress = response.data.result.formatted_address;
    const cleanedAddress = formattedAddress.substring(
      0,
      formattedAddress.lastIndexOf(',')
    );
    setPlace(field, cleanedAddress);
    resetAutocomplete([]);
  } catch (e) {
    console.log('Error fetching detailed place');
  }
}
