import { SingleSelect } from '@monorepo/expo/shared/ui-components';
import { View, ViewStyle } from 'react-native';
import { useOrgTeams } from '../../../hooks';
import { useSnackbar } from '../../../hooks';
import { useUserTeamPreference } from '../../../state';

type TProps = {
  style?: ViewStyle;
  disabled?: boolean;
};

export function UserTeamPreferenceSelect(props: TProps) {
  const { disabled, style } = props;
  const [teamId, setTeamId] = useUserTeamPreference();
  const { showSnackbar } = useSnackbar();
  const { teams } = useOrgTeams();

  const handleTeamSelect = (newTeamId: string | null) => {
    setTeamId(newTeamId);
    showSnackbar({
      message: 'Default team saved.',
      type: 'success',
    });
  };

  return (
    <View style={style}>
      <SingleSelect
        allowSelectNone={true}
        disabled={disabled}
        maxRadioItems={0}
        placeholder="Select team"
        items={teams.map((t) => ({ value: t.id, displayValue: t.name }))}
        selectedValue={teamId ?? undefined}
        onChange={(value) => {
          handleTeamSelect(value);
        }}
      />
    </View>
  );
}
