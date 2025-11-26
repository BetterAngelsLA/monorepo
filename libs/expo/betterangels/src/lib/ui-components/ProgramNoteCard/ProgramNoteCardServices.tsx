import { Spacings } from '@monorepo/expo/shared/static';
import { PillContainer } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { NotesQuery, ServiceEnum } from '../../apollo';
import { enumDisplayServices } from '../../static/enumDisplayMapping';

interface IProgramNoteCardServicesProps {
  note: NotesQuery['notes']['results'][0];
}

export default function ProgramNoteCardServices(
  props: IProgramNoteCardServicesProps
) {
  const { note } = props;
  return (
    <View style={{ marginBottom: Spacings.xs }}>
      {!!note.requestedServices.length && (
        <PillContainer
          maxVisible={5}
          pillVariant={'warning'}
          pills={note['requestedServices']
            // TODO: remove after cutover
            .filter((item) => !!item.serviceEnum)
            .map((item) =>
              item.serviceEnum === ServiceEnum.Other
                ? item.serviceOther || ''
                : enumDisplayServices[item.serviceEnum!]
            )}
          variant={'singleRow'}
        />
      )}
      {!!note.providedServices.length && (
        <PillContainer
          maxVisible={5}
          pillVariant={'success'}
          pills={note['providedServices']
            // TODO: remove after cutover
            .filter((item) => !!item.serviceEnum)
            .map((item) =>
              item.serviceEnum === ServiceEnum.Other
                ? item.serviceOther || ''
                : enumDisplayServices[item.serviceEnum!]
            )}
          variant={'singleRow'}
        />
      )}
    </View>
  );
}
