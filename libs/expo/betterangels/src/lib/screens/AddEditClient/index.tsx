import { Colors } from '@monorepo/expo/shared/static';
import {
  BottomActions,
  Loading,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { parse } from 'date-fns';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../apollo';
import { MainScrollContainer } from '../../ui-components';
import ContactInfo from './ContactInfo';
import Dob from './Dob';
import Gender from './Gender';
import HMIS from './HMIS';
import Language from './Language';
import Name from './Name';
import VeteranStatus from './VeteranStatus';
import {
  useCreateClientProfileMutation,
  useGetClientProfileQuery,
  useUpdateClientProfileMutation,
} from './__generated__/AddEditClient.generated';

export default function AddEditClient({ id }: { id?: string }) {
  const checkId = id ? { variables: { id } } : { skip: true };
  const { data, loading, error, refetch } = useGetClientProfileQuery(checkId);

  const methods = useForm<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const [expanded, setExpanded] = useState<undefined | string | null>();
  const [updateClient] = useUpdateClientProfileMutation();
  const [createClient] = useCreateClientProfileMutation();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const onSubmit: SubmitHandler<
    UpdateClientProfileInput | CreateClientProfileInput
  > = async (values) => {
    const input = {
      ...values,
    };

    if (values.dateOfBirth) {
      input.dateOfBirth = values.dateOfBirth.toISOString().split('T')[0];
    }

    try {
      let operationResult;

      if (id) {
        const updateResponse = await updateClient({
          variables: {
            data: {
              id,
              ...input,
            },
          },
        });
        operationResult = updateResponse.data?.updateClientProfile;
      } else {
        const createResponse = await createClient({
          variables: { data: input as CreateClientProfileInput },
        });
        operationResult = createResponse.data?.createClientProfile;
      }

      if (
        operationResult?.__typename === 'OperationInfo' &&
        operationResult.messages
      ) {
        if (
          operationResult.messages[0].message ===
          'User with this Email already exists.'
        ) {
          methods.setError('user.email', {
            type: 'manual',
            message: 'User with this Email already exists.',
          });
          return;
        } else {
          throw new Error(
            `Failed to update a client profile 3: ${operationResult.messages[0].message}`
          );
        }
      }
      refetch();

      if (id) {
        router.replace(`/client/${id}`);
      } else {
        router.replace('/');
      }
    } catch (err) {
      throw new Error(`Failed to update a client profile 2: ${err}`);
    }
  };

  useEffect(() => {
    if (!data || !('clientProfile' in data) || !id) return;

    const clientInput = {
      ...data.clientProfile,
      user: {
        ...data.clientProfile.user,
      },
    };

    if (data.clientProfile.dateOfBirth) {
      const parsedDate = parse(
        data.clientProfile.dateOfBirth,
        'yyyy-MM-dd',
        new Date()
      );

      clientInput.dateOfBirth = parsedDate;
    }

    delete clientInput.__typename;
    delete clientInput.user.__typename;

    methods.reset(clientInput);
  }, [data]);

  const props = {
    expanded,
    setExpanded,
    scrollRef,
  };

  if (loading)
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

  if (error) throw new Error('Something went wrong. Please try again.');

  return (
    <FormProvider {...methods}>
      <View style={{ flex: 1 }}>
        <MainScrollContainer ref={scrollRef} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
          <Name {...props} />
          <Dob {...props} />
          <Gender {...props} />
          <Language {...props} />
          <HMIS {...props} />
          <ContactInfo {...props} />
          <VeteranStatus {...props} />
        </MainScrollContainer>
        <BottomActions
          submitTitle="Update"
          cancel={
            <TextButton
              onPress={router.back}
              fontSize="sm"
              accessibilityHint="cancels the update of a new client profile"
              title="Cancel"
            />
          }
          onSubmit={methods.handleSubmit(onSubmit)}
        />
      </View>
    </FormProvider>
  );
}
