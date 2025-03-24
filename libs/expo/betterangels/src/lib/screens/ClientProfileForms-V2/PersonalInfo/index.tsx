import { Regex } from '@monorepo/expo/shared/static';
import {
  ControlledInput,
  DatePicker,
  Form,
} from '@monorepo/expo/shared/ui-components';
import { useFormContext, useWatch } from 'react-hook-form';
import { UpdateClientProfileInput } from '../../../apollo';
import { ProfilePhotoField } from './ProfilePhotoField/ProfilePhotoField';

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
  const { control, setValue, watch } =
    useFormContext<UpdateClientProfileInput>();

  const clientId = useWatch({
    control,
    name: 'id',
  });

  const dateOfBirth = watch('dateOfBirth');

  const isError = false;

  return (
    <Form>
      <Form.Field>
        <ProfilePhotoField clientId={clientId} />
      </Form.Field>

      <Form.Field title="Date of Birth">
        <DatePicker
          disabled
          maxDate={new Date()}
          pattern={Regex.date}
          mode="date"
          format="MM/dd/yyyy"
          placeholder="Enter Date of Birth"
          minDate={new Date('1900-01-01')}
          mt="xs"
          value={dateOfBirth}
          setValue={(date) => setValue('dateOfBirth', date)}
        />
      </Form.Field>

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
