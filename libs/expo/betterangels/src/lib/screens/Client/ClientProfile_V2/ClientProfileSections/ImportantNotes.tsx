import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { ClientProfileInfo } from '../../../../ui-components';
import { ClientProfileQuery } from '../../__generated__/Client.generated';

type TProps = {
  client: ClientProfileQuery | undefined;
};

export default function ImportantNotes(props: TProps) {
  const { client } = props;

  const importantNotes = client?.clientProfile.importantNotes;

  const content = [
    {
      content: ImportantNotesContent(importantNotes),
    },
  ];

  return (
    <View>
      <ClientProfileInfo
        items={content}
        action={{
          onClick: () => alert('clicked'),
          accessibilityLabel: 'edit important notes',
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
