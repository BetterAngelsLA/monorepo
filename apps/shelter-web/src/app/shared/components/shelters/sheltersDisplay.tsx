import { useInfiniteScrollQuery } from '@monorepo/apollo';
import { InfiniteList } from '@monorepo/react/components';
import {
  DemographicChoices,
  ParkingChoices,
  PetChoices,
  RoomStyleChoices,
  ShelterChoices,
  SpecialSituationRestrictionChoices,
  ViewSheltersDocument,
  ViewSheltersQuery,
  ViewSheltersQueryVariables,
} from '@monorepo/react/shelter';
import { useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';
import { TLocationSource } from '../../atoms/locationAtom';
import { sheltersAtom } from '../../atoms/sheltersAtom';
import { TLatLng, TMapBounds } from '@monorepo/react/components';
import { ShelterCard } from '../shelter/shelterCard';
import { SearchSource } from './searchSource';

type TShelter = ViewSheltersQuery['shelters']['results'][number];

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
  const [_sheltersData, setSheltersData] = useAtom(sheltersAtom);

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

  const { items, total, loadMore, loading, loadingMore, hasMore, error } =
    useInfiniteScrollQuery<
      TShelter,
      ViewSheltersQuery,
      ViewSheltersQueryVariables
    >({
      document: ViewSheltersDocument,
      queryFieldName: 'shelters',
      variables: queryVariables,
      pageSize: 25,
    });

  useEffect(() => {
    setSheltersData(items || []);
  }, [items, setSheltersData]);

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
        data={items}
        totalItems={total}
        loading={loading}
        loadingMore={loadingMore}
        error={error}
        hasMore={hasMore}
        loadMore={loadMore}
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
