import {
  IdCardOutlineIcon,
  LocationDotIcon,
  TentIcon,
  ThreeDotIcon,
  UserOutlineIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  Avatar,
  IconButton,
  TextBold,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { DimensionValue, Pressable, StyleSheet, View } from 'react-native';
import { HmisProfileType } from '../apollo';
type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
interface IClientCardProps {
  imageUrl?: string;
  age?: number | null | undefined;
  dateOfBirth?: string | null | undefined;
  firstName?: string | null | undefined;
  heightInInches?: number | null | undefined;
  hmisProfiles?: Array<HmisProfileType | null> | null | undefined;
  lastName?: string | null | undefined;
  nickname?: string | null | undefined;
  residenceAddress?: string | null | undefined;
  address?: string;
  progress?: DimensionValue;
  daysActive?: number;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  onPress?: () => void;
  id: string;
  select?: string;
  arrivedFrom?: string;
}

export default function ClientCard(props: IClientCardProps) {
  const {
    imageUrl,
    age,
    dateOfBirth,
    firstName,
    heightInInches,
    hmisProfiles,
    lastName,
    nickname,
    residenceAddress,
    address,
    daysActive,
    mb,
    mt,
    mr,
    ml,
    my,
    mx,
    onPress,
    id,
    select = 'false',
    arrivedFrom,
  } = props;

  const router = useRouter();
  const formatHeight = (inches: number) => {
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return `${feet}' ${remainingInches}"`;
  };
  const getLahsaHmisId = (hmisProfiles: Array<HmisProfileType | null>) => {
    return hmisProfiles.find((profile) => profile?.agency === 'LAHSA')?.id;
  };
  const formattedHeight = heightInInches ? formatHeight(heightInInches) : null;
  const lahsaHmisId = hmisProfiles ? getLahsaHmisId(hmisProfiles) : null;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.navigate({
          pathname: `/client/${id}`,
          params: {
            arrivedFrom,
          },
        })
      }
      style={({ pressed }) => [
        styles.container,
        {
          marginBottom: mb && Spacings[mb],
          marginTop: mt && Spacings[mt],
          marginLeft: ml && Spacings[ml],
          marginRight: mr && Spacings[mr],
          marginHorizontal: mx && Spacings[mx],
          marginVertical: my && Spacings[my],
          backgroundColor: pressed ? Colors.GRAY_PRESSED : Colors.WHITE,
        },
      ]}
    >
      <Avatar
        accessibilityHint={`shows avatar of ${firstName} ${lastName} if available`}
        accessibilityLabel={`Avatar of ${firstName} ${lastName} client`}
        imageUrl={imageUrl}
        size="lg"
        mr="xs"
      />

      <View style={{ gap: Spacings.xxs, flex: 2 }}>
        <TextBold size="sm">
          {firstName} {lastName} {nickname && `(${nickname})`}
        </TextBold>
        {(dateOfBirth || formattedHeight) && (
          <View style={styles.row}>
            <UserOutlineIcon mr="xxs" size="sm" color={Colors.NEUTRAL_DARK} />
            {!!dateOfBirth && (
              <TextRegular size="xs">
                {format(dateOfBirth, 'MM/dd/yyyy')} ({age})
              </TextRegular>
            )}
            {!!dateOfBirth && !!heightInInches && (
              <TextRegular size="xs"> | </TextRegular>
            )}
            {!!heightInInches && (
              <TextRegular size="xs">Height: {formattedHeight}</TextRegular>
            )}
          </View>
        )}
        {!!residenceAddress && (
          <View style={styles.row}>
            <LocationDotIcon size="sm" mr="xxs" color={Colors.NEUTRAL_DARK} />
            <TextRegular size="xs">{residenceAddress}</TextRegular>
          </View>
        )}
        {!!lahsaHmisId && (
          <View style={styles.row}>
            <IdCardOutlineIcon size="sm" mr="xxs" color={Colors.NEUTRAL_DARK} />
            <TextRegular size="xs">LAHSA HMIS ID: {lahsaHmisId}</TextRegular>
          </View>
        )}
        {daysActive && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TentIcon size="sm" color={Colors.NEUTRAL_DARK} />
            <TextRegular size="xs"> {daysActive} Days</TextRegular>
          </View>
        )}
        {address && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <LocationDotIcon size="sm" color={Colors.NEUTRAL_DARK} />
            <TextRegular size="xs"> {address}</TextRegular>
          </View>
        )}
      </View>
      <View style={{ justifyContent: 'center', position: 'relative' }}>
        {select === 'true' ? (
          <TextButton
            fontSize="sm"
            title={'Select'}
            onPress={onPress}
            accessibilityHint={`Add a interaction for client ${firstName} ${lastName}`}
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
