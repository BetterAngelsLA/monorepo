import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { View } from 'react-native';
import { NoteSummaryQuery } from './__generated__/NoteSummary.generated';

export default function NoteTitle({
  note,
}: {
  note: NoteSummaryQuery['note'] | undefined;
}) {
  return (
    <View>
      {note?.purpose && (
        <TextBold selectable size="lg" mb="xs">
          {note?.purpose}
        </TextBold>
      )}
      <TextRegular selectable mb="sm" size="sm">
        {format(new Date(note?.interactedAt), 'MM/dd/yyyy')}
        {' @ '}
        {format(new Date(note?.interactedAt), 'hh:mm a')}
      </TextRegular>
      {!!note?.currentTeam?.name && (
        <>
          <TextBold size="sm">Team</TextBold>
          <TextRegular selectable size="sm">
            {note.currentTeam.name}
          </TextRegular>
        </>
      )}
    </View>
  );
}
