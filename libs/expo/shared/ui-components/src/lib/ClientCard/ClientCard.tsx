import {
  LocationDotIcon,
  PawIcon,
  TentIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Link } from 'expo-router';
import { DimensionValue, StyleSheet, View } from 'react-native';
import Avatar from '../Avatar';
import TextBold from '../TextBold';
import TextButton from '../TextButton';
import TextRegular from '../TextRegular';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IClientCardProps {
  imageUrl?: string;
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
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
}

export function ClientCard(props: IClientCardProps) {
  const {
    imageUrl,
    firstName,
    lastName,
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
  } = props;

  return (
    <Link href={`/client/${id}`}>
      <View
        style={[
          styles.container,
          {
            marginBottom: mb && Spacings[mb],
            marginTop: mt && Spacings[mt],
            marginLeft: ml && Spacings[ml],
            marginRight: mr && Spacings[mr],
            marginHorizontal: mx && Spacings[mx],
            marginVertical: my && Spacings[my],
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
            {firstName} {lastName}
          </TextBold>
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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <PawIcon size="sm" color={Colors.NEUTRAL_DARK} />
          </View>
        </View>
        <View style={{ justifyContent: 'center', position: 'relative' }}>
          <TextButton
            fontSize="sm"
            title={select === 'true' ? 'Select' : 'Add Note'}
            onPress={onPress}
            accessibilityHint={`Add a note for client ${firstName} ${lastName}`}
          />
        </View>
      </View>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    width: '100%',
    padding: Spacings.xs,
    backgroundColor: Colors.WHITE,
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
});
