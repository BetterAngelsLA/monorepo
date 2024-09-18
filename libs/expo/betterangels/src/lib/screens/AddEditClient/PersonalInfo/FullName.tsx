import { Colors } from '@monorepo/expo/shared/static';
import { CardWrapper, Input } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import { Text } from 'react-native';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';

export default function FullName() {
  const {
    control,
    formState: { errors },
    setValue,
  } = useFormContext<UpdateClientProfileInput | CreateClientProfileInput>();

  const onReset = () => {
    setValue('user.firstName', '');
    setValue('user.middleName', '');
    setValue('user.lastName', '');
    setValue('nickname', '');
  };

  return (
    <CardWrapper
      onReset={onReset}
      title={
        <>
          Full Name<Text style={{ color: Colors.ERROR }}>*</Text>
        </>
      }
      subtitle="(Filling out one of the fields is required)"
    >
      <Input
        placeholder="Enter First Name"
        autoCorrect={false}
        required
        error={!!errors.user?.firstName}
        rules={{
          required: true,
        }}
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
