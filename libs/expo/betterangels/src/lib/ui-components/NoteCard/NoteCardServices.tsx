import { Spacings } from '@monorepo/expo/shared/static';
import { View } from 'react-native';
import { NotesQuery } from '../../apollo';
import NoteCardPills from './NoteCardPills';

interface INoteCardServicesProps {
  note: NotesQuery['notes']['results'][0];
}

export default function NoteCardServices(props: INoteCardServicesProps) {
  const { note } = props;
  return (
    <View style={{ marginBottom: Spacings.xs }}>
      {!!note.requestedServices.length && (
        <NoteCardPills type="warning" services={note.requestedServices} />
      )}
      {!!note.providedServices.length && (
        <NoteCardPills type="success" services={note.providedServices} />
      )}
    </View>
  );
}
