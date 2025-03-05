import { Colors } from '@monorepo/expo/shared/static';
import {
  BottomActions,
  Loading,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useNavigation, useRouter } from 'expo-router';
import { ReactNode, useEffect, useLayoutEffect, useState } from 'react';
import { View } from 'react-native';
import { useSnackbar } from '../../hooks';
import { useGetClientProfileQuery } from '../AddEditClient/__generated__/AddEditClient.generated';
import ContactInfo from './ContactInfo';
import DemographicInfo from './DemographicInfo';
import Fullname from './Fullname';
import HmisId from './HmisId';
import Household from './Household';
import ImportantNote from './ImportantNote';
import PersonalInfo from './PersonalInfo';
import RelevantContact from './RelevantContact';
import { FormStateMapping, IClientProfileForms } from './types';

const formConfigs: Record<
  keyof FormStateMapping,
  { title: string; content: ReactNode }
> = {
  // TODO: handle state settler
  ContactInfo: {
    title: 'Edit Contact Information',
    content: <ContactInfo />,
  },
  DemographicInfo: {
    title: 'Edit Demographic Details',
    content: <DemographicInfo />,
  },
  Fullname: {
    title: 'Edit Full Name',
    content: <Fullname />,
  },
  HmisId: {
    title: 'Edit HMIS ID',
    content: <HmisId />,
  },
  Household: {
    title: 'Edit Household Details',
    content: <Household />,
  },
  ImportantNote: {
    title: 'Edit Important Note',
    content: <ImportantNote />,
  },
  PersonalInfo: {
    title: 'Edit Personal Information',
    content: <PersonalInfo />,
  },
  RelevantContact: {
    title: 'Edit Relevant Contact',
    content: <RelevantContact />,
  },
};

export default function ClientProfileForms(props: IClientProfileForms) {
  const { componentName, id } = props;
  const { data, error, loading } = useGetClientProfileQuery({
    variables: { id },
  });
  const [form, setForm] = useState<
    FormStateMapping[keyof FormStateMapping] | undefined
  >(undefined);
  const navigation = useNavigation();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const allowedKeys = Object.keys(formConfigs);

  if (!allowedKeys.includes(componentName)) {
    throw new Error(`Invalid componentName "${componentName}" provided.`);
  }

  const validComponentName = componentName as keyof FormStateMapping;
  const config = formConfigs[validComponentName];

  const onSubmit = () => {
    // submit the form here
  };

  useLayoutEffect(() => {
    if (config) {
      navigation.setOptions({ title: config.title });
    }
  }, [config, navigation]);

  useEffect(() => {
    if (!data || !('clientProfile' in data) || !id) return;
  }, [data, id]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Loading size="large" />
      </View>
    );
  }

  if (error) {
    console.error(error);

    showSnackbar({
      message: 'Something went wrong. Please try again.',
      type: 'error',
    });
  }

  // TODO: pass unused variable
  console.log(form, setForm);
  return (
    <View>
      {config ? (
        config.content
      ) : (
        <TextRegular>No form available for "{componentName}"</TextRegular>
      )}
      <BottomActions
        cancel={
          <TextButton
            onPress={router.back}
            fontSize="sm"
            accessibilityHint={`cancels the update of ${config.title}`}
            title="Cancel"
          />
        }
        onSubmit={onSubmit}
      />
    </View>
  );
}
