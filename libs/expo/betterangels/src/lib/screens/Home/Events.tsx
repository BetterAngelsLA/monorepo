import { Spacings } from '@monorepo/expo/shared/static';
import { EventCard, H2 } from '@monorepo/expo/shared/ui-components';
import { ScrollView } from 'react-native';

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

export default function Events() {
  return (
    <>
      <H2 mb="sm">Today</H2>
      <ScrollView style={{ paddingBottom: Spacings.lg }} horizontal>
        {EVENTS.map((event, idx) => (
          <EventCard mr="xs" key={idx} type={event.type} tasks={event.tasks} />
        ))}
      </ScrollView>
    </>
  );
}
