import { ControlledInput, FormCard } from '@monorepo/expo/shared/ui-components';
import { useFormContext, useWatch } from 'react-hook-form';
import { UpdateClientProfileInput } from '../../../apollo';

type AllowedFieldNames =
  | 'user.firstName'
  | 'user.middleName'
  | 'user.lastName'
  | 'nickname';

interface FormField {
  label: string;
  name: AllowedFieldNames;
}

const FORM_FIELDS: FormField[] = [
  { label: 'First Name', name: 'user.firstName' },
  { label: 'Middle Name', name: 'user.middleName' },
  { label: 'Last Name', name: 'user.lastName' },
  { label: 'Nickname', name: 'nickname' },
];

export default function Fullname() {
  const { control } = useFormContext<UpdateClientProfileInput>();

  const [firstName, middleName, lastName, nickname] = useWatch({
    control,
    name: ['user.firstName', 'user.middleName', 'user.lastName', 'nickname'],
  });

  const isError = !firstName && !middleName && !lastName && !nickname;

  return (
    <FormCard
      title="Full Name*"
      subtitle="Filling out one of the fields required"
      subtitleError={isError}
    >
      {FORM_FIELDS.map((item) => (
        <ControlledInput
          key={item.name}
          label={item.label}
          name={item.name}
          control={control}
          error={isError}
          rules={{
            validate: () => {
              if (isError) {
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
