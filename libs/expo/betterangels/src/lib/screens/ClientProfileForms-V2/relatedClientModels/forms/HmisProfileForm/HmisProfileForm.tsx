import {
  ControlledInput,
  Form,
  SingleSelect,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { enumDisplayHmisAgency } from 'libs/expo/betterangels/src/lib/static';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';
import { TClientProfile } from '../../../../Client/ClientProfile_V2/types';
import { toHmisFormEntity } from './toHmisFormEntity';

export type THmisProfileFormInputs = {
  hmisId: string;
  agency: string;
};

export const defaultFormState: THmisProfileFormInputs = {
  hmisId: '',
  agency: '',
};

// TClientProfileHmisProfile
type TProps = {
  clientProfile?: TClientProfile;
  relationId?: string;
};

export function HmisProfileForm(props: TProps) {
  const { clientProfile, relationId } = props;

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<THmisProfileFormInputs>({
    defaultValues: defaultFormState,
  });

  const [hmisIdValue, agencyValue] = useWatch({
    control,
    name: ['hmisId', 'agency'],
  });

  useEffect(() => {
    const { agency, hmisId } = toHmisFormEntity({ clientProfile, relationId });

    setValue('hmisId', hmisId);
    setValue('agency', agency);
  }, [clientProfile, relationId, setValue]);

  return (
    <View style={{}}>
      <TextRegular mb="lg">Fill in both HIMIS ID Type and ID#</TextRegular>
      <Form>
        <Form.Fieldset>
          <SingleSelect
            label="Type of HMIS ID"
            placeholder="Select situation"
            items={Object.entries(enumDisplayHmisAgency).map(
              ([value, displayValue]) => ({ value, displayValue })
            )}
            selectedValue={agencyValue}
            onChange={(value) => setValue('agency', value || '')}
          />

          <ControlledInput
            label={'HMIS ID'}
            name={'hmisId'}
            placeholder={'Enter HMIS ID'}
            control={control}
            // error={showError}
            onDelete={() => setValue('hmisId', '')}
            rules={{
              validate: () => {
                return true;
              },
            }}
          />
        </Form.Fieldset>
      </Form>
    </View>
  );
}
