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
import { differenceInYears, parseISO } from 'date-fns';
import { View } from 'react-native';

interface IClientHeaderProps {
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  gender: string | null | undefined;
  language: string | null | undefined;
  dateOfBirth: string | null | undefined;
}

const calculateAge = (birthDate: string) => {
  const currentDate = new Date();
  const birthDateObj = parseISO(birthDate);
  return differenceInYears(currentDate, birthDateObj);
};

export default function ClientHeader(props: IClientHeaderProps) {
  const { firstName, lastName, gender, language, dateOfBirth } = props;
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
      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: Spacings.sm }}
      >
        {gender && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <GenderIcon mr="xs" color={Colors.PRIMARY_EXTRA_DARK} />
            <TextRegular textTransform="capitalize">{gender}</TextRegular>
          </View>
        )}
        {language && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <GlobeIcon mr="xs" color={Colors.PRIMARY_EXTRA_DARK} />
            <TextRegular textTransform="capitalize">{language}</TextRegular>
          </View>
        )}
        {dateOfBirth && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <BirthdayIcon mr="xs" color={Colors.PRIMARY_EXTRA_DARK} />
            <TextRegular>
              {dateOfBirth} ({calculateAge(dateOfBirth)})
            </TextRegular>
          </View>
        )}
      </View>
    </View>
  );
}
