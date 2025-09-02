import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Avatar,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { enumDisplaySelahTeam } from '../../static';
import { TasksQuery } from '../TaskList/__generated__/Tasks.generated';

type TaskCardCreatedByProps = {
  createdBy: TasksQuery['tasks']['results'][number]['createdBy'];
  team?: TasksQuery['tasks']['results'][number]['team'];
  organization?: TasksQuery['tasks']['results'][number]['organization'];
};

export default function TaskCardCreatedBy(props: TaskCardCreatedByProps) {
  const { createdBy, team, organization } = props;

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
        accessibilityLabel={`creater's profile photo`}
        accessibilityHint={`creater's profile photo`}
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
