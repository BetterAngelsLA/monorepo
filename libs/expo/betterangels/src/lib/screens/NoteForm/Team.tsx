import { formatTeamDisplayName } from '@monorepo/ba-platform';
import { Spacings } from '@monorepo/expo/shared/static';
import { Picker } from '@monorepo/expo/shared/ui-components';
import { useMemo } from 'react';
import { View } from 'react-native';
import { useOrgTeams } from '../../hooks';

interface ITeamProps {
  teamId?: string | null;
  onTeamChange: (value: string | null) => void;
}

export default function Team(props: ITeamProps) {
  const { teamId, onTeamChange } = props;
  const { teams } = useOrgTeams();
  const initialTeamId = useMemo(() => teamId, []);

  return (
    <View style={{ marginBottom: Spacings.xs }}>
      <Picker
        allowSelectNone
        placeholder="Select Team"
        selectedValue={teamId ?? undefined}
        items={teams
          .filter((t) => t.isActive || t.id === initialTeamId)
          .map((t) => ({
            value: t.id,
            displayValue: formatTeamDisplayName(t),
          }))}
        onChange={(t) => onTeamChange((t as string) || null)}
      />
    </View>
  );
}
