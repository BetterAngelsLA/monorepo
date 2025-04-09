import { LoadingView } from '@monorepo/expo/shared/ui-components';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { useSnackbar } from '../../../hooks';
import {
  ClientProfileSectionEnum,
  isValidClientProfileSectionEnum,
} from '../../../screenRouting';
import { useGetClientProfileQuery } from '../ClientProfileForm/__generated__/clientProfile.generated';
import { clientRelatedModelConfig } from './config';

type TClientRelations = {
  clientId: string;
  componentName: string;
  relationId?: string;
  createMode?: boolean;
};

export function ClientProfileRelatedModelForm(props: TClientRelations) {
  const { clientId, relationId, componentName, createMode } = props;

  const navigation = useNavigation();

  const { showSnackbar } = useSnackbar();

  if (!isValidClientProfileSectionEnum(componentName)) {
    throw new Error(`Invalid componentName "${componentName}" provided.`);
  }

  const section = componentName as ClientProfileSectionEnum;

  const {
    data,
    error: fetchError,
    loading,
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
    <FormComponent clientProfile={clientProfile} relationId={relationId} />
  );
}
