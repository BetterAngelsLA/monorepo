import { useLazyQuery } from '@apollo/client/react';
import {
  DemographicChoices,
  ParkingChoices,
  PetChoices,
  RoomStyleChoices,
  ShelterChoices,
  SpecialSituationRestrictionChoices,
  ViewSheltersDocument,
  ViewSheltersQueryVariables,
} from '@monorepo/react/shelter';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { TLocationSource } from '../../atoms/locationAtom';
import { sheltersAtom } from '../../atoms/sheltersAtom';
import { TLatLng, TMapBounds } from '../map/types.maps';
import { SearchSource } from './searchSource';
import { ShelterList } from './shelterList';

export type TShelterPropertyFilters = {
  demographics?: DemographicChoices[] | null;
  parking?: ParkingChoices[] | null;
  pets?: PetChoices[] | null;
  roomStyles?: RoomStyleChoices[] | null;
  shelterTypes?: ShelterChoices[] | null;
  specialSituationRestrictions?: SpecialSituationRestrictionChoices[] | null;
};

const SEARCH_RANGE_MILES = 20;

type TProps = {
  className?: string;
  coordinates?: TLatLng | null;
  coordinatesSource?: TLocationSource;
  mapBoundsFilter?: TMapBounds | null;
  propertyFilters?: TShelterPropertyFilters;
  rangeInMiles?: number;
};

export function SheltersDisplay(props: TProps) {
  const {
    coordinates,
    coordinatesSource,
    mapBoundsFilter,
    propertyFilters,
    rangeInMiles = SEARCH_RANGE_MILES,
    className = '',
  } = props;
  const [getShelters, { loading, data, error }] =
    useLazyQuery(ViewSheltersDocument);

  // Temporary suppression to allow incremental cleanup without regressions.
  // ⚠️ If you're modifying this file, please remove this ignore and fix the issue.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_sheltersData, setSheltersData] = useAtom(sheltersAtom);

  useEffect(() => {
    let queryVariables: ViewSheltersQueryVariables | undefined;

    if (coordinates) {
      const { latitude, longitude } = coordinates;

      queryVariables = queryVariables || {};
      queryVariables.filters = queryVariables.filters || {};

      queryVariables.filters.geolocation = {
        latitude,
        longitude,
        rangeInMiles,
      };
    }

    if (mapBoundsFilter) {
      queryVariables = queryVariables || {};
      queryVariables.filters = queryVariables.filters || {};

      queryVariables.filters.mapBounds = mapBoundsFilter;
    }

    if (propertyFilters) {
      const prunedFilters = pruneFilters(propertyFilters);

      if (prunedFilters) {
        queryVariables = queryVariables || {};
        queryVariables.filters = queryVariables.filters || {};

        queryVariables.filters.properties = prunedFilters;
      }
    }

    if (!queryVariables) {
      return;
    }

    getShelters({ variables: queryVariables });
  }, [coordinates, mapBoundsFilter, propertyFilters]);

  const shelters = data?.shelters?.results;

  useEffect(() => {
    setSheltersData(shelters || []);
  }, [shelters]);

  if (loading) return <div className="mt-4">Loading...</div>;

  if (error) {
    console.error(`[SheltersDisplay] ${error}`);

    return (
      <div className="mt-4">
        Sorry, there was an issue fetching the data. Please try again.
      </div>
    );
  }

  if (!shelters) {
    return null;
  }

  return (
    <div className={className}>
      <div>
        <div className="text-xl font-semibold">{shelters.length} locations</div>
        <SearchSource coordinatesSource={coordinatesSource} />
      </div>

      <ShelterList className="mt-4" shelters={shelters} />
    </div>
  );
}

function pruneFilters(
  filters?: TShelterPropertyFilters | null
): TShelterPropertyFilters | null {
  if (!filters) {
    return null;
  }

  const result = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => {
      return value != null && (!Array.isArray(value) || value.length > 0);
    })
  );

  return result;
}
