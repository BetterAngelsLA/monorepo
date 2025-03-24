import { Regex } from '@monorepo/expo/shared/static';
import {
  ControlledInput,
  DatePicker,
  Form,
  SingleSelect,
} from '@monorepo/expo/shared/ui-components';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  LanguageEnum,
  LivingSituationEnum,
  UpdateClientProfileInput,
  VeteranStatusEnum,
} from '../../../apollo';
import {
  enumDisplayLanguage,
  enumDisplayLivingSituation,
  enumDisplayVeteranStatus,
} from '../../../static';
import { ProfilePhotoField } from './ProfilePhotoField/ProfilePhotoField';

const languageOptions = Object.entries(enumDisplayLanguage).map(
  ([enumValue, displayValue]) => {
    return {
      value: enumValue,
      displayValue,
    };
  }
);

const veteranStatusOptions = Object.entries(enumDisplayVeteranStatus).map(
  ([enumValue, displayValue]) => {
    return {
      value: enumValue,
      displayValue,
    };
  }
);

const livingSituationOptions = Object.entries(enumDisplayLivingSituation).map(
  ([enumValue, displayValue]) => {
    return {
      value: enumValue,
      displayValue,
    };
  }
);

export default function PersonalInfoForm() {
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<UpdateClientProfileInput>();

  const [id, dateOfBirth, preferredLanguage, veteranStatus, livingSituation] =
    useWatch({
      control,
      name: [
        'id',
        'dateOfBirth',
        'preferredLanguage',
        'veteranStatus',
        'livingSituation',
      ],
    });

  return (
    <Form>
      <Form.Field>
        <ProfilePhotoField clientId={id} />
      </Form.Field>

      <Form.Field title="CA ID#">
        <ControlledInput
          name="californiaId"
          placeholder="Enter CA ID #"
          control={control}
          error={!!errors.californiaId}
          errorMessage={errors.californiaId?.message}
          onDelete={() => setValue('californiaId', '')}
          rules={{
            validate: (value: string) => {
              if (value === '') {
                return true;
              }

              if (value && !Regex.californiaId.test(value)) {
                return 'CA ID must be 1 letter followed by 7 digits';
              }

              return true;
            },
          }}
        />
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

      <Form.Field title="Living Situation">
        <SingleSelect
          placeholder="Select situation"
          items={livingSituationOptions}
          selectedValue={livingSituation || undefined}
          onChange={(value) =>
            setValue('livingSituation', value as LivingSituationEnum)
          }
        />
      </Form.Field>

      <Form.Field title="Veteran Status">
        <SingleSelect
          placeholder="Select veteran status"
          items={veteranStatusOptions}
          selectedValue={veteranStatus || undefined}
          onChange={(value) =>
            setValue('veteranStatus', value as VeteranStatusEnum)
          }
        />
      </Form.Field>

      <Form.Field title="Preferred Language">
        <SingleSelect
          placeholder="Select language"
          items={languageOptions}
          selectedValue={preferredLanguage || undefined}
          onChange={(value) =>
            setValue('preferredLanguage', value as LanguageEnum)
          }
        />
      </Form.Field>
    </Form>
  );
}
