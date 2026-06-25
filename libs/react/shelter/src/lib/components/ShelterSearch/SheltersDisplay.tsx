import { useQuery } from '@apollo/client/react';
import { InfiniteList } from '@monorepo/react/components';
import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { MaxStayInput } from '../../apollo';
import {
  shelterSearchTriggerAtom,
  shelterNameSearchAtom,
  sheltersAtom,
} from '../../atoms';
import {
  ViewSheltersDocument,
  ViewSheltersQuery,
  ViewSheltersQueryVariables,
} from '../../pages';
import { TLatLng, TMapBounds } from '../Map';
import { ShelterCard, TShelter } from '../ShelterCard';
import { ResultsSource } from './ResultsSource';
import { TShelterPropertyFilters } from './types';

type TViewShelter = ViewSheltersQuery['shelters']['results'][number];

function viewShelterToCardShelter(shelter: TViewShelter): TShelter {
  return {
    id: shelter.id,
    name: shelter.name,
    distanceInMiles: shelter.distanceInMiles,
    isPrivate: shelter.isPrivate,
    location: shelter.location,
    shelterTypes: shelter.shelterTypes,
    heroImage: shelter.heroImage?.url ?? null,
  };
}
type TProps = {
  className?: string;
  mapBoundsFilter?: TMapBounds | null;
  propertyFilters?: TShelterPropertyFilters;
  /** Incremented on each name search submit; used to fit the map after fresh query results. */
  nameSearchPinFitRequestId?: number;
  onShelterPinsReadyForMapFit?: (pinLocations: TLatLng[]) => void;
};

export function SheltersDisplay(props: TProps) {
  const {
    mapBoundsFilter,
    propertyFilters,
    className = '',
    nameSearchPinFitRequestId = 0,
    onShelterPinsReadyForMapFit,
  } = props;
  const [_sheltersData, setSheltersData] = useAtom(sheltersAtom);
  const [searchTrigger] = useAtom(shelterSearchTriggerAtom);
  const nameSearch = useAtomValue(shelterNameSearchAtom);

  const queryVariables = useMemo<ViewSheltersQueryVariables | undefined>(() => {
    let vars: ViewSheltersQueryVariables | undefined;

    if (mapBoundsFilter) {
      vars = vars || {};
      vars.filters = vars.filters || {};

      vars.filters.mapBounds = mapBoundsFilter;
    }

    if (propertyFilters) {
      const { openNow, openNowScheduleTypes, isAccessCenter, maxStay, ...propertyOnlyFilters } =
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

      if (isMaxStayFilterSpecified(maxStay)) {
        vars = vars || {};
        vars.filters = vars.filters || {};
        vars.filters.maxStay = maxStayToGraphQLInput(maxStay);
      }

      const prunedFilters = pruneFilters(propertyOnlyFilters);

      if (prunedFilters) {
        vars = vars || {};
        vars.filters = vars.filters || {};

        vars.filters.properties = prunedFilters;
      }
    }

    if (nameSearch) {
      vars = vars || {};
      vars.filters = vars.filters || {};
      vars.filters.name = nameSearch;
    }

    return vars;
  }, [mapBoundsFilter, nameSearch, propertyFilters]);

  // Freeze query variables at the moment searchTrigger changes so that
  // intermediate filter-state updates (e.g. name search set before the map
  // settles) never fire a premature query.
  const lastTriggerRef = useRef(-1);
  const activeVarsRef = useRef<ViewSheltersQueryVariables | undefined>(undefined);

  if (searchTrigger !== lastTriggerRef.current) {
    lastTriggerRef.current = searchTrigger;
    activeVarsRef.current = queryVariables;
  }

  const { data, loading, error } = useQuery<
    ViewSheltersQuery,
    ViewSheltersQueryVariables
  >(ViewSheltersDocument, {
    variables: {
      ...activeVarsRef.current,
      pagination: { limit: 5000, offset: 0 },
    },
    skip: !activeVarsRef.current,
  });

  const shelters = useMemo(() => data?.shelters.results ?? [], [data]);
  const sheltersForList = useMemo(
    () => shelters.map(viewShelterToCardShelter),
    [shelters]
  );
  const total = data?.shelters.totalCount;

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
      onShelterPinsReadyForMapFit(shelterListToPinLatLng(sheltersForList));
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
    sheltersForList,
    onShelterPinsReadyForMapFit,
  ]);

  useEffect(() => {
    setSheltersData(sheltersForList);
  }, [sheltersForList, setSheltersData]);

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
            nameFilter={nameSearch}
            mapBoundsFilter={mapBoundsFilter}
            openNowFilter={propertyFilters?.openNow}
            propertyFilters={pruneFilters(propertyFilters)}
          />
        </div>
      );
    },
    [nameSearch, mapBoundsFilter, propertyFilters]
  );

  return (
    <div className={className}>
      <InfiniteList<TShelter>
        data={sheltersForList}
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

function isMaxStayFilterSpecified(
  maxStay: TShelterPropertyFilters['maxStay']
): maxStay is NonNullable<TShelterPropertyFilters['maxStay']> {
  if (maxStay == null) {
    return false;
  }

  return maxStay.days > 0 || maxStay.includeNull;
}

function maxStayToGraphQLInput(
  maxStay: NonNullable<TShelterPropertyFilters['maxStay']>
): MaxStayInput {
  return {
    days: maxStay.days,
    includeNull: maxStay.includeNull,
  };
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
