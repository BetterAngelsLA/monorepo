import { useQuery } from '@apollo/client/react';
import {
  Filters,
  MultiSelect_V2,
  TFilterOption,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useMemo, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import {
  TeamsDocument,
  TeamsQuery,
} from '../../UserPreferences/UserTeamPreference/__generated__/teams.generated';

export type TProps = {
  onCommit: (selected: TFilterOption[]) => void;
  initialSelected: TFilterOption[];
  title?: string;
  searchPlaceholder?: string;
  style?: StyleProp<ViewStyle>;
};

export function FilterTeamsOptions(props: TProps) {
  const { onCommit, initialSelected = [], searchPlaceholder } = props;
  const [localSelected, setLocalSelected] =
    useState<TFilterOption[]>(initialSelected);

  const { data, error } = useQuery<TeamsQuery>(TeamsDocument);

  const options = useMemo<TFilterOption[]>(() => {
    const teams = data?.teams?.results ?? [];
    return teams
      .filter((t) => t.isActive)
      .map((t) => ({
        id: t.id,
        label: t.name,
      }));
  }, [data]);

  if (error) {
    console.error(error);
    return <TextRegular>Failed to load teams</TextRegular>;
  }

  const handleDone = () => {
    onCommit(localSelected);
  };

  return (
    <Filters.Screen onDone={handleDone} onClear={() => setLocalSelected([])}>
      <MultiSelect_V2<TFilterOption>
        options={options}
        selected={localSelected}
        onChange={setLocalSelected}
        valueKey="id"
        labelKey="label"
        searchPlaceholder={searchPlaceholder || 'Search teams'}
      />
    </Filters.Screen>
  );
}
