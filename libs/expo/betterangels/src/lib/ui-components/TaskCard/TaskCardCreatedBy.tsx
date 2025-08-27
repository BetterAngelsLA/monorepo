import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Avatar,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { TaskType } from '../../apollo';

type TaskCardCreatedByProps = {
  createdBy: TaskType['createdBy'];
  team?: TaskType['team'];
};

export default function TaskCardCreatedBy(props: TaskCardCreatedByProps) {
  const { createdBy, team } = props;

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
          {createdBy?.organizationsOrganization?.[0]?.name}{' '}
          {team && ` - ${team}`}
        </TextRegular>
      </View>
    </View>
  );
}
