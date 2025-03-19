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
  placeholder: string;
}

const FORM_FIELDS: FormField[] = [
  {
    label: 'First Name',
    name: 'user.firstName',
    placeholder: 'Enter first name',
  },
  {
    label: 'Middle Name',
    name: 'user.middleName',
    placeholder: 'Enter middle name',
  },
  { label: 'Last Name', name: 'user.lastName', placeholder: 'Enter last name' },
  { label: 'Nickname', name: 'nickname', placeholder: 'Enter nickname' },
];

export default function Fullname() {
  const { control, setValue } = useFormContext<UpdateClientProfileInput>();

  const [firstName, middleName, lastName, nickname] = useWatch({
    control,
    name: ['user.firstName', 'user.middleName', 'user.lastName', 'nickname'],
  });

  const isError = !firstName && !middleName && !lastName && !nickname;

  return (
    <FormCard
      title="Full Name"
      required
      subtitle="Filling out one of the fields required"
      subtitleError={isError}
    >
      {FORM_FIELDS.map((item) => (
        <ControlledInput
          key={item.name}
          label={item.label}
          name={item.name}
          placeholder={item.placeholder}
          control={control}
          error={isError}
          onDelete={() => setValue(item.name, '')}
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
