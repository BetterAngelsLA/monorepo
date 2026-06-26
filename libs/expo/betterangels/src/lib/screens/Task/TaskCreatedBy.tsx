import { Colors } from '@monorepo/expo/shared/static';
import {
  Avatar,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { TaskQuery } from './__generated__/Task.generated';

type TaskCreatedByProps = {
  createdBy: TaskQuery['task']['createdBy'];
  currentTeam?: TaskQuery['task']['currentTeam'];
  organization?: TaskQuery['task']['organization'];
};

export default function TaskCreatedBy(props: TaskCreatedByProps) {
  const { createdBy, currentTeam, organization } = props;

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
          {organization?.name} {currentTeam?.name && ` - ${currentTeam.name}`}
        </TextRegular>
      </View>
    </View>
  );
}
