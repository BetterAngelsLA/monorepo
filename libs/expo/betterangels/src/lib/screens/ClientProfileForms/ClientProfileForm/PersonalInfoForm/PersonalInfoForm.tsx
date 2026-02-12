import { Regex } from '@monorepo/expo/shared/static';
import {
  ActionModal,
  ControlledInput,
  DatePicker,
  Form,
  SingleSelect,
} from '@monorepo/expo/shared/ui-components';
import { useFeatureFlagActive } from '@monorepo/react/shared';
import { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Keyboard } from 'react-native';
import {
  LanguageEnum,
  LivingSituationEnum,
  UpdateClientProfileInput,
  VeteranStatusEnum,
} from '../../../../apollo';
import { useCaliforniaIdUniqueCheck } from '../../../../hooks';
import {
  enumDisplayLanguage,
  enumDisplayLivingSituation,
  enumDisplayVeteranStatus,
  FeatureFlags,
} from '../../../../static';

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

export function PersonalInfoForm() {
  const {
    control,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useFormContext<UpdateClientProfileInput>();

  const [dedupeModalVisible, setDedupeModalVisible] = useState(false);

  const [
    id,
    californiaId,
    dateOfBirth,
    preferredLanguage,
    veteranStatus,
    livingSituation,
  ] = useWatch({
    control,
    name: [
      'id',
      'californiaId',
      'dateOfBirth',
      'preferredLanguage',
      'veteranStatus',
      'livingSituation',
    ],
  });

  const clientDedupeFeatureOn = useFeatureFlagActive(
    FeatureFlags.CLIENT_DEDUPE_FF
  );

  const uniqueCheckError = useCaliforniaIdUniqueCheck(
    californiaId as string,
    id as string
  );

  useEffect(() => {
    if (!clientDedupeFeatureOn) {
      return;
    }

    if (!uniqueCheckError) {
      clearErrors('californiaId');

      return;
    }

    // uniqueCheckError exists: show Dedupe modal
    // If keyboard not dismissed, modal does not render fullscreen on some Android devices.
    Keyboard.dismiss();

    // TODO: confirm if it breaks on Android after upgrade to New Architecture
    setTimeout(() => {
      setDedupeModalVisible(true);
    }, 100);
  }, [clientDedupeFeatureOn, californiaId, uniqueCheckError, clearErrors]);

  return (
    <Form>
      <Form.Field title="CA ID#">
        <ActionModal
          title="This client has the same CA ID as another client."
          subtitle="Would you like to see a list of clients with the same CA ID?"
          secondaryButtonTitle="No"
          primaryButtonTitle="Yes"
          onPrimaryPress={() => console.log('primary pressed')}
          onSecondaryPress={() =>
            setError('californiaId', {
              type: 'manual',
              message: uniqueCheckError,
            })
          }
          onClose={() =>
            setError('californiaId', {
              type: 'manual',
              message: uniqueCheckError,
            })
          }
          visible={dedupeModalVisible}
          setVisible={setDedupeModalVisible}
        />

        <ControlledInput
          name="californiaId"
          placeholder="Enter CA ID #"
          control={control}
          error={!!errors.californiaId || !!uniqueCheckError}
          errorMessage={errors.californiaId?.message || uniqueCheckError}
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
          type="numeric"
          placeholder="Enter date"
          validRange={{
            endDate: new Date(),
            startDate: new Date('1900-01-01'),
          }}
          value={dateOfBirth || undefined}
          onChange={(date) => {
            setValue('dateOfBirth', date);
          }}
          onDelete={() => {
            setValue('dateOfBirth', null);
          }}
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
