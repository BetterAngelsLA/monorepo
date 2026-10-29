import {
  Filters,
  MultiSelect_V2,
  TFilterOption,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useMemo, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useOrgTeams } from '../../../hooks';

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

  const { teams, error, isIdle } = useOrgTeams();

  const options = useMemo<TFilterOption[]>(() => {
    return teams.map((t) => ({
      id: t.id,
      label: t.name,
    }));
  }, [teams]);

  // No active organization to list teams for: an empty picker would read as
  // "this org has no teams", which is a different problem with a different fix.
  if (isIdle) {
    return <TextRegular>Select an organization to filter by team.</TextRegular>;
  }

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
