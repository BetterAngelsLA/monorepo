import { PillContainer, TextBold } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { ServiceEnum } from '../../apollo';
import { enumDisplayServices } from '../../static';
import { NoteSummaryQuery } from './__generated__/NoteSummary.generated';

export default function NoteServices({
  data,
  type,
}: {
  type: 'providedServices' | 'requestedServices';
  data: NoteSummaryQuery;
}) {
  return (
    <View>
      <TextBold mb="xs" size="sm">
        {type === 'providedServices' ? 'Provided' : 'Requested'} Services
      </TextBold>
      <PillContainer
        maxVisible={5}
        type={type === 'providedServices' ? 'success' : 'primary'}
        data={data?.note[type].map((item) =>
          item.service === ServiceEnum.Other
            ? item.serviceOther || ''
            : enumDisplayServices[item.service]
        )}
      />
    </View>
  );
}
