import { Filters, TFilterOption } from '@monorepo/expo/shared/ui-components';
import { useMemo } from 'react';
import { ViewStyle } from 'react-native';
import { useUser } from '../../../hooks';
import { FilterClients } from '../FilterClients';
import { FilterHmisClients } from '../FilterHmisClients';
import { FilterOrganizations } from '../FilterOrganizations';
import { FilterStatic } from '../FilterStatic';
import { FilterUsers } from '../FilterUsers';
import {
  modelFilterConfigDefault,
  taskStatusOptions,
  teamOptions,
} from './constants';
import {
  TModelFilterConfig,
  TModelFilterFullConfig,
  TModelFilterType,
  TModelFilters,
} from './types';

type TProps = {
  onChange: (newSelected: TModelFilters) => void;
  selected: TModelFilters;
  style?: ViewStyle;
  currentUserLabel?: string;
  filters?: ReadonlyArray<TModelFilterType | TModelFilterConfig>;
};

export function ModelFilters(props: TProps) {
  const { onChange, selected, currentUserLabel, style, filters } = props;

  const { user } = useUser();

  const filterConfigs = useMemo(() => {
    if (!filters?.length) {
      return [];
    }

    const configs: TModelFilterFullConfig[] = [];

    for (const filter of filters) {
      const filterType = typeof filter === 'string' ? filter : filter.type;

      const defaultConfig = modelFilterConfigDefault[filterType];

      if (!defaultConfig) {
        console.warn(`[ModelFilters]: invalid filterType: [${filterType}]`);

        continue;
      }

      const customOverrides: TModelFilterConfig =
        typeof filter === 'string' ? { type: filterType } : filter;

      configs.push({
        ...defaultConfig,
        ...customOverrides,
        type: filterType,
      });
    }

    return configs;
  }, [filters]);

  function onFilterChange(
    filterType: TModelFilterType,
    selectedOpts: TFilterOption[]
  ) {
    onChange({
      ...selected,
      [filterType]: selectedOpts,
    });
  }

  return (
    <Filters style={style}>
      {filterConfigs.map((config) => {
        const { type, buttonLabel, headerTitle, searchPlaceholder } = config;

        if (type === 'teams') {
          return (
            <FilterStatic
              key="teams"
              title={headerTitle}
              buttonLabel={buttonLabel}
              withLocalFilter
              withSelectAll
              options={teamOptions}
              onChange={(next) => onFilterChange('teams', next)}
              initialSelected={selected.teams}
              searchPlaceholder={searchPlaceholder}
            />
          );
        }

        if (type === 'taskStatus') {
          return (
            <FilterStatic
              key="taskStatus"
              title={headerTitle}
              buttonLabel={buttonLabel}
              withSelectAll
              options={taskStatusOptions}
              onChange={(next) => onFilterChange('taskStatus', next)}
              initialSelected={selected.taskStatus}
            />
          );
        }

        if (type === 'authors') {
          return (
            <FilterUsers
              key="authors"
              title={headerTitle}
              buttonLabel={buttonLabel}
              currentUserId={user?.id}
              currentUserLabel={currentUserLabel}
              onChange={(next) => onFilterChange('authors', next)}
              initialSelected={selected.authors}
              searchPlaceholder={searchPlaceholder}
            />
          );
        }

        if (type === 'organizations') {
          return (
            <FilterOrganizations
              key="organizations"
              title={headerTitle}
              buttonLabel={buttonLabel}
              onChange={(next) => onFilterChange('organizations', next)}
              initialSelected={selected.organizations}
              searchPlaceholder={searchPlaceholder}
            />
          );
        }

        if (type === 'clientProfiles') {
          return (
            <FilterClients
              key="clients"
              title={headerTitle}
              buttonLabel={buttonLabel}
              onChange={(next) => onFilterChange('clientProfiles', next)}
              initialSelected={selected.clientProfiles}
              searchPlaceholder={searchPlaceholder}
            />
          );
        }

        if (type === 'hmisClientProfiles') {
          return (
            <FilterHmisClients
              key="hmisClients"
              title={headerTitle}
              buttonLabel={buttonLabel}
              onChange={(next) => onFilterChange('hmisClientProfiles', next)}
              initialSelected={selected.hmisClientProfiles}
              searchPlaceholder={searchPlaceholder}
            />
          );
        }

        console.warn(`[ModelFilters]: filter not found for type: [${type}]`);

        return null;
      })}
    </Filters>
  );
}
