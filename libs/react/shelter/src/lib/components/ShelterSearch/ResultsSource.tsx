import { ViewSheltersQueryVariables } from '../../pages';
import { TShelterPropertyFilters } from './types';
type TProps = {
  className?: string;
  queryFilters?: ViewSheltersQueryVariables['filters'];
};

export function ResultsSource(props: TProps) {
  const { queryFilters, className = '' } = props;

  const resultSourceParts: string[] = [];

  if (queryFilters?.mapBounds) {
    resultSourceParts.push('map area');
  }
  if (
    propertyFiltersAffectQuery(
      queryFilters?.properties as TShelterPropertyFilters | undefined
    )
  ) {
    resultSourceParts.push('filters');
  }
  if (queryFilters?.name?.trim()) {
    resultSourceParts.push('name search');
  }

  const resultSource =
    resultSourceParts.length > 0
      ? formatEnglishAnd(resultSourceParts)
      : 'search area';

  function propertyFiltersAffectQuery(
    propertyFilters?: TShelterPropertyFilters
  ): boolean {
    if (!propertyFilters) {
      return false;
    }

    if (propertyFilters.openNow) {
      return true;
    }

    const { openNow: _openNow, ...propertyOnly } = propertyFilters;

    return Object.keys(propertyOnly).length > 0;
  }

  function formatEnglishAnd(parts: string[]): string {
    if (parts.length === 1) {
      return parts[0];
    }

    if (parts.length === 2) {
      return `${parts[0]} and ${parts[1]}`;
    }

    return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
  }

  return (
    <div className={className}>
      <span className="text-sm text-neutral">(based on {resultSource})</span>
    </div>
  );
}
