import { ControlledInput, Form } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import { UpdateClientProfileInput } from '../../../apollo';

type AllowedFieldNames =
  | 'livingSituation'
  | 'veteranStatus'
  | 'preferredLanguage'
  | 'californiaId'
  | 'dateOfBirth';

interface FormField {
  label: string;
  name: AllowedFieldNames;
  placeholder?: string;
}

const FORM_FIELDS: FormField[] = [
  {
    label: 'Date of Birth',
    name: 'dateOfBirth',
  },
  {
    label: 'CA ID#',
    name: 'californiaId',
    placeholder: 'Enter CA ID #',
  },
  {
    label: 'Preferred Language',
    name: 'preferredLanguage',
    // placeholder: 'open picker',
  },
  {
    label: 'Veteran Status',
    name: 'veteranStatus',
    // placeholder: 'open picker',
  },
  {
    label: 'Living Situation',
    name: 'livingSituation',
    // placeholder: 'open picker',
  },
];

export default function PersonalInfoForm() {
  const { control, setValue } = useFormContext<UpdateClientProfileInput>();

  const isError = false;

  return (
    <Form>
      {FORM_FIELDS.map((item, idx) => (
        <Form.Field key={idx} title={item.label}>
          <ControlledInput
            key={item.name}
            name={item.name}
            placeholder={item.placeholder}
            control={control}
            error={isError}
            onDelete={() => setValue(item.name, '')}
            rules={{
              validate: () => {
                return true;
              },
            }}
          />
        </Form.Field>
      ))}
    </Form>
  );
}
