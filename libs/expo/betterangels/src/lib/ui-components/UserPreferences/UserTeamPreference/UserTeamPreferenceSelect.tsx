import { SingleSelect } from '@monorepo/expo/shared/ui-components';
import { View, ViewStyle } from 'react-native';
import { SelahTeamEnum } from '../../../apollo';
import { useSnackbar } from '../../../hooks';
import { useUserTeamPreference } from '../../../state';
import { enumDisplaySelahTeam } from '../../../static';

type TProps = {
  style?: ViewStyle;
  disabled?: boolean;
};

export function UserTeamPreferenceSelect(props: TProps) {
  const { disabled, style } = props;
  const [team, setTeam] = useUserTeamPreference();
  const { showSnackbar } = useSnackbar();

  const handleTeamSelect = (newTeam: SelahTeamEnum) => {
    setTeam(newTeam);
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
        items={Object.entries(enumDisplaySelahTeam).map(
          ([value, displayValue]) => ({ value, displayValue })
        )}
        selectedValue={team ?? undefined}
        onChange={(value) => {
          handleTeamSelect(value as SelahTeamEnum);
        }}
      />
    </View>
  );
}
