import { useInfiniteScrollQuery } from '@monorepo/apollo';
import { InfiniteList } from '@monorepo/react/components';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
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
  nameFilter?: string;
  /** Incremented on each name search submit; used to fit the map after fresh query results. */
  nameSearchPinFitRequestId?: number;
  onShelterPinsReadyForMapFit?: (pinLocations: TLatLng[]) => void;
};

export function SheltersDisplay(props: TProps) {
  const {
    coordinates,
    coordinatesSource,
    mapBoundsFilter,
    propertyFilters,
    rangeInMiles = SEARCH_RANGE_MILES,
    className = '',
    nameFilter,
    nameSearchPinFitRequestId = 0,
    onShelterPinsReadyForMapFit,
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

  if (nameFilter) {
    queryVariables = queryVariables || {};
    queryVariables.filters = queryVariables.filters || {};
    queryVariables.filters.name = nameFilter;
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

  const prevLoadingRef = useRef(loading);
  const lastPinFitRequestHandledRef = useRef(0);

  useEffect(() => {
    if (!onShelterPinsReadyForMapFit || nameSearchPinFitRequestId <= 0) {
      prevLoadingRef.current = loading;
      return;
    }

    if (loading) {
      prevLoadingRef.current = loading;
      return;
    }

    const prev = prevLoadingRef.current;
    prevLoadingRef.current = loading;

    if (lastPinFitRequestHandledRef.current === nameSearchPinFitRequestId) {
      return;
    }

    const loadingJustFinished = prev === true;

    const emit = () => {
      if (lastPinFitRequestHandledRef.current === nameSearchPinFitRequestId) {
        return;
      }
      lastPinFitRequestHandledRef.current = nameSearchPinFitRequestId;
      onShelterPinsReadyForMapFit(shelterListToPinLatLng(items ?? []));
    };

    if (loadingJustFinished) {
      emit();
      return;
    }

    const raf = requestAnimationFrame(() => {
      emit();
    });

    return () => cancelAnimationFrame(raf);
  }, [
    loading,
    nameSearchPinFitRequestId,
    items,
    onShelterPinsReadyForMapFit,
  ]);

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

function shelterListToPinLatLng(shelters: TShelter[]): TLatLng[] {
  const pins: TLatLng[] = [];

  for (const shelter of shelters) {
    const loc = shelter.location;

    if (loc == null) {
      continue;
    }

    pins.push({ latitude: loc.latitude, longitude: loc.longitude });
  }

  return pins;
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
