import { Regex } from '@monorepo/expo/shared/static';
import {
  ActionModal,
  CardWrapper,
  Input,
} from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  CreateClientProfileInput,
  InputMaybe,
  UpdateClientProfileInput,
} from '../../../apollo';
import { useCaliforniaIdUniqueCheck } from '../../../hooks';

export default function CaliforniaId() {
  const {
    control,
    formState: { errors },
    setError,
    clearErrors,
  } = useFormContext<UpdateClientProfileInput | CreateClientProfileInput>();
  const [modalVisible, setModalVisible] = useState(false);

  const { id: clientProfileId } = useLocalSearchParams();
  const [californiaId] = useWatch({
    control,
    name: ['californiaId'],
  });

  const uniqueCheckError = useCaliforniaIdUniqueCheck(
    californiaId as string,
    clientProfileId as string
  );

  // TODO: replace with Feature Flag
  function featureAvailable(californiaId?: string | InputMaybe<string>) {
    const FEATURE_ENABLED_FOR_ID = 'A1111111';

    return californiaId && californiaId === FEATURE_ENABLED_FOR_ID;
  }

  useEffect(() => {
    if (featureAvailable(californiaId) && uniqueCheckError) {
      setModalVisible(true);
    } else {
      clearErrors('californiaId');
    }
  }, [californiaId, uniqueCheckError, setError, clearErrors]);

  return (
    <CardWrapper title="CA ID #">
      <ActionModal
        title="This client has the same CA ID as another client."
        subtitle="Would you like to see a list of clients with the same CA ID?"
        secondaryButtonTitle="No"
        primaryButtonTitle="Yes"
        onPrimaryPress={() => console.log('primary pressed')}
        onSecondaryPress={() =>
          setError('californiaId', {
            type: 'manual',
            message: uniqueCheckError,
          })
        }
        onClose={() =>
          setError('californiaId', {
            type: 'manual',
            message: uniqueCheckError,
          })
        }
        visible={modalVisible}
        setVisible={setModalVisible}
      />
      <Input
        autoCapitalize="characters"
        autoCorrect={false}
        control={control}
        error={!!errors.californiaId}
        errorMessage={(errors.californiaId?.message as string) || undefined}
        name="californiaId"
        placeholder="Enter CA ID #"
        rules={{
          validate: (value: string) => {
            if (value && !Regex.californiaId.test(value)) {
              return 'CA ID must be 1 letter followed by 7 digits';
            }
            if (uniqueCheckError) {
              return uniqueCheckError;
            }
            return true;
          },
        }}
      />
    </CardWrapper>
  );
}
