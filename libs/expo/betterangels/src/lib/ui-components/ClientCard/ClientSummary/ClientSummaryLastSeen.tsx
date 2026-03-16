import { useInfiniteScrollQuery } from '@monorepo/apollo';
import {
  ClockIcon,
  LocationDotIcon,
  LocationPinIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { format, formatDistanceToNow, isToday } from 'date-fns';
import { StyleSheet, View } from 'react-native';
import { NoteType, Ordering } from '../../../apollo';
import { MapView, Marker, PROVIDER_GOOGLE } from '../../../maps';
import { ClientProfilesQuery } from '../../ClientProfileList/__generated__/ClientProfiles.generated';
import {
  InteractionsDocument,
  InteractionsQuery,
  InteractionsQueryVariables,
} from '../../InteractionList/__generated__/Interactions.generated';

interface IClientSummaryLastSeenProps {
  client: ClientProfilesQuery['clientProfiles']['results'][number];
}

export function formatActivityTime(date: Date) {
  const time = format(date, 'h:mmaaa');

  const dayPart = isToday(date)
    ? `Today at ${time}`
    : `${format(date, 'MMM d')} at ${time}`;

  const ago = formatDistanceToNow(date, { addSuffix: true });

  return `${dayPart} (${ago})`;
}

export default function ClientSummaryLastSeen(
  props: IClientSummaryLastSeenProps
) {
  const { client } = props;
  const { items, loading } = useInfiniteScrollQuery<
    NoteType,
    InteractionsQuery,
    InteractionsQueryVariables
  >({
    document: InteractionsDocument,
    queryFieldName: 'notes',
    variables: {
      filters: { clientProfile: client.id },
      ordering: [{ interactedAt: Ordering.Desc }, { id: Ordering.Desc }],
    },
    pageSize: 1,
  });

  if (loading) {
    return null;
  }
  const note = items?.[0];
  const lastSeenLocation = note?.location;

  if (!lastSeenLocation) {
    return null;
  }

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacings.xs,
          marginBottom: Spacings.xs,
        }}
      >
        <LocationDotIcon color={Colors.NEUTRAL_DARK} />
        <TextBold size="xs" color={Colors.NEUTRAL_DARK}>
          LAST SEEN LOCATION
        </TextBold>
      </View>
      <View
        style={{
          borderWidth: 1,
          borderColor: Colors.NEUTRAL_LIGHT,
          borderRadius: Radiuses.xs,
          overflow: 'hidden',
        }}
      >
        <MapView
          zoomEnabled={false}
          scrollEnabled={false}
          provider={PROVIDER_GOOGLE}
          region={{
            longitudeDelta: 0.005,
            latitudeDelta: 0.005,
            latitude: lastSeenLocation?.point[1],
            longitude: lastSeenLocation?.point[0],
          }}
          userInterfaceStyle="light"
          style={styles.map}
        >
          <Marker
            coordinate={{
              latitude: lastSeenLocation?.point[1],
              longitude: lastSeenLocation?.point[0],
            }}
          >
            <LocationPinIcon size="2xl" />
          </Marker>
        </MapView>
        <View
          style={{
            padding: Spacings.sm,
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: Spacings.xs,
          }}
        >
          <ClockIcon />
          <View>
            <TextBold size="sm">{lastSeenLocation?.address?.street}</TextBold>
            <TextRegular size="xs">
              {formatActivityTime(new Date(note.interactedAt))}
            </TextRegular>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
});
