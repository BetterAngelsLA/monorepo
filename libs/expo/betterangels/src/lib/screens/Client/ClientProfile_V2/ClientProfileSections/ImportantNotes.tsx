import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { ClientProfileCard } from '../../../../ui-components';
import { TClientProfile } from '../types';

type TProps = {
  clientProfile?: TClientProfile;
};

export default function ImportantNotes(props: TProps) {
  const { clientProfile } = props;

  const importantNotes = clientProfile?.importantNotes;

  const content = [
    {
      content: ImportantNotesContent(importantNotes),
    },
  ];

  return (
    <View>
      <ClientProfileCard
        items={content}
        action={{
          onClick: () => alert('edit important notes'),
        }}
      />
    </View>
  );
}

function ImportantNotesContent(notes?: string | null) {
  if (!notes) {
    return null;
  }

  return (
    <TextRegular size="sm" mb="xs">
      {notes}
    </TextRegular>
  );
}
