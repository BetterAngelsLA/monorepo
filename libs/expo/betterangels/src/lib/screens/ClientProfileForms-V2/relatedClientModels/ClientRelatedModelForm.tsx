import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  KeyboardAwareScrollView,
  LoadingView,
} from '@monorepo/expo/shared/ui-components';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useSnackbar } from '../../../hooks';
import {
  ClientProfileCardEnum,
  isValidClientProfileCardEnum,
} from '../../Client/ClientProfile_V2/constants';
import { useGetClientProfileQuery } from '../__generated__/clientProfile.generated';
import { clientRelatedModelConfig } from './config';

type TClientRelations = {
  clientId: string;
  componentName: string;
  relationId?: string;
  createMode?: boolean;
};

export function ClientRelatedModelForm(props: TClientRelations) {
  const { clientId, relationId, componentName, createMode } = props;

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

  const { titleSingular, FormComponent } =
    clientRelatedModelConfig[componentName];

  useLayoutEffect(() => {
    const navTitle = createMode
      ? `Add ${titleSingular}`
      : `Edit ${titleSingular}`;

    navigation.setOptions({ title: navTitle });
  }, [navigation, clientProfile, section]);

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
    <KeyboardAwareScrollView style={styles.container}>
      <FormComponent
        clientProfile={clientProfile}
        style={styles.formComponent}
        relationId={relationId}
      />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
  formComponent: {
    gap: Spacings.sm,
  },
});
