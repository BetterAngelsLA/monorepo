import { TextRegular } from '@monorepo/expo/shared/ui-components';
import {
  ClientProfileCard,
  ClientProfileCardContainer,
  TClientProfileCardItem,
} from '../../../../ui-components';
import { TClientProfile } from '../types';

type TProps = {
  clientProfile?: TClientProfile;
};

export function ImportantNotesCard(props: TProps) {
  const { clientProfile } = props;

  const importantNotes = clientProfile?.importantNotes;

  const content: TClientProfileCardItem[] = [
    {
      rows: [[ImportantNotesContent(importantNotes)]],
    },
  ];

  return (
    <ClientProfileCardContainer>
      <ClientProfileCard items={content} showAll />
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
