import { Colors } from '@monorepo/expo/shared/static';
import {
  BottomActions,
  Loading,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { format, parse } from 'date-fns';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../apollo';
import { MainScrollContainer } from '../../ui-components';
import { useCreateClientProfileMutation } from '../AddClient/__generated__/AddClient.generated';
import ContactInfo from './ContactInfo';
import Dob from './Dob';
import Gender from './Gender';
import HMIS from './HMIS';
import Language from './Language';
import Name from './Name';
import VeteranStatus from './VeteranStatus';
import {
  useGetClientProfileQuery,
  useUpdateClientProfileMutation,
} from './__generated__/AddEditClient.generated';

export default function AddEditClient({ id }: { id: string }) {
  const { data, loading, error, refetch } = useGetClientProfileQuery({
    variables: { id },
    skip: !id,
  });

  const methods = useForm<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const [expanded, setExpanded] = useState<undefined | string | null>();
  const [updateClient] = useUpdateClientProfileMutation();
  const [createClient] = useCreateClientProfileMutation();
  const router = useRouter();
  const [initialDate, setInitialDate] = useState<Date | undefined>();
  const scrollRef = useRef<ScrollView>(null);

  const onSubmit: SubmitHandler<
    UpdateClientProfileInput | CreateClientProfileInput
  > = async (values) => {
    const input = {
      ...values,
    };

    if (values.dateOfBirth) {
      const parsedDate = parse(values.dateOfBirth, 'MM/dd/yyyy', new Date());
      input.dateOfBirth = format(parsedDate, 'yyyy-MM-dd');
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
      router.replace(`/client/${id}`);
    } catch (err) {
      throw new Error(`Failed to update a client profile 2: ${err}`);
    }
  };

  useEffect(() => {
    if (!data || !('clientProfile' in data) || !id) return;

    const clientInput = {
      ...data.clientProfile,
    };

    if (data.clientProfile.dateOfBirth) {
      const parsedDate = parse(
        data.clientProfile.dateOfBirth,
        'yyyy-MM-dd',
        new Date()
      );
      setInitialDate(parsedDate);
      clientInput.dateOfBirth = format(parsedDate, 'MM/dd/yyyy');
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
          <Dob initialDate={initialDate} {...props} />
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
