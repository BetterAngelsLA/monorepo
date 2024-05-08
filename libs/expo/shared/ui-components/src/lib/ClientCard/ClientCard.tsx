import {
  LocationDotIcon,
  MoreIcon,
  PawIcon,
  TentIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  DimensionValue,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Avatar from '../Avatar';
import IconButton from '../IconButton';
import TextBold from '../TextBold';
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
  menu: string | undefined;
  setMenu: (menu: string | undefined) => void;
  id: string;
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
    menu,
    setMenu,
    id,
  } = props;

  return (
    <TouchableWithoutFeedback
      style={{ flex: 1 }}
      onPress={() => {
        if (menu) {
          setMenu(undefined);
        }
      }}
      accessibilityRole="button"
    >
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
          mr="sm"
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
          <IconButton
            onPress={() => setMenu(id)}
            variant="transparent"
            accessibilityLabel="More options"
            accessibilityHint="Opens more options"
          >
            <MoreIcon color={Colors.NEUTRAL_DARK} />
          </IconButton>
          {menu === id && (
            <View
              style={{
                position: 'absolute',
                right: 0,
                borderRadius: 8,
                width: 105,
                borderColor: Colors.NEUTRAL_LIGHT,
                borderWidth: 1,
              }}
            >
              <Pressable accessibilityRole="button">
                {({ pressed }) => (
                  <View
                    style={[
                      styles.moreButton,
                      {
                        borderTopRightRadius: 8,
                        borderTopLeftRadius: 8,
                        backgroundColor: pressed
                          ? Colors.NEUTRAL_EXTRA_LIGHT
                          : Colors.WHITE,
                      },
                    ]}
                  >
                    <TextBold size="sm">Edit Profile</TextBold>
                  </View>
                )}
              </Pressable>

              <Pressable onPress={onPress} accessibilityRole="button">
                {({ pressed }) => (
                  <View
                    style={[
                      styles.moreButton,
                      {
                        borderBottomLeftRadius: 8,
                        borderBottomRightRadius: 8,
                        backgroundColor: pressed
                          ? Colors.NEUTRAL_EXTRA_LIGHT
                          : Colors.WHITE,
                      },
                    ]}
                  >
                    <TextBold size="sm">Add Note</TextBold>
                  </View>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
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
