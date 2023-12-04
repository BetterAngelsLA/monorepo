import {
  CalendarIcon,
  LocationDotIcon,
  MoreIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { StyleSheet, View } from 'react-native';
import Avatar from '../Avatar';
import BodyText from '../BodyText';
import H4 from '../H4';
import IconButton from '../IconButton';

// TODO: User type should be actual user type
type User = {
  firstName: string;
  lastName: string;
  id: string;
  image: string;
};

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IEventCardProps {
  title: string;
  time: string;
  address: string;
  participants: User[];
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
}

export function EventCard(props: IEventCardProps) {
  const { time, address, participants, title, mb, mt, mr, ml, my, mx } = props;

  const maxVisibleAvatars = 8;
  const additionalParticipants = participants.length > maxVisibleAvatars;
  return (
    <View
      style={[
        styles.conatiner,
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
      <H4 mb="xs" style={{ flex: 1 }}>
        {title}
      </H4>
      <View style={styles.flexRow}>
        <CalendarIcon size="sm" color={Colors.PRIMARY_EXTRA_DARK} />
        <BodyText> {time}</BodyText>
      </View>
      <View style={styles.flexRow}>
        <LocationDotIcon size="sm" color={Colors.PRIMARY_EXTRA_DARK} />
        <BodyText> {address}</BodyText>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          {participants.slice(0, maxVisibleAvatars).map((participant, idx) => (
            <View
              key={idx}
              style={{
                marginLeft: idx > 0 ? -8 : 0,
              }}
            >
              <Avatar
                accessibilityHint={`shows avatar of ${participant.firstName} ${participant.lastName} if available`}
                accessibilityLabel={`${participant.firstName} ${participant.lastName} avatar`}
                size="sm"
                imageUrl={participant.image}
              />
            </View>
          ))}
          {additionalParticipants && (
            <BodyText size="sm">
              {' '}
              + {participants.length - maxVisibleAvatars}
            </BodyText>
          )}
        </View>
        <IconButton
          accessibilityHint={`opens ${title} event participants details popup`}
          accessibilityLabel={`${title} event participants details`}
          style={{ position: 'relative', left: 10 }}
          width="xs"
          height="xs"
          variant="transparent"
        >
          <MoreIcon size="sm" color={Colors.PRIMARY_EXTRA_DARK} />
        </IconButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  conatiner: {
    padding: Spacings.sm,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Colors.NEUTRAL_LIGHT,
    backgroundColor: Colors.WHITE,
    width: 216,
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacings.xs,
  },
});
