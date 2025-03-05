import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import {
  ClientProfileCard,
  TClientProfileCardItem,
} from '../../../../ui-components';
import { TClientProfile } from '../types';

type TProps = {
  clientProfile?: TClientProfile;
};

export default function ImportantNotes(props: TProps) {
  const { clientProfile } = props;

  const importantNotes = clientProfile?.importantNotes;

  const content: TClientProfileCardItem[] = [
    {
      rows: [[ImportantNotesContent(importantNotes)]],
    },
  ];

  return (
    <View>
      <ClientProfileCard
        items={content}
        showAll
        action={{
          onClick: () => alert('edit important notes'),
        }}
      />
    </View>
  );
}

function ImportantNotesContent(notes?: string | null) {
  const isString = typeof notes === 'string';

  if (!isString || !notes.trim().length) {
    return null;
  }

  return (
    <TextRegular size="sm" mb="xs">
      {notes}
    </TextRegular>
  );
}
