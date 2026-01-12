import { SingleSelect } from '@monorepo/expo/shared/ui-components';
import { View, ViewStyle } from 'react-native';
import { SelahTeamEnum } from '../../../apollo';
import { useUserTeamPreference } from '../../../state';
import { enumDisplaySelahTeam } from '../../../static';

type TProps = {
  style?: ViewStyle;
  disabled?: boolean;
};

export function UserTeamPreferenceSelect(props: TProps) {
  const { disabled, style } = props;
  const [team, setTeam] = useUserTeamPreference();

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
          setTeam(value as SelahTeamEnum);
        }}
      />
    </View>
  );
}
