import { getPlaceDetailsById } from '../services';

export default async function selectAutocompletePlace<T>(
  apiUrl: string,
  place: any,
  field: keyof T,
  setPlace: (field: keyof T, value: string) => void,
  resetAutocomplete: (e: any[]) => void
) {
  const placeId = place.place_id;
  try {
    const placeResult = await getPlaceDetailsById(apiUrl, placeId);

    const formattedAddress = placeResult.formatted_address || '';
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
