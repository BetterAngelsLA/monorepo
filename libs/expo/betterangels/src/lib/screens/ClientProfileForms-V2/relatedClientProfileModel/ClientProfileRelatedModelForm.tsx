import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';

type TClientRelations = {
  clientId: string;
  componentName: string;
  relationId?: string;
  createMode?: boolean;
};

export function ClientProfileRelatedModelForm(props: TClientRelations) {
  const { createMode, componentName } = props;

  return (
    <View>
      <TextRegular>
        {createMode ? 'Create' : 'Edit'} - componentName: {componentName}{' '}
      </TextRegular>
    </View>
  );
}
