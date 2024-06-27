import { Colors } from '@monorepo/expo/shared/static';
import {
  BottomActions,
  Loading,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { format, parse } from 'date-fns';
import { useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { UpdateClientProfileInput } from '../../apollo';
import { MainScrollContainer } from '../../ui-components';
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
} from './__generated__/EditClient.generated';

export default function EditClient({ id }: { id: string }) {
  const { data, loading, error, refetch } = useGetClientProfileQuery({
    variables: { id },
  });

  const [expanded, setExpanded] = useState<undefined | string | null>();
  const [client, setClient] = useState<UpdateClientProfileInput | undefined>();
  const [updateClient] = useUpdateClientProfileMutation();
  const [errorState, setErrorState] = useState<string | null>(null);
  const navigation = useNavigation();
  const [initialDate, setInitialDate] = useState<Date | undefined>();
  const scrollRef = useRef<ScrollView>(null);

  const updateClientProfile = async () => {
    if (!client?.user?.firstName) {
      setErrorState('First Name is required');
      return;
    }
    setErrorState(null);
    const input = {
      ...client,
      id,
      user: {
        id: client.user.id,
        firstName: client.user.firstName,
        lastName: client.user.lastName,
        email: client.user.email,
        middleName: client.user.middleName,
      },
    };

    if (client.dateOfBirth) {
      const parsedDate = parse(client.dateOfBirth, 'MM/dd/yyyy', new Date());
      input.dateOfBirth = format(parsedDate, 'yyyy-MM-dd');
    }

    try {
      const { data } = await updateClient({
        variables: {
          data: input,
        },
      });
      if (
        data?.updateClientProfile?.__typename === 'OperationInfo' &&
        data.updateClientProfile.messages
      ) {
        throw new Error(
          `Failed to update a client profile: ${data?.updateClientProfile.messages[0].message}`
        );
      }
      refetch();
      navigation.goBack();
    } catch (err) {
      throw new Error(`Failed to update a client profile: ${err}`);
    }
  };

  useEffect(() => {
    if (!data || !('clientProfile' in data)) return;

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

    setClient(clientInput);
  }, [data]);

  const props = {
    expanded,
    setExpanded,
    client,
    setClient,
    scrollRef,
    errorState,
  };

  if (loading || !client)
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
            onPress={navigation.goBack}
            fontSize="sm"
            accessibilityHint="cancels the update of a new client profile"
            title="Cancel"
          />
        }
        onSubmit={updateClientProfile}
      />
    </View>
  );
}
