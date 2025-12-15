import { Spacings } from '@monorepo/expo/shared/static';
import { PillContainer } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { NotesQuery } from '../../apollo';

interface INoteCardServicesProps {
  note: NotesQuery['notes']['results'][0];
}

export default function NoteCardServices(props: INoteCardServicesProps) {
  const { note } = props;
  return (
    <View style={{ marginBottom: Spacings.xs }}>
      {!!note.requestedServices.length && (
        <PillContainer
          maxVisible={5}
          pillVariant={'warning'}
          pills={note['requestedServices'].map(
            (item) => item.service?.label || ''
          )}
          variant={'singleRow'}
        />
      )}
      {!!note.providedServices.length && (
        <PillContainer
          maxVisible={5}
          pillVariant={'success'}
          pills={note['providedServices'].map(
            (item) => item.service?.label || ''
          )}
          variant={'singleRow'}
        />
      )}
    </View>
  );
}
