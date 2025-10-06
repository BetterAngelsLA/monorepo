import { TextBold } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';

type TProps = {
  id: string;
  componentName: string;
};

export function ClientHMISEdit(props: TProps) {
  const { componentName, id } = props;

  return (
    <View>
      <TextBold>{componentName}</TextBold>
      <TextBold>{id}</TextBold>
    </View>
  );
}
