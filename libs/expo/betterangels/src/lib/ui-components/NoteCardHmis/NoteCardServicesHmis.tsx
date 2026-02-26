import { Spacings } from '@monorepo/expo/shared/static';
import { PillContainer } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { InteractionListHmisQuery } from '../InteractionListHmis/__generated__/interactionListHmis.generated';

interface INoteCardServicesHmisProps {
  note: InteractionListHmisQuery['hmisNotes']['results'][number];
}

export default function NoteCardServicesHmis(
  props: INoteCardServicesHmisProps
) {
  const { note } = props;
  return (
    <View style={{ marginBottom: Spacings.xs }}>
      {!!note.requestedServices?.length && (
        <PillContainer
          maxVisible={5}
          pillVariant={'warning'}
          pills={note['requestedServices'].map(
            (item) => item.service?.label || ''
          )}
          variant={'singleRow'}
        />
      )}
      {!!note.providedServices?.length && (
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
