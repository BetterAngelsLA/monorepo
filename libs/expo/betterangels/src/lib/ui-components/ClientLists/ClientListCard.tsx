import {
  IdCardOutlineIcon,
  LocationDotIcon,
  ThreeDotIcon,
  UserOutlineIcon,
} from '@monorepo/expo/shared/icons';
import {
  Colors,
  Radiuses,
  Spacings,
  TMarginProps,
  getMarginStyles,
} from '@monorepo/expo/shared/static';
import {
  Avatar,
  IconButton,
  TextBold,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import {
  DimensionValue,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { TFullClientProfile } from '../../apollo/graphql/types/clientProfile';

export type TClientListCard = {};

interface IClientCardProps extends TMarginProps {
  client: TFullClientProfile;
  progress?: DimensionValue;
  onPress?: () => void;
  select?: string;
  arrivedFrom?: string;
  style?: ViewStyle[];
}

export default function ClientListCard(props: IClientCardProps) {
  const {
    client,
    onPress,
    select = 'false',
    arrivedFrom,
    style = {},
    ...marginProps
  } = props;

  const router = useRouter();

  if (!client) {
    return;
  }

  const formatHeight = (inches: number) => {
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return `${feet}' ${remainingInches}"`;
  };

  // TODO: FIX ANY
  const getLahsaHmisId = (
    // hmisProfiles: Maybe<HmisProfileType[] | undefined>
    hmisProfiles: any
  ) => {
    return hmisProfiles?.find((profile: any) => profile?.agency === 'LAHSA')
      ?.hmisId;
  };

  const formattedHeight = client.heightInInches
    ? formatHeight(client.heightInInches)
    : null;

  const lahsaHmisId = client.hmisProfiles
    ? getLahsaHmisId(client.hmisProfiles)
    : null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.navigate({
          pathname: `/client/${client.id}`,
          params: {
            arrivedFrom,
          },
        })
      }
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed ? Colors.GRAY_PRESSED : Colors.WHITE,
          ...getMarginStyles(marginProps),
        },
        style,
      ]}
    >
      <Avatar
        accessibilityHint={`shows avatar of ${client.user.firstName} ${client.user.lastName} if available`}
        accessibilityLabel={`Avatar of ${client.user.firstName} ${client.user.lastName} client`}
        imageUrl={client.profilePhoto?.url}
        size="xl"
        mr="xs"
      />

      <View style={{ gap: Spacings.xxs, flex: 2 }}>
        <TextBold size="sm">
          {client.user.firstName} {client.user.lastName}{' '}
          {client.nickname && `(${client.nickname})`}
        </TextBold>

        {(client.dateOfBirth || formattedHeight) && (
          <View style={styles.row}>
            <UserOutlineIcon mr="xxs" size="sm" color={Colors.NEUTRAL_DARK} />
            {!!client.dateOfBirth && (
              <TextRegular size="xs">
                {format(new Date(client.dateOfBirth), 'MM/dd/yyyy')} (
                {client.age})
              </TextRegular>
            )}

            {!!client.dateOfBirth && !!client.heightInInches && (
              <TextRegular size="xs"> | </TextRegular>
            )}
            {!!client.heightInInches && (
              <TextRegular size="xs">Height: {formattedHeight}</TextRegular>
            )}
          </View>
        )}

        {!!client.residenceAddress && (
          <View style={styles.row}>
            <LocationDotIcon size="sm" mr="xxs" color={Colors.NEUTRAL_DARK} />
            <TextRegular size="xs">{client.residenceAddress}</TextRegular>
          </View>
        )}

        {!!lahsaHmisId && (
          <View style={styles.row}>
            <IdCardOutlineIcon size="sm" mr="xxs" color={Colors.NEUTRAL_DARK} />
            <TextRegular size="xs">LAHSA HMIS ID: {lahsaHmisId}</TextRegular>
          </View>
        )}
      </View>

      <View style={{ justifyContent: 'center', position: 'relative' }}>
        {select === 'true' ? (
          <TextButton
            fontSize="sm"
            title={'Select'}
            onPress={onPress}
            accessibilityHint={`Add a interaction for client ${client.user.firstName} ${client.user.lastName}`}
          />
        ) : (
          <IconButton
            onPress={onPress}
            variant="transparent"
            accessibilityLabel={'open client details modal'}
            accessibilityHint={'open client details modal'}
          >
            <ThreeDotIcon />
          </IconButton>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  clientCard: {},
  container: {
    alignItems: 'center',
    borderRadius: Radiuses.xs,
    padding: Spacings.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progress: {
    backgroundColor: Colors.NEUTRAL_LIGHT,
    height: 5,
    width: '100%',
    position: 'relative',
  },
  moreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacings.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 0,
  },
});
