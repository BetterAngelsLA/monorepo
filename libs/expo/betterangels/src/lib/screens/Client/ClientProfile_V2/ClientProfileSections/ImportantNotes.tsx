import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { ClientProfileQuery } from '../../__generated__/Client.generated';
import { ClientProfileSection } from '../ClientProfileSection/ClientProfileSection';

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
      <ClientProfileSection
        items={content}
        showAll
        action={{
          onClick: () => alert('clicked'),
          accessibilityLabel: 'edit name information',
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
