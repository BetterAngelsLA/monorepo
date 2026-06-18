import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Avatar,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { TasksQuery } from '../TaskList/__generated__/Tasks.generated';

type TaskCardCreatedByProps = {
  createdBy: TasksQuery['tasks']['results'][number]['createdBy'];
  currentTeam?: TasksQuery['tasks']['results'][number]['currentTeam'];
  organization?: TasksQuery['tasks']['results'][number]['organization'];
};

export default function TaskCardCreatedBy(props: TaskCardCreatedByProps) {
  const { createdBy, currentTeam, organization } = props;

  return (
    <View
      style={{
        flexDirection: 'row',
        marginBottom: Spacings.sm,
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
