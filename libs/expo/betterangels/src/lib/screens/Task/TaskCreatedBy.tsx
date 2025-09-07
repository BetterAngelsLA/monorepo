import { Colors } from '@monorepo/expo/shared/static';
import {
  Avatar,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { enumDisplaySelahTeam } from '../../static';
import { TaskQuery } from './__generated__/Task.generated';

type TaskCreatedByProps = {
  createdBy: TaskQuery['task']['createdBy'];
  team?: TaskQuery['task']['team'];
  organization?: TaskQuery['task']['organization'];
};

export default function TaskCreatedBy(props: TaskCreatedByProps) {
  const { createdBy, team, organization } = props;

  return (
    <View
      style={{
        flexDirection: 'row',
      }}
    >
      <Avatar
        mr="xs"
        size="sm"
        accessibilityLabel={`creator's profile photo`}
        accessibilityHint={`creator's profile photo`}
        imageUrl={''}
      />
      <View>
        <TextBold size="sm" color={Colors.PRIMARY_EXTRA_DARK}>
          {createdBy?.firstName} {createdBy?.lastName}
        </TextBold>
        <TextRegular size="sm">
          {organization?.name} {team && ` - ${enumDisplaySelahTeam[team]}`}
        </TextRegular>
      </View>
    </View>
  );
}
