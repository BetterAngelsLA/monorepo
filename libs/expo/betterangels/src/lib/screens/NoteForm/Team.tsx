import { Spacings } from '@monorepo/expo/shared/static';
import { Picker } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { SelahTeamEnum } from '../../apollo';
import { enumDisplaySelahTeam } from '../../static';

interface ITeamProps {
  team?: SelahTeamEnum | null;
  onTeamChange: (value: SelahTeamEnum | null) => void;
}

export default function Team(props: ITeamProps) {
  const { team, onTeamChange } = props;

  return (
    <View style={{ marginBottom: Spacings.xs }}>
      <Picker
        allowSelectNone
        placeholder="Select Team"
        selectedValue={team}
        items={Object.entries(enumDisplaySelahTeam).map(
          ([value, displayValue]) => ({ value, displayValue })
        )}
        onChange={(t) => onTeamChange(t as SelahTeamEnum | null)}
      />
    </View>
  );
}
