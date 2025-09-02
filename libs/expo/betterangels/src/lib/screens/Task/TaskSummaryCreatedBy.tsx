import { Colors } from '@monorepo/expo/shared/static';
import {
  Avatar,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { enumDisplaySelahTeam } from '../../static';
import { TaskSummaryQuery } from './__generated__/TaskSummary.generated';

type TaskSummaryCreatedByProps = {
  createdBy: TaskSummaryQuery['task']['createdBy'];
  team?: TaskSummaryQuery['task']['team'];
  organization?: TaskSummaryQuery['task']['organization'];
};

export default function TaskSummaryCreatedBy(props: TaskSummaryCreatedByProps) {
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
