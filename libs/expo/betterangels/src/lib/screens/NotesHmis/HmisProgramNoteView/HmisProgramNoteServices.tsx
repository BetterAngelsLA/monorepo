import { Spacings } from '@monorepo/expo/shared/static';
import { PillContainer, TextBold } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { ViewHmisNoteQuery } from './__generated__/HmisProgramNoteView.generated';

export default function HmisProgramNoteServices({
  note,
}: {
  note: ViewHmisNoteQuery['hmisNote'];
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
            pills={note['requestedServices']
              // TODO: remove after cutover
              .map((item) => item.serviceOther || item.service?.label || '')}
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
              (item) => item.serviceOther || item.service?.label || ''
            )}
            variant={'expandable'}
          />
        </View>
      )}
    </View>
  );
}
