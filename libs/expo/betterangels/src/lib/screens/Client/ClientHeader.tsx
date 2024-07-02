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
import { ScrollView, View } from 'react-native';
import { GenderEnum, LanguageEnum } from '../../apollo';
import {
  enumDisplayGender,
  enumDisplayLanguage,
} from '../../static/enumDisplayMaping';

interface IClientHeaderProps {
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  gender: GenderEnum | null | undefined;
  preferredLanguage: LanguageEnum | null | undefined;
  dateOfBirth: string | null | undefined;
  age: number | null | undefined;
}

export default function ClientHeader(props: IClientHeaderProps) {
  const { firstName, lastName, gender, preferredLanguage, dateOfBirth, age } =
    props;

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
      <ScrollView
        contentContainerStyle={{ alignItems: 'center', gap: Spacings.sm }}
        horizontal
        style={{ flexDirection: 'row' }}
      >
        {gender && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <GenderIcon mr="xs" color={Colors.PRIMARY_EXTRA_DARK} />
            <TextRegular>{enumDisplayGender[gender]}</TextRegular>
          </View>
        )}
        {preferredLanguage && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <GlobeIcon mr="xs" color={Colors.PRIMARY_EXTRA_DARK} />

            <TextRegular>{enumDisplayLanguage[preferredLanguage]}</TextRegular>
          </View>
        )}
        {dateOfBirth && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <BirthdayIcon mr="xs" color={Colors.PRIMARY_EXTRA_DARK} />
            <TextRegular>
              {dateOfBirth} ({age})
            </TextRegular>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
