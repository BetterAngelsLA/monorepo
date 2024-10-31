import {
  enumDisplaySelahTeam,
  SelahTeamEnum,
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
  const [localTeam, setLocalTeam] = useState<string>(
    team ? enumDisplaySelahTeam[team] : ''
  );

  const [updateNote] = useUpdateNoteMutation();

  const updateNoteFunction = async (value: SelahTeamEnum) => {
    if (!noteId || !value) return;
    setLocalTeam(enumDisplaySelahTeam[value]);

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
      console.error('Failed to update note:', err);
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
        setSelectedValue={(e) => updateNoteFunction(e as SelahTeamEnum)}
      />
    </View>
  );
}
