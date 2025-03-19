import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BottomActions,
  ControlledInput,
  FormCard,
  KeyboardAwareScrollView,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { CreateClientProfileInput } from '../../apollo';
import { applyValidationErrors } from '../../helpers/parseClientProfileErrors';
import { useSnackbar } from '../../hooks';
import { useCreateClientProfileMutation } from './__generated__/createClientProfile.generated';
import { TValidationError } from './types';

type AllowedFieldNames =
  | 'user.firstName'
  | 'user.middleName'
  | 'user.lastName'
  | 'nickname';

interface FormField {
  label: string;
  name: AllowedFieldNames;
  placeholder: string;
}

const FORM_FIELDS: FormField[] = [
  {
    label: 'First Name',
    name: 'user.firstName',
    placeholder: 'Enter first name',
  },
  {
    label: 'Middle Name',
    name: 'user.middleName',
    placeholder: 'Enter middle name',
  },
  { label: 'Last Name', name: 'user.lastName', placeholder: 'Enter last name' },
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
  const [createClient, { loading: isCreating }] =
    useCreateClientProfileMutation();

  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const [firstName, middleName, lastName, nickname] = useWatch({
    control,
    name: ['user.firstName', 'user.middleName', 'user.lastName', 'nickname'],
  });

  const isError = !firstName && !middleName && !lastName && !nickname;

  const onSubmit: SubmitHandler<CreateClientProfileInput> = async (values) => {
    try {
      const createResponse = await createClient({
        variables: {
          data: values,
        },
        errorPolicy: 'all',
      });

      const operationErrors = createResponse.errors?.[0].extensions?.[
        'errors'
      ] as TValidationError[] | undefined;

      if (operationErrors) {
        applyValidationErrors(operationErrors, setError);
        return;
      }

      const result = createResponse.data?.createClientProfile;

      if (result?.__typename === 'ClientProfileType') {
        router.replace(`/client/${result.id}`);
      } else {
        console.log('Unexpected result: ', result);
        showSnackbar({
          message: `Something went wrong!`,
          type: 'error',
        });
        router.replace(`/clients`);
      }
    } catch (err) {
      console.error(err);

      showSnackbar({
        message: 'Sorry, there was an error creating this profile.',
        type: 'error',
      });
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView>
        <FormCard
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
        </FormCard>
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
