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
  const [visible, setVisible] = useState(false);

  const { id: clientProfileId } = useLocalSearchParams();
  const [californiaId] = useWatch({
    control,
    name: ['californiaId'],
  });

  const uniqueCheckError = useCaliforniaIdUniqueCheck(
    californiaId as string,
    clientProfileId as string
  );

  useEffect(() => {
    if (uniqueCheckError) {
      setError('californiaId', {
        type: 'manual',
        message: uniqueCheckError,
      });
      setVisible(true);
    } else {
      clearErrors('californiaId');
    }
  }, [uniqueCheckError, setError, clearErrors]);

  return (
    <CardWrapper title="CA ID #">
      <ActionModal
        title="Duplicate Name Detected"
        subtitle="Would you like to see a list of clients with the same name?"
        secondaryButtonTitle="No"
        primaryButtonTitle="Yes"
        onPrimaryPress={() => console.log('primary pressed')}
        visible={visible}
        setVisible={setVisible}
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
