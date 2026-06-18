import { useQuery } from '@apollo/client/react';
import { SingleSelect } from '@monorepo/expo/shared/ui-components';
import { View, ViewStyle } from 'react-native';
import { useSnackbar } from '../../../hooks';
import { useUserTeamPreference } from '../../../state';
import { TeamsDocument, TeamsQuery } from './__generated__/teams.generated';

type TProps = {
  style?: ViewStyle;
  disabled?: boolean;
};

export function UserTeamPreferenceSelect(props: TProps) {
  const { disabled, style } = props;
  const [teamId, setTeamId] = useUserTeamPreference();
  const { showSnackbar } = useSnackbar();
  const { data } = useQuery<TeamsQuery>(TeamsDocument);

  const teams = data?.teams ?? [];

  const handleTeamSelect = (newTeamId: string) => {
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
        placeholder="Select team"
        items={teams.map((t) => ({ value: t.id, displayValue: t.name }))}
        selectedValue={teamId ?? undefined}
        onChange={(value) => {
          handleTeamSelect(value as string);
        }}
      />
    </View>
  );
}
