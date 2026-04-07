import { useInfiniteScrollQuery } from '@monorepo/apollo';
import { InfiniteList } from '@monorepo/react/components';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { sheltersAtom } from '../../atoms';
import {
  ViewSheltersDocument,
  ViewSheltersQuery,
  ViewSheltersQueryVariables,
} from '../../pages';
import { TLatLng, TMapBounds } from '../Map';
import { ShelterCard } from '../ShelterCard';
import { ResultsSource } from './ResultsSource';
import { TShelterPropertyFilters } from './types';

type TShelter = ViewSheltersQuery['shelters']['results'][number];
type TProps = {
  className?: string;
  mapBoundsFilter?: TMapBounds | null;
  propertyFilters?: TShelterPropertyFilters;
  nameFilter?: string;
  /** Incremented on each name search submit; used to fit the map after fresh query results. */
  nameSearchPinFitRequestId?: number;
  onShelterPinsReadyForMapFit?: (pinLocations: TLatLng[]) => void;
};

export function SheltersDisplay(props: TProps) {
  const {
    mapBoundsFilter,
    propertyFilters,
    className = '',
    nameFilter,
    nameSearchPinFitRequestId = 0,
    onShelterPinsReadyForMapFit,
  } = props;
  const [_sheltersData, setSheltersData] = useAtom(sheltersAtom);

  const queryVariables = useMemo<ViewSheltersQueryVariables | undefined>(() => {
    let vars: ViewSheltersQueryVariables | undefined;

    if (mapBoundsFilter) {
      vars = vars || {};
      vars.filters = vars.filters || {};

      vars.filters.mapBounds = mapBoundsFilter;
    }

    if (propertyFilters) {
      const { openNow, isAccessCenter, ...propertyOnlyFilters } =
        propertyFilters;

      if (openNow) {
        vars = vars || {};
        vars.filters = vars.filters || {};
        vars.filters.openNow = true;
      }

      if (isAccessCenter) {
        vars = vars || {};
        vars.filters = vars.filters || {};
        vars.filters.isAccessCenter = true;
      }

      const prunedFilters = pruneFilters(propertyOnlyFilters);

      if (prunedFilters) {
        vars = vars || {};
        vars.filters = vars.filters || {};

        vars.filters.properties = prunedFilters;
      }
    }

    if (nameFilter) {
      vars = vars || {};
      vars.filters = vars.filters || {};
      vars.filters.name = nameFilter;
    }

    return vars;
  }, [mapBoundsFilter, nameFilter, propertyFilters]);

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
  }, [loading, nameSearchPinFitRequestId, items, onShelterPinsReadyForMapFit]);

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
          <ResultsSource
            nameFilter={nameFilter}
            mapBoundsFilter={mapBoundsFilter}
            openNowFilter={propertyFilters?.openNow}
            propertyFilters={pruneFilters(propertyFilters)}
          />
        </div>
      );
    },
    [queryVariables?.filters]
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

  return Object.keys(result).length > 0 ? result : null;
}
