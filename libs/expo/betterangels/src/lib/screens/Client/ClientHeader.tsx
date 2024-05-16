import {
  BirthdayIcon,
  GenderIcon,
  GlobeIcon,
} from '@monorepo/expo/shared/icons';
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
        paddingVertical: Spacings.md,
      }}
    >
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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <GenderIcon mr="xs" color={Colors.PRIMARY_EXTRA_DARK} />
          <TextRegular mr="sm">Male</TextRegular>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <GlobeIcon mr="xs" color={Colors.PRIMARY_EXTRA_DARK} />
          <TextRegular mr="sm">Spanish</TextRegular>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <BirthdayIcon mr="xs" color={Colors.PRIMARY_EXTRA_DARK} />
          <TextRegular>1/1/1970 (53)</TextRegular>
        </View>
      </View>
    </View>
  );
}
