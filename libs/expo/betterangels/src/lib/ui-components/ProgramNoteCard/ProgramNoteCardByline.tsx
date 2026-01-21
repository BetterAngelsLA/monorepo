import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Avatar,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { UserType } from '../../apollo';

interface IProgramNoteCardBylineProps {
  createdBy?: UserType | null;
}

export default function ProgramNoteCardByline(
  props: IProgramNoteCardBylineProps
) {
  const { createdBy } = props;

  const authorName = createdBy
    ? `${createdBy.firstName} ${createdBy.lastName}`
    : 'Unknown User';

  const authorOrganization = createdBy?.organizationsOrganization?.[0];

  return (
    <View
      style={{
        flexDirection: 'row',
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
          {authorName}
        </TextMedium>
        {authorOrganization && (
          <TextRegular size="xs" color={Colors.PRIMARY_EXTRA_DARK}>
            {authorOrganization.name}
          </TextRegular>
        )}
      </View>
    </View>
  );
}
