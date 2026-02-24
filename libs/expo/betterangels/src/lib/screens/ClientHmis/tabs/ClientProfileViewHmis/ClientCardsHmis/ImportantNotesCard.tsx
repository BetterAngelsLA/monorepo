import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { HmisClientProfileType } from '../../../../../apollo';
import {
  ClientProfileCard,
  ClientProfileCardContainer,
  TClientProfileCardItem,
} from '../../../../../ui-components';

type TProps = {
  client?: HmisClientProfileType;
};

export function ImportantNotesCard(props: TProps) {
  const { client } = props;

  const { importantNotes } = client || {};

  const content: TClientProfileCardItem[] = [
    { rows: [[ImportantNotesContent(importantNotes)]] },
  ];

  return (
    <ClientProfileCardContainer>
      <ClientProfileCard items={content} />
    </ClientProfileCardContainer>
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
