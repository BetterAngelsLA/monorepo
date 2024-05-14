import { MoreIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Avatar,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';

interface IClientHeaderProps {
  firstName: string | null | undefined;
  lastName: string | null | undefined;
}

export default function ClientHeader(props: IClientHeaderProps) {
  const { firstName, lastName } = props;
  return (
    <View
      style={{
        paddingHorizontal: Spacings.sm,
        backgroundColor: Colors.WHITE,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacings.md,
      }}
    >
      <View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: Spacings.sm,
          }}
        >
          <Avatar
            mr="xs"
            size="lg"
            accessibilityLabel={`${firstName} ${lastName} avatar`}
            accessibilityHint={'clients avatar'}
          />
          <TextMedium size="lg">
            {firstName} {lastName}
          </TextMedium>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextRegular mr="sm">Male</TextRegular>
          <TextRegular mr="sm">Spanish</TextRegular>
          <TextRegular>1/1/1970 (53)</TextRegular>
        </View>
      </View>
      <MoreIcon color={Colors.NEUTRAL_DARK} />
    </View>
  );
}
