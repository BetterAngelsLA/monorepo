import { Spacings } from '@monorepo/expo/shared/static';
import { PillContainer, TextBold } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { NoteSummaryQuery } from './__generated__/NoteSummary.generated';

export default function NoteServices({
  note,
}: {
  note: NoteSummaryQuery['note'];
}) {
  return (
    <View>
      {!!note.requestedServices.length && (
        <View
          style={
            note.providedServices.length ? { marginBottom: Spacings.sm } : {}
          }
        >
          <TextBold mb="xs" size="sm">
            Requested Services
          </TextBold>
          <PillContainer
            maxVisible={5}
            pillVariant={'warning'}
            pills={note['requestedServices']
              .filter((item) => !!item.serviceOther || !!item.service?.label)
              .map((item) =>
                item.serviceOther
                  ? item.serviceOther || ''
                  : item.service?.label || ''
              )}
            variant={'expandable'}
          />
        </View>
      )}
      {!!note.providedServices.length && (
        <View>
          <TextBold mb="xs" size="sm">
            Provided Services
          </TextBold>
          <PillContainer
            maxVisible={5}
            pillVariant={'success'}
            pills={note['providedServices']
              .filter((item) => !!item.serviceOther || !!item.service?.label)
              .map((item) =>
                item.serviceOther
                  ? item.serviceOther || ''
                  : item.service?.label || ''
              )}
            variant={'expandable'}
          />
        </View>
      )}
    </View>
  );
}
