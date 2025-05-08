import {
  SelahTeamEnum,
  enumDisplaySelahTeam,
  useSnackbar,
  useUpdateNoteMutation,
} from '@monorepo/expo/betterangels';
import { Spacings } from '@monorepo/expo/shared/static';
import { SingleSelect } from '@monorepo/expo/shared/ui-components';
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

  const [updateNote] = useUpdateNoteMutation();
  const { showSnackbar } = useSnackbar();

  const updateNoteFunction = async (selectedTeam: SelahTeamEnum) => {
    if (!noteId || !selectedTeam) {
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
      setLocalTeam(team || undefined);

      showSnackbar({
        message: 'Failed to update interaction.',
        type: 'error',
      });

      console.error('Failed to update interaction:', err);
    }
  };

  return (
    <View style={{ marginBottom: Spacings.xs }}>
      <SingleSelect
        placeholder="Team"
        selectedValue={localTeam || undefined}
        items={Object.entries(enumDisplaySelahTeam).map(
          ([value, displayValue]) => ({ value, displayValue })
        )}
        onChange={(value) => {
          updateNoteFunction(value as SelahTeamEnum);
        }}
      />
    </View>
  );
}
