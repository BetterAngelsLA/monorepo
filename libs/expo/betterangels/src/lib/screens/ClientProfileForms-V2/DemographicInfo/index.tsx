import {
  ControlledInput,
  Form,
  SingleSelect,
} from '@monorepo/expo/shared/ui-components';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  EyeColorEnum,
  GenderEnum,
  HairColorEnum,
  MaritalStatusEnum,
  PronounEnum,
  RaceEnum,
  UpdateClientProfileInput,
} from '../../../apollo';
import {
  enumDisplayEyeColor,
  enumDisplayGender,
  enumDisplayPronoun,
  enumDisplayRace,
} from '../../../static';
import Height from './Height';

export default function DemographicInfo() {
  const { control, setValue } = useFormContext<UpdateClientProfileInput>();

  const [gender, pronouns, race] = useWatch({
    control,
    name: ['gender', 'pronouns', 'race'],
  });

  return (
    <Form>
      <Form.Field title="Gender">
        <SingleSelect
          placeholder="Select gender"
          selectedValue={gender}
          items={Object.entries(enumDisplayGender).map(
            ([value, displayValue]) => ({ value, displayValue })
          )}
          onChange={(e) => setValue('gender', e as GenderEnum)}
        />
      </Form.Field>

      <Form.Field title="Pronouns">
        <SingleSelect
          placeholder="Select pronouns"
          selectedValue={pronouns}
          items={Object.entries(enumDisplayPronoun).map(
            ([value, displayValue]) => ({ value, displayValue })
          )}
          onChange={(e) => setValue('pronouns', e as PronounEnum)}
        />
      </Form.Field>

      <Form.Field title="Race">
        <SingleSelect
          placeholder="Select race"
          selectedValue={race}
          items={Object.entries(enumDisplayRace).map(
            ([value, displayValue]) => ({ value, displayValue })
          )}
          onChange={(e) => setValue('race', e as RaceEnum)}
        />
      </Form.Field>

      <Form.Field title="Place of Birth">
        <ControlledInput
          placeholder="Enter place of birth"
          name="placeOfBirth"
          control={control}
          onDelete={() => setValue('placeOfBirth', '')}
        />
      </Form.Field>

      <Height />

      <Form.Field title="Eye Color">
        <SingleSelect
          placeholder="Select eye color"
          selectedValue={pronouns}
          items={Object.entries(enumDisplayEyeColor).map(
            ([value, displayValue]) => ({ value, displayValue })
          )}
          onChange={(e) => setValue('eyeColor', e as EyeColorEnum)}
        />
      </Form.Field>

      <Form.Field title="Hair Color">
        <SingleSelect
          placeholder="Select hair color"
          selectedValue={pronouns}
          items={Object.entries(enumDisplayEyeColor).map(
            ([value, displayValue]) => ({ value, displayValue })
          )}
          onChange={(e) => setValue('hairColor', e as HairColorEnum)}
        />
      </Form.Field>

      <Form.Field title="Marital Status">
        <SingleSelect
          placeholder="Select marital status"
          selectedValue={pronouns}
          items={Object.entries(enumDisplayEyeColor).map(
            ([value, displayValue]) => ({ value, displayValue })
          )}
          onChange={(e) => setValue('maritalStatus', e as MaritalStatusEnum)}
        />
      </Form.Field>

      <Form.Field title="Physical Description">
        <ControlledInput
          placeholder="Enter physical description"
          name="physicalDescription"
          control={control}
          onDelete={() => setValue('physicalDescription', '')}
        />
      </Form.Field>
    </Form>
  );
}
