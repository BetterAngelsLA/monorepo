import { Colors } from '@monorepo/expo/shared/static';
import {
  CardWrapper,
  Input,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Text } from 'react-native';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';

type TFullNameForm = (UpdateClientProfileInput | CreateClientProfileInput) & {
  emptyFormError: string;
};

export default function FullName() {
  const {
    control,
    formState: { errors, isDirty },
    setError,
    setValue,
    clearErrors,
  } = useFormContext<TFullNameForm>();

  const onReset = () => {
    setValue('user.firstName', '');
    setValue('user.middleName', '');
    setValue('user.lastName', '');
    setValue('nickname', '');
    clearErrors('emptyFormError');
  };

  const [firstName, middleName, lastName, nickname] = useWatch({
    control,
    name: ['user.firstName', 'user.middleName', 'user.lastName', 'nickname'],
  });

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const hasValue = firstName || middleName || lastName || nickname;

    if (hasValue) {
      clearErrors('emptyFormError');

      return;
    }

    setError('emptyFormError', {
      type: 'manual',
      message: 'Filling out one of the fields is required',
    });
  }, [firstName, middleName, lastName, nickname, setError, clearErrors]);

  return (
    <CardWrapper
      onReset={onReset}
      title={
        <>
          Full Name<Text style={{ color: Colors.ERROR }}>*</Text>
        </>
      }
    >
      {!errors.emptyFormError && (
        <TextRegular size="sm" mb="xs">
          (Filling out one of the fields is required)
        </TextRegular>
      )}

      {errors.emptyFormError && (
        <TextRegular size="sm" mb="xs" color={Colors.ERROR}>
          {errors.emptyFormError.message}
        </TextRegular>
      )}

      <Input
        placeholder="Enter First Name"
        autoCorrect={false}
        label="First Name"
        name="user.firstName"
        control={control}
      />
      <Input
        placeholder="Enter Middle Name"
        autoCorrect={false}
        label="Middle Name"
        name="user.middleName"
        control={control}
      />
      <Input
        placeholder="Enter Last Name"
        autoCorrect={false}
        label="Last Name"
        name="user.lastName"
        control={control}
      />
      <Input
        placeholder="Enter Nickname"
        autoCorrect={false}
        label="Nickname"
        name="nickname"
        control={control}
      />
    </CardWrapper>
  );
}
