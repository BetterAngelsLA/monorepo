import { Spacings } from '@monorepo/expo/shared/static';
import { PillContainer, TextBold } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { ServiceEnum } from '../../apollo';
import { enumDisplayServices } from '../../static';
import { NoteSummaryQuery } from './__generated__/NoteSummary.generated';

export default function NoteServices({
  note,
}: {
  note: NoteSummaryQuery['note'];
}) {
  return (
    <View>
      {!!note.requestedServices.length && (
        <View style={{ marginBottom: Spacings.sm }}>
          <TextBold mb="xs" size="sm">
            Requested Services
          </TextBold>
          <PillContainer
            maxVisible={5}
            pillVariant={'warning'}
            pills={note['requestedServices'].map((item) =>
              item.service === ServiceEnum.Other
                ? item.serviceOther || ''
                : enumDisplayServices[item.service]
            )}
            variant={'expandable'}
          />
        </View>
      )}
      {!!note.providedServices.length && (
        <View
          style={
            note.requestedServices.length ? {} : { marginBottom: Spacings.sm }
          }
        >
          <TextBold mb="xs" size="sm">
            Provided Services
          </TextBold>
          <PillContainer
            maxVisible={5}
            pillVariant={'success'}
            pills={note['providedServices'].map((item) =>
              item.service === ServiceEnum.Other
                ? item.serviceOther || ''
                : enumDisplayServices[item.service]
            )}
            variant={'expandable'}
          />
        </View>
      )}
    </View>
  );
}
