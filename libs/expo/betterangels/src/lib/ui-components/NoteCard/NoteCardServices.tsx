import { Spacings } from '@monorepo/expo/shared/static';
import { PillContainer } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { NotesQuery, ServiceEnum } from '../../apollo';
import { enumDisplayServices } from '../../static/enumDisplayMapping';

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
          pills={note['requestedServices'].map((item) =>
            item.service === ServiceEnum.Other
              ? item.serviceOther || ''
              : enumDisplayServices[item.service]
          )}
          variant={'singleRow'}
        />
      )}
      {!!note.providedServices.length && (
        <PillContainer
          maxVisible={5}
          pillVariant={'success'}
          pills={note['providedServices'].map((item) =>
            item.service === ServiceEnum.Other
              ? item.serviceOther || ''
              : enumDisplayServices[item.service]
          )}
          variant={'singleRow'}
        />
      )}
    </View>
  );
}
