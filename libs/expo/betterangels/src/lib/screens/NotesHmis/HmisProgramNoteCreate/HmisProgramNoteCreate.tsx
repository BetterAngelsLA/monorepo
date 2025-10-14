import { TextBold } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { HmisProgramNoteForm } from '../HmisProgramNoteForm';

type TProps = {
  hmisClientId: string;
};

export function HmisProgramNoteCreate(props: TProps) {
  const { hmisClientId } = props;

  return (
    <View>
      <TextBold>HmisProgramNoteCreate: {hmisClientId}</TextBold>

      <HmisProgramNoteForm />
    </View>
  );
}
