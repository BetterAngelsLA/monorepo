import { ScrollView, StyleSheet, View } from 'react-native';

import { useMutation, useQuery } from '@apollo/client';
import {
  CREATE_NOTE,
  GET_NOTES,
  MainScrollContainer,
  NavModal,
  useUser,
} from '@monorepo/expo/betterangels';
import { BurgerSodaIcon, WalkingIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BodyText,
  ClientCard,
  EventCard,
  H1,
  H2,
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
          <H2 mb="sm">Today</H2>
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
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: Spacings.sm,
              marginTop: Spacings.lg,
            }}
          >
            <H2>Active Clients</H2>
            <Link
              accessible
              accessibilityHint="goes to all active clients list"
              accessibilityRole="button"
              href="#"
            >
              <BodyText color={Colors.PRIMARY}>All Clients</BodyText>
            </Link>
          </View>
          <ClientCard
            onPress={createNoteFunction}
            mb="sm"
            imageUrl=""
            address="361 S Spring St."
            firstName="first name"
            lastName="last name"
            progress="10%"
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
});
