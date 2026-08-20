import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { fromDateTimeString } from '@monorepo/shared/scalars';
import { format } from 'date-fns';
import { View } from 'react-native';
import { NoteSummaryQuery } from './__generated__/NoteSummary.generated';

export default function NoteTitle({
  note,
}: {
  note: NoteSummaryQuery['note'] | undefined;
}) {
  const interactedAt = fromDateTimeString(note?.interactedAt);

  return (
    <View>
      {note?.purpose && (
        <TextBold selectable size="lg" mb="xs">
          {note?.purpose}
        </TextBold>
      )}
      {interactedAt && (
        <TextRegular selectable mb="sm" size="sm">
          {format(interactedAt, 'MM/dd/yyyy')}
          {' @ '}
          {format(interactedAt, 'hh:mm a')}
        </TextRegular>
      )}
      {!!note?.team?.name && (
        <>
          <TextBold size="sm">Team</TextBold>
          <TextRegular selectable size="sm">
            {note.team.name}
          </TextRegular>
        </>
      )}
    </View>
  );
}
