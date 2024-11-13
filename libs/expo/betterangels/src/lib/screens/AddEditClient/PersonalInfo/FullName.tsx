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

export default function FullName() {
  const {
    control,
    getValues,
    formState: { errors },
    setValue,
  } = useFormContext<UpdateClientProfileInput | CreateClientProfileInput>();

  const onReset = () => {
    setValue('user.firstName', '', { shouldValidate: true });
    setValue('user.middleName', '');
    setValue('user.lastName', '');
    setValue('nickname', '');
  };

  function oneValueExists() {
    const values = getValues();

    const hasValue =
      values.user?.firstName ||
      values.user?.lastName ||
      values.user?.middleName ||
      values.nickname;

    return !!hasValue;
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
      {!errors.user?.firstName && (
        <TextRegular size="sm" mb="xs">
          (Filling out one of the fields is required)
        </TextRegular>
      )}

      {errors.user?.firstName && (
        <TextRegular size="sm" mb="xs" color={Colors.ERROR}>
          Filling out one of the fields is required
        </TextRegular>
      )}

      <Input
        placeholder="Enter First Name"
        autoCorrect={false}
        label="First Name"
        name="user.firstName"
        control={control}
        rules={{
          required: !oneValueExists(),
        }}
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
