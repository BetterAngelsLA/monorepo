import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Avatar,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { NoteType } from '../../apollo';
import { enumDisplaySelahTeam } from '../../static/enumDisplayMapping';

interface INoteCardBylineProps {
  createdBy: NoteType['createdBy'];
  organization: NoteType['organization'];
  team: NoteType['team'];
}

export default function NoteCardByline(props: INoteCardBylineProps) {
  const { createdBy, organization, team } = props;
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacings.xs,
      }}
    >
      <Avatar
        mr="xs"
        size="sm"
        accessibilityLabel={createdBy?.email || 'unknown user'}
        accessibilityHint={
          `${createdBy.email} user's avatar` || `user's avatar`
        }
      />
      <View
        style={{
          flex: 1,
          justifyContent: 'space-between',
          marginBottom: Spacings.xs,
          marginRight: Spacings.md,
        }}
      >
        <TextBold size="xsm" color={Colors.PRIMARY_EXTRA_DARK}>
          {createdBy.firstName} {createdBy.lastName}
        </TextBold>
        <TextRegular size="xs" color={Colors.PRIMARY_EXTRA_DARK}>
          {organization.name}
          {team && (
            <TextRegular size="xs">
              {' - '}
              {enumDisplaySelahTeam[team]}
            </TextRegular>
          )}
        </TextRegular>
      </View>
    </View>
  );
}
