import { ScheduleTypeChoices } from '../../apollo';
import { TMapBounds } from '../Map';
import { TShelterPropertyFilters } from './types';

type TProps = {
  className?: string;
  nameFilter?: string;
  mapBoundsFilter?: TMapBounds | null;
  openNowScheduleTypesFilter?: ScheduleTypeChoices[] | null;
  propertyFilters?: TShelterPropertyFilters | null;
};

function propertyFiltersAffectQuery(
  propertyFilters?: TShelterPropertyFilters | null
): boolean {
  if (!propertyFilters) {
    return false;
  }

  const { openNowScheduleTypes, ...propertyOnly } = propertyFilters;

  return Object.keys(propertyOnly).length > 0;
}

function formatWithOxfordComma(parts: string[]): string {
  if (parts.length === 1) {
    return parts[0];
  }

  if (parts.length === 2) {
    return `${parts[0]} and ${parts[1]}`;
  }

  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}

export function ResultsSource(props: TProps) {
  const {
    nameFilter,
    mapBoundsFilter,
    openNowScheduleTypesFilter,
    propertyFilters,
    className = '',
  } = props;

  const resultSourceParts: string[] = [];

  if (mapBoundsFilter) {
    resultSourceParts.push('map area');
  }
  if (
    (openNowScheduleTypesFilter && openNowScheduleTypesFilter.length > 0) ||
    propertyFiltersAffectQuery(propertyFilters)
  ) {
    resultSourceParts.push('filters');
  }
  if (nameFilter?.trim()) {
    resultSourceParts.push('name search');
  }

  const resultSource =
    resultSourceParts.length > 0
      ? formatWithOxfordComma(resultSourceParts)
      : 'search area';

  return (
    <div className={className}>
      <span className="text-sm text-neutral">(based on {resultSource})</span>
    </div>
  );
}
