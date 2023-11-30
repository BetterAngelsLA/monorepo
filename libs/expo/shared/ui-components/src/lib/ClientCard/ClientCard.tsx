import { LocationDotIcon, PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { DimensionValue, StyleSheet, View } from 'react-native';
import Avatar from '../Avatar';
import BodyText from '../BodyText';
import H4 from '../H4';
import IconButton from '../IconButton';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IClientCardProps {
  imageUrl: string;
  firstName: string;
  lastName: string;
  address: string;
  progress: DimensionValue;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  onPress?: () => void;
}

export function ClientCard(props: IClientCardProps) {
  const {
    imageUrl,
    firstName,
    lastName,
    address,
    progress = '0%',
    mb,
    mt,
    mr,
    ml,
    my,
    mx,
    onPress,
  } = props;
  return (
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
      <View style={{ alignItems: 'center', paddingHorizontal: Spacings.xs }}>
        <Avatar
          accLabel={`Avatar of ${firstName} ${lastName} client`}
          imageUrl={imageUrl}
          mb="xs"
          size="lg"
        />
        <H4>
          {firstName} {lastName}
        </H4>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: Spacings.xs,
          }}
        >
          <LocationDotIcon size="sm" color={Colors.PRIMARY_EXTRA_DARK} />
          <BodyText size="sm"> {address}</BodyText>
        </View>
        <IconButton
          accLabel={`Create a note for ${firstName} ${lastName} button`}
          onPress={onPress}
          mb="xs"
          variant="secondary"
          borderColor={Colors.PRIMARY}
          height="sm"
          width="full"
        >
          <PlusIcon color={Colors.PRIMARY_EXTRA_DARK} />
        </IconButton>
      </View>
      <View style={styles.progress}>
        <View
          style={{
            backgroundColor: Colors.SUCCESS,
            height: 5,
            width: progress,
            position: 'absolute',
            left: 0,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderColor: Colors.NEUTRAL_EXTRA_LIGHT,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderRadius: 3,
    paddingTop: Spacings.sm,
    width: 160,
    backgroundColor: Colors.WHITE,
    overflow: 'hidden',
  },
  progress: {
    backgroundColor: Colors.NEUTRAL_LIGHT,
    height: 5,
    width: '100%',
    position: 'relative',
  },
});
