import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { View } from 'react-native';
import { enumDisplaySelahTeam } from '../../static/enumDisplayMapping';
import { NoteSummaryQuery } from './__generated__/NoteSummary.generated';

export default function NoteTitle({
  note,
}: {
  note: NoteSummaryQuery['note'] | undefined;
}) {
  return (
    <View>
      <TextBold size="lg" mb="xs">
        {note?.purpose}
      </TextBold>
      <TextRegular size="sm" mb="sm">
        {format(new Date(note?.interactedAt), 'MM/dd/yyyy')}
      </TextRegular>
      {!!note?.team && (
        <>
          <TextBold size="sm">Team</TextBold>
          <TextRegular size="sm">{enumDisplaySelahTeam[note.team]}</TextRegular>
        </>
      )}
    </View>
  );
}
