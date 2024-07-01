import { MainScrollContainer } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';
import { Dispatch, SetStateAction, useState } from 'react';
import AddMember from './AddMember';
import Edit from './Edit';
import Main from './Main';

interface ITeamEditScreenProps {
  teamId: string | undefined;
  setFlow: Dispatch<SetStateAction<string>>;
}

const flowComponents: {
  [key: string]: React.ComponentType<ITeamEditScreenProps>;
} = {
  '1': Main,
  '2': Edit,
  '3': AddMember,
};

export default function TeamScreen() {
  const [flow, setFlow] = useState('1');
  const { teamId } = useLocalSearchParams<{ teamId: string }>();

  const props = {
    teamId,
    setFlow,
  };

  if (!teamId) {
    throw new Error('Team id is required');
  }

  const FlowComponent = flowComponents[String(flow)] || null;

  return (
    <MainScrollContainer>
      {FlowComponent && <FlowComponent {...props} />}
    </MainScrollContainer>
  );
}
