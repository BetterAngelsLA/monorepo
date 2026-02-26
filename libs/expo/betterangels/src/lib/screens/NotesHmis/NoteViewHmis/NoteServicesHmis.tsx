import { Spacings } from '@monorepo/expo/shared/static';
import { PillContainer, TextBold } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { ViewNoteHmisQuery } from './__generated__/NoteViewHmis.generated';

export default function NoteServicesHmis({
  note,
}: {
  note: ViewNoteHmisQuery['hmisNote'];
}) {
  return (
    <View>
      {!!note.requestedServices?.length && (
        <View
          style={
            note.providedServices?.length ? { marginBottom: Spacings.sm } : {}
          }
        >
          <TextBold mb="xs" size="sm">
            Requested Services
          </TextBold>
          <PillContainer
            maxVisible={5}
            pillVariant={'warning'}
            pills={note['requestedServices'].map(
              (item) => item.service?.label || ''
            )}
            variant={'expandable'}
          />
        </View>
      )}
      {!!note.providedServices?.length && (
        <View>
          <TextBold mb="xs" size="sm">
            Provided Services
          </TextBold>
          <PillContainer
            maxVisible={5}
            pillVariant={'success'}
            pills={note['providedServices'].map(
              (item) => item.service?.label || ''
            )}
            variant={'expandable'}
          />
        </View>
      )}
    </View>
  );
}
