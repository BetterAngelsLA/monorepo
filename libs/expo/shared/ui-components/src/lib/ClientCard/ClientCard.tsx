import {
  LocationDotIcon,
  TentIcon,
  ThreeDotIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { useRouter } from 'expo-router';
import { DimensionValue, Pressable, StyleSheet, View } from 'react-native';
import Avatar from '../Avatar';
import IconButton from '../IconButton';
import TextBold from '../TextBold';
import TextButton from '../TextButton';
import TextRegular from '../TextRegular';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IClientCardProps {
  imageUrl?: string;
  age?: number | null | undefined;
  dateOfBirth?: string | null | undefined;
  firstName?: string | null | undefined;
  heightInInches?: number | null | undefined;
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

export function ClientCard(props: IClientCardProps) {
  const {
    imageUrl,
    age,
    dateOfBirth,
    firstName,
    heightInInches,
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
  const formatDateOfBirth = (dateOfBirth: string) => {
    const [year, month, day] = dateOfBirth.split('-');
    return `${month}/${day}/${year}`;
  };

  const formattedHeight = heightInInches ? formatHeight(heightInInches) : null;
  const formattedDateOfBirth = dateOfBirth
    ? formatDateOfBirth(dateOfBirth)
    : null;

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

      <View style={{ gap: Spacings.xs, flex: 2 }}>
        <TextBold size="sm">
          {firstName} {lastName} {nickname && `(${nickname})`}
        </TextBold>
        <View style={styles.row}>
          <TextRegular size="xs">{formattedDateOfBirth}</TextRegular>
          {!!age && <TextRegular size="xs"> ({age})</TextRegular>}
          {!!heightInInches && (
            <TextRegular size="xs"> | Height: {formattedHeight}</TextRegular>
          )}
        </View>
        <View style={styles.row}>
          <TextRegular size="xs">
            {residenceAddress} residenceAddress
          </TextRegular>
        </View>
        <View style={styles.row}>
          <TextRegular size="xs">{residenceAddress}</TextRegular>
        </View>
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
    marginBottom: Spacings.xs,
  },
});
