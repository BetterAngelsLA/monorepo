import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Avatar,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { enumDisplaySelahTeam } from '../../static/enumDisplayMapping';
import { NoteSummaryQuery } from './__generated__/NoteSummary.generated';

interface INoteBylineProps {
  createdBy: NoteSummaryQuery['note']['createdBy'];
  organization: NoteSummaryQuery['note']['organization'];
  team: NoteSummaryQuery['note']['team'];
}

export default function NoteByline(props: INoteBylineProps) {
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
        accessibilityLabel={`interaction author's photo`}
        accessibilityHint={`interaction author's photo`}
      />
      <View
        style={{
          flex: 1,
          justifyContent: 'space-between',
          marginBottom: Spacings.xs,
          marginRight: Spacings.md,
        }}
      >
        <TextMedium size="xsm" color={Colors.PRIMARY_EXTRA_DARK}>
          {createdBy.firstName} {createdBy.lastName}
        </TextMedium>
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
