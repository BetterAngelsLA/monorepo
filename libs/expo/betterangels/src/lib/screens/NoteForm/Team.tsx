import { useQuery } from '@apollo/client/react';
import { Spacings } from '@monorepo/expo/shared/static';
import { Picker } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { TeamsDocument, TeamsQuery } from '../../ui-components/UserPreferences/UserTeamPreference/__generated__/teams.generated';

interface ITeamProps {
  teamId?: string | null;
  onTeamChange: (value: string | null) => void;
}

export default function Team(props: ITeamProps) {
  const { teamId, onTeamChange } = props;
  const { data } = useQuery<TeamsQuery>(TeamsDocument);
  const teams = data?.teams?.results ?? [];

  return (
    <View style={{ marginBottom: Spacings.xs }}>
      <Picker
        allowSelectNone
        placeholder="Select Team"
        selectedValue={teamId ?? undefined}
        items={teams.map((t) => ({ value: t.id, displayValue: t.name }))}
        onChange={(t) => onTeamChange((t as string) || null)}
      />
    </View>
  );
}
