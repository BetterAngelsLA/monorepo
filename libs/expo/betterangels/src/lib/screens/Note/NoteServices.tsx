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
              // TODO: remove after cutover
              .filter((item) => !!item.serviceEnum)
              .map((item) =>
                item.serviceEnum === ServiceEnum.Other
                  ? item.serviceOther || ''
                  : enumDisplayServices[item.serviceEnum!]
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
              // TODO: remove after cutover
              .filter((item) => !!item.serviceEnum)
              .map((item) =>
                item.serviceEnum === ServiceEnum.Other
                  ? item.serviceOther || ''
                  : enumDisplayServices[item.serviceEnum!]
              )}
            variant={'expandable'}
          />
        </View>
      )}
    </View>
  );
}
