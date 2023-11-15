import { MainScrollContainer } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import Edit from './Edit';
import Main from './Main';

export default function TeamScreen() {
  const [isEdit, setIsEdit] = useState(false);
  const { teamId } = useLocalSearchParams<{ teamId: string }>();

  const props = {
    teamId,
    setIsEdit,
  };

  if (!teamId) {
    throw new Error('Team id is required');
  }

  return (
    <MainScrollContainer>
      {/* need to be changed to Container after Main Teams screen ui merge*/}
      {isEdit ? <Edit {...props} /> : <Main {...props} />}
    </MainScrollContainer>
  );
}
