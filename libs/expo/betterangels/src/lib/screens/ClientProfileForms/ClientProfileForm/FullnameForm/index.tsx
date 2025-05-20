import { ControlledInput, Form } from '@monorepo/expo/shared/ui-components';
import { useFormContext, useWatch } from 'react-hook-form';
import { UpdateClientProfileInput } from '../../../../apollo';

type AllowedFieldNames = 'firstName' | 'middleName' | 'lastName' | 'nickname';

interface FormField {
  label: string;
  name: AllowedFieldNames;
  placeholder: string;
}

const FORM_FIELDS: FormField[] = [
  {
    label: 'First Name',
    name: 'firstName',
    placeholder: 'Enter first name',
  },
  {
    label: 'Middle Name',
    name: 'middleName',
    placeholder: 'Enter middle name',
  },
  { label: 'Last Name', name: 'lastName', placeholder: 'Enter last name' },
  { label: 'Nickname', name: 'nickname', placeholder: 'Enter nickname' },
];

export default function FullNameForm() {
  const { control, setValue, formState } =
    useFormContext<UpdateClientProfileInput>();
  const { isSubmitted } = formState;

  const fieldNames = FORM_FIELDS.map((f) => f.name);

  const [firstName, middleName, lastName, nickname] = useWatch({
    control,
    name: fieldNames,
  });

  const isError = !firstName && !middleName && !lastName && !nickname;
  const showError = isSubmitted && isError;

  return (
    <Form>
      <Form.Fieldset
        title="Full Name"
        subtitle="Filling out one of the fields is required"
        subtitleError={showError}
        required
      >
        {FORM_FIELDS.map((item) => (
          <ControlledInput
            key={item.name}
            label={item.label}
            name={item.name}
            placeholder={item.placeholder}
            control={control}
            error={showError}
            onDelete={() => setValue(item.name, '')}
            rules={{
              validate: () => {
                if (showError) {
                  return 'At least one field must be filled.';
                }
                return true;
              },
            }}
          />
        ))}
      </Form.Fieldset>
    </Form>
  );
}
