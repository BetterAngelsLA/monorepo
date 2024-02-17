import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useMutation, useQuery } from '@apollo/client';
import {
  CREATE_NOTE,
  GET_NOTES,
  MainScrollContainer,
  useSignOut,
  useUser,
} from '@monorepo/expo/betterangels';
import {
  BarsIcon,
  BellIcon,
  BurgerSodaIcon,
  ChevronLeftIcon,
  SearchIcon,
  WalkingIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Alert,
  Avatar,
  BodyText,
  Button,
  ClientCard,
  EventCard,
  H1,
  H2,
  H4,
  NoteCard,
} from '@monorepo/expo/shared/ui-components';
import { Link, useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

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
const TOOLS = [
  {
    icon: <BurgerSodaIcon size="sm" color={Colors.SECONDARY} />,
    title: 'Services',
    link: '',
  },
  {
    icon: <WalkingIcon size="sm" color={Colors.SECONDARY} />,
    title: 'Activity',
    link: '',
  },
];
interface INote {
  id: string;
  title: string;
  purposes: { value: string }[];
  nextStepActions: { value: string }[];
  publicDetails: string;
  noteDateTime: string;
  moods: string[];
  providedServices: string[];
  nextStepDate: Date;
  requestedServices: string[];
}
export default function TabOneScreen() {
  const [tab, toggle] = useState(1);
  const [notes, setNotes] = useState<INote[] | undefined>([]);
  const [createNote] = useMutation(CREATE_NOTE);
  const navigation = useNavigation();
  const { user } = useUser();
  const { signOut } = useSignOut();
  const router = useRouter();

  const { data, loading: isLoading } = useQuery(GET_NOTES, {
    fetchPolicy: 'network-only',
  });

  async function createNoteFunction() {
    try {
      const { data } = await createNote({
        variables: {
          data: {
            title: 'note title',
            publicDetails: 'note public details',
            client: {
              id: '2',
            },
          },
        },
      });
      console.log('CREATE NOTE DATA:', data);
      router.navigate({
        pathname: `/add-note/[clientId]`,
        // pathname: `/add-note/`,
        // params: { id: id } });
      });
    } catch (e) {
      console.log(e);
    }
  }

  async function viewNoteFunction(id: string) {
    try {
      // router.navigate({
      //   pathname: `/update-note/${id}`,
      // });
      console.log('GOING TO UPDATE NOTE', id);
    } catch (e) {
      console.log(e);
    }
  }

  useEffect(() => {
    if (data && !isLoading) {
      setNotes(data.notes);
      console.log('setNotes:', data.notes);
    }
  }, [data, isLoading]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerContainer}>
          <Pressable
            accessibilityRole="button"
            accessibilityHint="focuses on input to search"
            accessible
            accessibilityLabel="Navbar Search Icon"
            onPress={() => signOut()}
          >
            <Text>Logout: {user?.username} </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityHint="focuses on input to search"
            accessible
            accessibilityLabel="Navbar Search Icon"
          >
            <SearchIcon color={Colors.PRIMARY_EXTRA_DARK} />
          </Pressable>
          <Pressable
            accessible
            accessibilityRole="button"
            accessibilityHint="opens notifications screen"
            accessibilityLabel="Navbar Notifications Icon"
            style={{ marginHorizontal: Spacings.md }}
          >
            <BellIcon color={Colors.PRIMARY_EXTRA_DARK} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessible
            accessibilityHint="opens menu popup"
            accessibilityLabel="Navbar Menu Icon"
          >
            <BarsIcon color={Colors.PRIMARY_EXTRA_DARK} />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, signOut, user?.username]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.heading}>
        <View>
          <Image
            style={{ width: 100, height: 19 }}
            source={require('../assets/images/blackLogo.png')}
            accessibilityIgnoresInvertColors={true}
          />
          <H1 size="2xl">Home</H1>
        </View>
        <Avatar
          accessibilityHint="my avatar"
          accessibilityLabel="My Avatar"
          size="lg"
        />
      </View>
      <MainScrollContainer px={0} pt="sm" bg={Colors.NEUTRAL_EXTRA_LIGHT}>
        <View style={{ paddingHorizontal: Spacings.sm }}>
          <Alert
            mb="sm"
            text="4 shelter referrals are pending for over 14 days."
            variant="warning"
            onActionPress={() => console.log('press')}
            actionText="More"
          />
        </View>
        <View style={styles.tabsContainer}>
          <View
            style={{
              flexDirection: 'row',
            }}
          >
            <View style={{ position: 'relative', paddingBottom: Spacings.sm }}>
              <Pressable
                accessible
                accessibilityHint="switches to today tab"
                accessibilityRole="button"
                onPress={() => toggle(1)}
              >
                <H4 mx="sm">Today</H4>
              </Pressable>
              {tab === 1 && <View style={styles.line} />}
            </View>
            <View style={{ position: 'relative', paddingBottom: Spacings.sm }}>
              <Pressable
                accessible
                accessibilityHint="switches to daily tasks tab"
                accessibilityRole="button"
                onPress={() => toggle(2)}
              >
                <H4 mx="sm">Daily Tasks</H4>
              </Pressable>
              {tab === 2 && <View style={styles.line} />}
            </View>
          </View>
          <BodyText color={Colors.PRIMARY_DARK} size="sm">
            Calendar
          </BodyText>
        </View>
        <View style={styles.tab}>
          {tab === 1 ? (
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
          ) : (
            <></>
          )}
        </View>
        <View style={{ paddingHorizontal: Spacings.sm }}>
          <H2 mb="sm">Useful Tools</H2>
          <ScrollView
            contentContainerStyle={{ marginBottom: Spacings.md }}
            horizontal
          >
            {TOOLS.map((tool, idx) => (
              <Pressable
                accessible
                accessibilityRole="button"
                accessibilityHint={`goes to ${tool.title} screen`}
                style={styles.tool}
                key={idx}
              >
                <View
                  style={{
                    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
                    height: 30,
                    width: 30,
                    borderRadius: 100,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {tool.icon}
                </View>
                <BodyText mt="xs">{tool.title}</BodyText>
              </Pressable>
            ))}
          </ScrollView>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: Spacings.sm,
            }}
          >
            <H2>Active Clients List</H2>
            <Link
              accessible
              accessibilityHint="goes to active clients full list"
              accessibilityRole="button"
              href="#"
            >
              <BodyText>Full List</BodyText>
            </Link>
          </View>
          <ClientCard
            onPress={createNoteFunction}
            mb="sm"
            imageUrl=""
            address="361 S Spring St."
            firstName="f"
            lastName="l"
            progress="10%"
          />
          <View
            style={{
              flexDirection: 'row',
            }}
          >
            {notes?.map((note: INote) => {
              return (
                <NoteCard
                  mb="sm"
                  id={note.id}
                  key={note.id}
                  title={note.title}
                  onPress={viewNoteFunction}
                />
              );
            })}
          </View>
          <Button
            accessibilityHint="loads more active clients"
            borderColor={Colors.PRIMARY}
            icon={
              <ChevronLeftIcon
                size="sm"
                rotate="-90deg"
                color={Colors.PRIMARY_EXTRA_DARK}
              />
            }
            size="full"
            variant="secondary"
            title="More List"
          />
        </View>
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
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacings.lg,
    paddingHorizontal: Spacings.sm,
    backgroundColor: Colors.WHITE,
  },
  line: {
    height: 5,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: Colors.PRIMARY,
  },
  tab: {
    paddingVertical: Spacings.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.NEUTRAL_EXTRA_LIGHT,
    backgroundColor: Colors.WHITE,
    marginBottom: Spacings.xl,
    paddingHorizontal: Spacings.sm,
  },
  tool: {
    marginRight: Spacings.xs,
    borderColor: Colors.NEUTRAL_LIGHT,
    borderRadius: 8,
    backgroundColor: Colors.WHITE,
    height: 97,
    width: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
