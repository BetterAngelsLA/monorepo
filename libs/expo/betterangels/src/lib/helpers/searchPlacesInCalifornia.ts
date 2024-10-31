import axios from 'axios';

export default async function searchPlacesInCalifornia(
  apiUrl: string,
  query: string,
  setResponse: (e: any) => void
) {
  const url = `${apiUrl}/proxy/maps/api/place/autocomplete/json`;
  if (query.length < 3) {
    return;
  }

  // geocode for approx center of LA COUNTY
  const center = { lat: 34.04499, lng: -118.251601 };
  const defaultBounds = {
    north: center.lat + 0.1,
    south: center.lat - 0.1,
    east: center.lng + 0.1,
    west: center.lng - 0.1,
  };

  try {
    const response = await axios.get(url, {
      params: {
        bounds: defaultBounds,
        input: query,
        components: 'country:us',
        strictBounds: true,
        withCredentials: true,
      },
    });

    return setResponse(response.data.predictions);
  } catch (err) {
    console.error('Error fetching place data:', err);
  }
}
