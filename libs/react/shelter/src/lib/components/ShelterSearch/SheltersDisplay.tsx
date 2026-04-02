import { useQuery } from '@apollo/client/react';
import { InfiniteList } from '@monorepo/react/components';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useMemo } from 'react';
import { TLocationSource, sheltersAtom } from '../../atoms';
import {
  ViewSheltersDocument,
  ViewSheltersQuery,
  ViewSheltersQueryVariables,
} from '../../pages';
import { TLatLng, TMapBounds } from '../Map';
import { ShelterCard } from '../ShelterCard';
import { SearchSource } from './SearchSource';
import { TShelterPropertyFilters } from './types';

type TShelter = ViewSheltersQuery['shelters']['results'][number];

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
  const [_sheltersData, setSheltersData] = useAtom(sheltersAtom);

  let queryVariables: ViewSheltersQueryVariables | undefined;

  if (coordinates) {
    const { latitude, longitude } = coordinates;

    queryVariables = queryVariables || {};
    queryVariables.filters = queryVariables.filters || {};

    queryVariables.filters.geolocation = {
      latitude,
      longitude,
      // Only apply range limit when there's no map bounds filter;
      // map bounds already constrains the spatial area.
      ...(mapBoundsFilter ? {} : { rangeInMiles }),
    };
  }

  if (mapBoundsFilter) {
    queryVariables = queryVariables || {};
    queryVariables.filters = queryVariables.filters || {};

    queryVariables.filters.mapBounds = mapBoundsFilter;
  }

  if (propertyFilters) {
    const { openNow, ...propertyOnlyFilters } = propertyFilters;

    if (openNow) {
      queryVariables = queryVariables || {};
      queryVariables.filters = queryVariables.filters || {};
      queryVariables.filters.openNow = true;
    }

    const prunedFilters = pruneFilters(propertyOnlyFilters);

    if (prunedFilters) {
      queryVariables = queryVariables || {};
      queryVariables.filters = queryVariables.filters || {};

      queryVariables.filters.properties = prunedFilters;
    }
  }

  const { data, loading, error } = useQuery<
    ViewSheltersQuery,
    ViewSheltersQueryVariables
  >(ViewSheltersDocument, {
    variables: {
      ...queryVariables,
      pagination: { limit: 5000, offset: 0 },
    },
    skip: !queryVariables,
  });

  const shelters = useMemo(() => data?.shelters.results ?? [], [data]);
  const total = data?.shelters.totalCount;

  useEffect(() => {
    setSheltersData(shelters);
  }, [shelters, setSheltersData]);

  const renderListHeader = useCallback(
    (visible: number, total: number | undefined) => {
      const locationsPluralized = visible === 1 ? 'location' : 'locations';

      const text =
        total === undefined
          ? `${visible} ${locationsPluralized}`
          : `${visible} of ${total} locations`;

      return (
        <div className="mb-4">
          <div className="text-xl font-semibold">{text}</div>
          <SearchSource coordinatesSource={coordinatesSource} />
        </div>
      );
    },
    [coordinatesSource]
  );

  return (
    <div className={className}>
      <InfiniteList<TShelter>
        data={shelters}
        totalItems={total}
        loading={loading}
        error={error}
        hasMore={false}
        itemGap={24}
        renderResultsHeader={renderListHeader}
        renderItem={(shelter) => <ShelterCard shelter={shelter} />}
        renderDivider={() => <div className="h-px bg-neutral-90 mt-6 -mx-4" />}
        keyExtractor={(shelter) => shelter.id}
      />
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
