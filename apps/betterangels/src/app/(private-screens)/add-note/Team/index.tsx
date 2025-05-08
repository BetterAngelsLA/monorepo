import {
  enumDisplaySelahTeam,
  SelahTeamEnum,
  useSnackbar,
  useUpdateNoteMutation,
} from '@monorepo/expo/betterangels';
import { Spacings } from '@monorepo/expo/shared/static';
import { Picker_V2 as Picker } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { View } from 'react-native';

const valueAsSelahTeamEnum = Object.fromEntries(
  Object.entries(enumDisplaySelahTeam).map(([key, value]) => [value, key])
);

interface ITeamProps {
  team?: SelahTeamEnum | null;
  noteId: string;
}

export default function Team(props: ITeamProps) {
  const { team, noteId } = props;
  const [localTeam, setLocalTeam] = useState<string | null | undefined>(
    team ? enumDisplaySelahTeam[team] : null
  );

  const [updateNote] = useUpdateNoteMutation();
  const { showSnackbar } = useSnackbar();

  const updateNoteFunction = async (value: string) => {
    if (!noteId) {
      return;
    }
    setLocalTeam(value);
    const enumValue = valueAsSelahTeamEnum[value] as SelahTeamEnum;
    const selectedTeam = enumValue !== undefined ? enumValue : null;

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
        placeholder="Team"
        allowSelectNone
        selectedValue={localTeam}
        items={Object.values(SelahTeamEnum).map((item) => ({
          label: enumDisplaySelahTeam[item],
          value: enumDisplaySelahTeam[item],
        }))}
        onChange={(t) => updateNoteFunction(t as SelahTeamEnum)}
      />
    </View>
  );
}
