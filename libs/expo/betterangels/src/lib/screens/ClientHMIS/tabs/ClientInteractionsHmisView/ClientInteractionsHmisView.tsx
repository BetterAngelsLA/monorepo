import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { IconButton } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { View } from 'react-native';
import { HmisClientType } from '../../../../apollo';
import { MainScrollContainer } from '../../../../ui-components';

type TProps = {
  client?: HmisClientType;
};

export function ClientInteractionsHmisView(props: TProps) {
  const { client: _client } = props;

  return (
    <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View>
        <IconButton
          variant="secondary"
          borderColor={Colors.WHITE}
          accessibilityLabel="create an interaction"
          accessibilityHint="create new interaction"
          onPress={() => router.navigate('/hmis-notes/create')}
        >
          <PlusIcon />
        </IconButton>
      </View>
    </MainScrollContainer>
  );
}
