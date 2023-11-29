import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  MainScrollContainer,
  useSignOut,
  useUser,
} from '@monorepo/expo/betterangels';
import { BarsIcon, BellIcon, SearchIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Alert,
  Avatar,
  EventCard,
  H1,
} from '@monorepo/expo/shared/ui-components';
import { useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

const EVENTS = [
  {
    title: 'Event Card somehthng somet dasf',
    time: '09:00 AM',
    address: '123 Wilshire Blvd',
    participants: [
      {
        id: '1',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
      {
        id: '2',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
      {
        id: '3',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
      {
        id: '4',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
      {
        id: '1',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
      {
        id: '2',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
      {
        id: '3',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
      {
        id: '4',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
      {
        id: '1',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
      {
        id: '2',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
      {
        id: '3',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
      {
        id: '4',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
    ],
  },
  {
    title: 'Event Card somehthng somet dasf',
    time: '09:00 AM',
    address: '123 Wilshire Blvd',
    participants: [
      {
        id: '1',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
      {
        id: '2',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
    ],
  },
];

export default function TabOneScreen() {
  const { user } = useUser();
  const { signOut } = useSignOut();
  const { control } = useForm();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerContainer}>
          <Pressable>
            <SearchIcon color={Colors.PRIMARY_EXTRA_DARK} />
          </Pressable>
          <Pressable style={{ marginHorizontal: Spacings.md }}>
            <BellIcon color={Colors.PRIMARY_EXTRA_DARK} />
          </Pressable>
          <Pressable>
            <BarsIcon color={Colors.PRIMARY_EXTRA_DARK} />
          </Pressable>
        </View>
      ),
    });
  }, [navigation]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.heading}>
        <View>
          <Image
            style={{ width: 100, height: 19 }}
            source={require('../assets/images/blackLogo.png')}
          />
          <H1 size="2xl">Home</H1>
        </View>
        <Avatar firstName="Davit" lastName="Manukyan" size="md" />
      </View>
      <MainScrollContainer pt="sm" bg={Colors.NEUTRAL_EXTRA_LIGHT}>
        <View>
          <Alert
            mb="sm"
            text="4 shelter referrals are pending for over 14 days."
            variant="warning"
            onActionPress={() => console.log('press')}
            actionText="More"
          />
        </View>
        <ScrollView horizontal>
          {EVENTS.map((event, idx) => (
            <EventCard
              mr="xs"
              key={idx}
              title={event.title}
              time={event.time}
              address={event.address}
              participants={event.participants}
            />
          ))}
        </ScrollView>
      </MainScrollContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacings.md,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
  containerContent: {
    paddingBottom: 80,
    paddingTop: 24,
  },
  heading: {
    paddingHorizontal: Spacings.sm,
    paddingBottom: Spacings.md,
    backgroundColor: Colors.WHITE,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
