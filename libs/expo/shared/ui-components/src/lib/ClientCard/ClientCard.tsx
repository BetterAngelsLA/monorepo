import { LocationDotIcon, TentIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { useRouter } from 'expo-router';
import { DimensionValue, Pressable, StyleSheet, View } from 'react-native';
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

  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.navigate(`/client/${id}`)}
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
      </View>
      <View style={{ justifyContent: 'center', position: 'relative' }}>
        <TextButton
          fontSize="sm"
          title={select === 'true' ? 'Select' : 'Add Interaction'}
          onPress={onPress}
          accessibilityHint={`Add a interaction for client ${firstName} ${lastName}`}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
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
