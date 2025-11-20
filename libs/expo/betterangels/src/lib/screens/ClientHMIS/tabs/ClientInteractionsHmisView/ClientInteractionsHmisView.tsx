import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { IconButton } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { View } from 'react-native';
import { HmisClientProfileType } from '../../../../apollo';
import { MainScrollContainer } from '../../../../ui-components';

type TProps = {
  client?: HmisClientProfileType;
};

export function ClientInteractionsHmisView(props: TProps) {
  const { client } = props;

  if (!client) {
    return null;
  }

  return (
    <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View>
        <IconButton
          variant="secondary"
          borderColor={Colors.WHITE}
          accessibilityLabel="create an interaction"
          accessibilityHint="create new interaction"
          onPress={() =>
            router.navigate(
              `/notes-hmis/create?hmisClientId=${client.personalId}`
            )
          }
        >
          <PlusIcon />
        </IconButton>
      </View>
    </MainScrollContainer>
  );
}
