import { Colors } from '@monorepo/expo/shared/static';
import { Text } from 'react-native';
import { MainContainer } from '../../ui-components';

export default function Tasks() {
  return (
    <MainContainer pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <Text>Tasks</Text>
    </MainContainer>
  );
}
