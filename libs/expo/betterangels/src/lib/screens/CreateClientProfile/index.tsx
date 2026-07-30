import { CombinedGraphQLErrors } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BottomActions,
  ControlledInput,
  Form,
  KeyboardAwareScrollView,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import {
  CreateClientProfileInput,
  extractResponseExtensions,
} from '../../apollo';
import { applyManualFormErrors } from '../../errors';
import { useSnackbar } from '../../hooks';
import {
  CreateClientProfileDocument,
  CreateClientProfileMutation,
  CreateClientProfileMutationVariables,
} from './__generated__/createClientProfile.generated';

type AllowedFieldNames = 'firstName' | 'middleName' | 'lastName' | 'nickname';

interface FormField {
  label: string;
  name: AllowedFieldNames;
  placeholder: string;
}

const FORM_FIELDS: FormField[] = [
  {
    label: 'First Name',
    name: 'firstName',
    placeholder: 'Enter first name',
  },
  {
    label: 'Middle Name',
    name: 'middleName',
    placeholder: 'Enter middle name',
  },
  { label: 'Last Name', name: 'lastName', placeholder: 'Enter last name' },
  { label: 'Nickname', name: 'nickname', placeholder: 'Enter nickname' },
];

export default function CreateClientProfile() {
  const {
    control,
    setError,
    handleSubmit,
    formState: { isSubmitted },
    setValue,
  } = useForm<CreateClientProfileInput>();
  const [createClientProfile, { loading: isCreating }] = useMutation<
    CreateClientProfileMutation,
    CreateClientProfileMutationVariables
  >(CreateClientProfileDocument);

  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const [firstName, middleName, lastName, nickname] = useWatch({
    control,
    name: ['firstName', 'middleName', 'lastName', 'nickname'],
  });

  const isError = !firstName && !middleName && !lastName && !nickname;

  const onSubmit: SubmitHandler<CreateClientProfileInput> = async (values) => {
    try {
      const { data, error } = await createClientProfile({
        variables: {
          data: values,
        },
        errorPolicy: 'all',
      });

      // handle fieldErrors and return if present
      if (CombinedGraphQLErrors.is(error)) {
        // TODO: handle `client_name` field returned by server + use zod schema
        const fieldErrors = extractResponseExtensions(error);

        if (fieldErrors?.length) {
          applyManualFormErrors(fieldErrors, setError);

          return;
        }
      }

      const result = data?.createClientProfile;

      if (result?.__typename === 'ClientProfileType') {
        router.replace(`/client/${result.id}`);
      } else {
        console.error('Unexpected result: ', error);

        throw new Error(error?.message || 'Unexpected result');
      }
    } catch (err) {
      console.error(`[createClientProfile] error: ${err}`);

      showSnackbar({
        message: 'Sorry, there was an error creating this profile.',
        type: 'error',
      });
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView>
        <Form.Fieldset
          title="Full Name"
          required
          subtitle="Filling out one of the fields required"
          subtitleError={isSubmitted && isError}
        >
          {FORM_FIELDS.map((item) => (
            <ControlledInput
              key={item.name}
              label={item.label}
              name={item.name}
              placeholder={item.placeholder}
              control={control}
              onDelete={() => setValue(item.name, '')}
              error={isSubmitted && isError}
              rules={{
                validate: () => {
                  if (isError) {
                    return 'At least one field must be filled.';
                  }
                  return true;
                },
              }}
            />
          ))}
        </Form.Fieldset>
      </KeyboardAwareScrollView>

      <BottomActions
        disabled={isCreating}
        cancel={
          <TextButton
            disabled={isCreating}
            onPress={router.back}
            fontSize="sm"
            accessibilityHint={`cancels the create of client profile`}
            title="Cancel"
          />
        }
        onSubmit={handleSubmit(onSubmit)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
  contentContainer: {
    flexGrow: 1,
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.sm,
  },
});
