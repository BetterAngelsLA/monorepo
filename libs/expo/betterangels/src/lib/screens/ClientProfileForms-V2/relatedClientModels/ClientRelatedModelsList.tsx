import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { LoadingView } from '@monorepo/expo/shared/ui-components';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useSnackbar } from '../../../hooks';
import { MainScrollContainer } from '../../../ui-components';
import {
  ClientProfileCardEnum,
  isValidClientProfileCardEnum,
} from '../../Client/ClientProfile_V2/constants';
import { useGetClientProfileQuery } from '../__generated__/clientProfile.generated';
import { clientRelatedModelConfig } from './config';

type TProps = {
  clientId: string;
  componentName: string;
};

export function ClientRelatedModelsList(props: TProps) {
  const { clientId, componentName } = props;

  const navigation = useNavigation();

  const { showSnackbar } = useSnackbar();

  if (!isValidClientProfileCardEnum(componentName)) {
    throw new Error(`Invalid componentName "${componentName}" provided.`);
  }

  const section = componentName as ClientProfileCardEnum;

  const {
    data,
    error: fetchError,
    loading,
    refetch,
  } = useGetClientProfileQuery({
    variables: { id: clientId },
  });

  const { clientProfile } = data || {};

  const { titlePlural, ViewComponent } =
    clientRelatedModelConfig[componentName];

  useLayoutEffect(() => {
    navigation.setOptions({ title: `Edit ${titlePlural}` });
  }, [navigation, clientProfile]);

  if (loading) {
    return <LoadingView />;
  }

  if (fetchError) {
    console.error(fetchError);

    showSnackbar({
      message: 'Something went wrong. Please try again.',
      type: 'error',
    });
  }

  if (!clientProfile) {
    return;
  }

  return (
    <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <ViewComponent clientProfile={clientProfile} style={styles.container} />
    </MainScrollContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacings.sm,
  },
});
