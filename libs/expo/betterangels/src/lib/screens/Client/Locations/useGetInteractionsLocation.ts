import { useEffect, useState } from 'react';
import { Ordering, useNotesQuery } from '../../../apollo';

type TLocation = {
  latitude: number;
  longitude: number;
};

export function useGetInteractionsLocation(id: string) {
  const { data, error } = useNotesQuery({
    variables: {
      pagination: { limit: 1000, offset: 0 },
      order: { interactedAt: Ordering.Desc, id: Ordering.Desc },
      filters: {
        clientProfile: id,
      },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
  const [locations, setLocations] = useState<TLocation[]>();

  useEffect(() => {
    if (data && 'notes' in data) {
      const { results } = data.notes;

      if (results.length > 0) {
        const availableLocations = results
          .filter((note) => !!note.location)
          .map((note) => note.location?.point);
        const converted = availableLocations.map(([longitude, latitude]) => ({
          latitude,
          longitude,
        }));

        setLocations(converted);
      }
    }
  }, [data]);

  if (error) {
    console.error('Error fetching locations:', error);
    return [];
  }

  return locations;
}
