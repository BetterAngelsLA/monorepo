import {
  enumDisplaySelahTeam,
  SelahTeamEnum,
  useSnackbar,
  useUpdateNoteMutation,
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
  const [localTeam, setLocalTeam] = useState<SelahTeamEnum | null | undefined>(
    team
  );

  const [updateNote] = useUpdateNoteMutation();
  const { showSnackbar } = useSnackbar();

  const updateNoteFunction = async (value: SelahTeamEnum) => {
    if (!noteId || !value) return;
    setLocalTeam(value);

    try {
      await updateNote({
        variables: {
          data: {
            id: noteId,
            team: value,
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
        placeholder="Team"
        value={localTeam}
        items={Object.values(SelahTeamEnum).map((item) => ({
          label: enumDisplaySelahTeam[item],
          value: item,
        }))}
        setSelectedValue={(t) => updateNoteFunction(t as SelahTeamEnum)}
      />
    </View>
  );
}
