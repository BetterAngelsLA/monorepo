import { useQuery } from '@apollo/client/react';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { LoadingView } from '@monorepo/expo/shared/ui-components';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useSnackbar } from '../../../hooks';
import { TRelatedModelSection } from '../../../screenRouting';
import { MainScrollContainer } from '../../../ui-components';
import { GetClientProfileDocument } from '../ClientProfileForm/__generated__/clientProfile.generated';
import { clientRelatedModelConfig } from './config';

type TProps = {
  clientId: string;
  componentName: TRelatedModelSection;
};

export function ClientProfileRelatedModelList(props: TProps) {
  const { clientId, componentName: section } = props;

  const navigation = useNavigation();

  const { showSnackbar } = useSnackbar();

  const {
    data,
    error: fetchError,
    loading,
  } = useQuery(GetClientProfileDocument, {
    variables: { id: clientId },
  });

  const { clientProfile } = data || {};

  const { titlePlural, ViewComponent } = clientRelatedModelConfig[section];

  useLayoutEffect(() => {
    navigation.setOptions({ title: `${titlePlural}` });
  }, [navigation, clientProfile, titlePlural]);

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
