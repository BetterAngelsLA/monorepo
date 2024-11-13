import { Colors } from '@monorepo/expo/shared/static';
import {
  CardWrapper,
  Input,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
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
    clearErrors,
    control,
    getValues,
    formState: { errors },
    setError,
    setValue,
  } = useFormContext<TFullNameForm>();

  const onReset = () => {
    setValue('user.firstName', '');
    setValue('user.middleName', '');
    setValue('user.lastName', '');
    setValue('nickname', '');
    clearErrors('emptyFormError');
  };

  function oneValueExists() {
    const values = getValues();

    const validatable = [
      values.user?.firstName,
      values.user?.lastName,
      values.user?.middleName,
      values.nickname,
    ];

    const hasRequired = validatable.some((v) => !!v?.trim());

    if (hasRequired) {
      clearErrors('emptyFormError');

      return true;
    }

    setError('emptyFormError', {
      type: 'manual',
      message: 'Filling out one of the fields is required',
    });

    return false;
  }

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
        rules={{
          validate: oneValueExists,
        }}
      />
      <Input
        placeholder="Enter Middle Name"
        autoCorrect={false}
        label="Middle Name"
        name="user.middleName"
        control={control}
        rules={{
          validate: oneValueExists,
        }}
      />
      <Input
        placeholder="Enter Last Name"
        autoCorrect={false}
        label="Last Name"
        name="user.lastName"
        control={control}
        rules={{
          validate: oneValueExists,
        }}
      />
      <Input
        placeholder="Enter Nickname"
        autoCorrect={false}
        label="Nickname"
        name="nickname"
        control={control}
        rules={{
          validate: oneValueExists,
        }}
      />
    </CardWrapper>
  );
}
