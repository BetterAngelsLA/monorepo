import { CalendarIcon, ListIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { StyleSheet, View } from 'react-native';
import BodyText from '../BodyText';
import H1 from '../H1';
import H4 from '../H4';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IEventCardProps {
  tasks: string[];
  type: 'event' | 'task';
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
}

export function EventCard(props: IEventCardProps) {
  const { type = 'event', tasks, mb, mt, mr, ml, my, mx } = props;

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
      <View style={{ flex: 1 }}>
        {type === 'event' ? (
          <CalendarIcon mb="lg" color={Colors.NEUTRAL_DARK} />
        ) : (
          <ListIcon mb="lg" color={Colors.NEUTRAL_DARK} />
        )}

        <View>
          <H1 size="2xl">{tasks?.length || 0}</H1>
          <BodyText textTransform="capitalize" size="xs">
            {type + (tasks.length > 1 ? 's' : '')}
          </BodyText>
        </View>
      </View>
      <View style={{ flex: 3 }}>
        {tasks.slice(0, 4).map((item, index) => (
          <View key={index} style={styles.itemContainer}>
            <BodyText mr="xs">{'\u2022'}</BodyText>
            <BodyText
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.item}
            >
              {item}
            </BodyText>
          </View>
        ))}
        {tasks.length > 4 && (
          <H4 color={Colors.PRIMARY} size="xs" mt="xs">
            {tasks.length - 4} more
          </H4>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  conatiner: {
    padding: Spacings.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.NEUTRAL_LIGHT,
    backgroundColor: Colors.WHITE,
    width: 272,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  item: {
    flex: 1,
  },
});
