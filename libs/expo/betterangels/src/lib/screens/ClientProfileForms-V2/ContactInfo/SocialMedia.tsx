import { ControlledInput, Form } from '@monorepo/expo/shared/ui-components';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { UpdateClientProfileInput } from '../../../apollo';
import { enumDisplaySocialMedia } from '../../../static';

export default function SocialMedia() {
  const { control, setValue } = useFormContext<UpdateClientProfileInput>();

  const { fields } = useFieldArray({
    control,
    name: 'socialMediaProfiles',
  });
  return (
    <Form.Fieldset title="Social Media">
      {fields.map((field, index) => (
        <ControlledInput
          key={field.id}
          control={control}
          name={`socialMediaProfiles.${index}.platformUserId`}
          placeholder={`Enter ${
            field.platform && enumDisplaySocialMedia[field.platform]
          } username`}
          label={
            (field.platform && enumDisplaySocialMedia[field.platform]) || ''
          }
          onDelete={() =>
            setValue(`socialMediaProfiles.${index}.platformUserId`, '')
          }
        />
      ))}
    </Form.Fieldset>
  );
}
