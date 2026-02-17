import { ApolloClient } from '@apollo/client';
import {
  NoteTasks,
  SelahTeamEnum,
  ViewNoteQuery,
  ViewNoteQueryVariables,
} from '@monorepo/expo/betterangels';
import { RefObject } from 'react';
import { ScrollView } from 'react-native';

interface ITasksProps {
  clientProfileId: string;
  noteId: string;
  scrollRef: RefObject<ScrollView | null>;
  tasks: ViewNoteQuery['note']['tasks'];
  team?: SelahTeamEnum | null;
  refetch: (
    variables?: Partial<ViewNoteQueryVariables>
  ) => Promise<ApolloClient.QueryResult<ViewNoteQuery>>;
}

export default function Tasks(props: ITasksProps) {
  const { clientProfileId, noteId, tasks, scrollRef, refetch, team } = props;

  return (
    <NoteTasks
      clientProfileId={clientProfileId}
      noteId={noteId}
      scrollRef={scrollRef}
      tasks={tasks}
      refetch={refetch}
      team={team}
    />
  );
}
