import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useMutation, useQuery } from '@apollo/client';
import {
  CREATE_NOTE,
  GET_NOTES,
  MainScrollContainer,
  NavModal,
  useUser,
} from '@monorepo/expo/betterangels';
import {
  BurgerSodaIcon,
  ChevronLeftIcon,
  WalkingIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Alert,
  BodyText,
  Button,
  ClientCard,
  EventCard,
  H1,
  H2,
  H4,
  NoteCard,
} from '@monorepo/expo/shared/ui-components';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import Logo from '../assets/images/logo.svg';

const EVENTS: { tasks: string[]; type: 'event' | 'task' }[] = [
  {
    tasks: [
      'Event 1',
      'Event 2',
      'Event 3',
      'Event to test longer text for wrapping',
      'Event 5',
    ],
    type: 'event',
  },
  {
    tasks: [
      'Task 1',
      'Task 2',
      'Task 3',
      'Task to test longer text for wrapping',
    ],
    type: 'task',
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
  const { user } = useUser();
  const router = useRouter();

  const { data, loading: isLoading } = useQuery(GET_NOTES, {
    fetchPolicy: 'cache-and-network',
  });

  async function createNoteFunction() {
    try {
      const { data } = await createNote({
        variables: {
          data: {
            // TODO: This should be client name once we're fetching and mapping clients
            title: `Session with ${user?.firstName}`,
            client: user?.id,
          },
        },
      });
      router.navigate(`/add-note/${data?.createNote.id}`);
    } catch (e) {
      console.log(e);
    }
  }

  useEffect(() => {
    if (data && !isLoading) {
      setNotes(data.notes);
    }
  }, [data, isLoading]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.heading}>
        <View>
          <Logo
            style={{ marginBottom: Spacings.xs }}
            color={Colors.WHITE}
            width={73}
            height={11}
          />
          <H1 color={Colors.WHITE} size="xl">
            Home
          </H1>
        </View>
        <View style={{ alignItems: 'center' }}>
          <NavModal />
          <View
            style={{
              height: 6,
              width: 6,
              borderRadius: 100,
              backgroundColor: Colors.ERROR,
            }}
          />
        </View>
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
                  type={event.type}
                  tasks={event.tasks}
                />
              ))}
            </ScrollView>
          ) : null}
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
                  key={note.id}
                  title={note.title}
                  onPress={() => router.navigate(`/add-note/${note.id}`)}
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
  heading: {
    paddingHorizontal: Spacings.sm,
    paddingBottom: Spacings.xs,
    backgroundColor: Colors.BRAND_DARK_BLUE,
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
