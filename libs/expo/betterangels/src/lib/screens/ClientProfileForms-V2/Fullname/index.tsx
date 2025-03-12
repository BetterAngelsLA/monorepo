import { FormInput } from '@monorepo/expo/shared/ui-components';
import { useFormContext, useWatch } from 'react-hook-form';
import { UpdateClientProfileInput } from '../../../apollo';
import { FormCard } from '../../../ui-components';

const FORM_DATA = [
  {
    label: 'First Name',
    name: 'user.firstName',
  },
  { label: 'Middle Name', name: 'user.middleName' },
  { label: 'Last Name', name: 'user.lastName' },
  { label: 'Nickname', name: 'nickname' },
];

export default function Fullname() {
  const {
    control,
    formState: { errors },
  } = useFormContext<UpdateClientProfileInput>();

  const [firstName, middleName, lastName, nickname] = useWatch({
    control,
    name: ['user.firstName', 'user.middleName', 'user.lastName', 'nickname'],
  });

  return (
    <FormCard
      title="Full Name*"
      subtitle="Filling out one of the fields required"
    >
      {FORM_DATA.map((item) => (
        <FormInput
          key={item.name}
          label={item.label}
          name={item.name}
          autoCorrect={false}
          control={control}
          error={!!errors.nickname}
          rules={{
            validate: () => {
              if (!firstName && !middleName && !lastName && !nickname) {
                return 'At least one field must be filled.';
              }
              return true;
            },
          }}
        />
      ))}
    </FormCard>
  );
}
