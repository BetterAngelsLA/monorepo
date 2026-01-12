import { useMutation } from '@apollo/client/react';
import {
  SelahTeamEnum,
  UpdateNoteDocument,
  enumDisplaySelahTeam,
  useSnackbar,
} from '@monorepo/expo/betterangels';
import { Spacings } from '@monorepo/expo/shared/static';
import { Picker } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { View } from 'react-native';

interface ITeamProps {
  team?: SelahTeamEnum | null;
  noteId: string;
}

export default function Team(props: ITeamProps) {
  const { team, noteId } = props;
  const [localTeam, setLocalTeam] = useState<SelahTeamEnum | undefined | null>(
    team
  );

  const [updateNote] = useMutation(UpdateNoteDocument);
  const { showSnackbar } = useSnackbar();

  const updateNoteFunction = async (selectedTeam: SelahTeamEnum | null) => {
    if (!noteId) {
      return;
    }

    setLocalTeam(selectedTeam);

    try {
      await updateNote({
        variables: {
          data: {
            id: noteId,
            team: selectedTeam,
          },
        },
      });
    } catch (err) {
      showSnackbar({
        message: 'Failed to update interaction.',
        type: 'error',
      });

      console.error('Failed to update interaction:', err);
    }
  };

  return (
    <View style={{ marginBottom: Spacings.xs }}>
      <Picker
        allowSelectNone
        placeholder="Select Team"
        selectedValue={localTeam}
        items={Object.entries(enumDisplaySelahTeam).map(
          ([value, displayValue]) => ({ value, displayValue })
        )}
        onChange={(t) => updateNoteFunction(t as SelahTeamEnum | null)}
      />
    </View>
  );
}
