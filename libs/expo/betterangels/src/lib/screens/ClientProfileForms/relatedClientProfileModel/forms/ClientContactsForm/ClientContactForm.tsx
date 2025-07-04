import { Colors, Regex } from '@monorepo/expo/shared/static';
import {
  ControlledInput,
  Form,
  PhoneNumberInput,
  SingleSelect,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Controller } from 'react-hook-form';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSnackbar } from '../../../../../hooks';
import { clientRelevantContactEnumDisplay } from '../../../../../static';
import AddressAutocomplete from '../../../../../ui-components/AddressField';
import { TClientProfile } from '../../../../Client/ClientProfile/types';
import { ClientContactDeleteBtn } from '../ClientContactDeleteBtn';
import { useClientContactForm } from './useClientContactForm';

type TProps = {
  clientProfile?: TClientProfile;
  relationId?: string;
};

export function ClientContactForm(props: TProps) {
  const { clientProfile, relationId } = props;

  const scrollRef = useRef<ScrollView | null>(null);
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const {
    control,
    errors,
    isSubmitted,
    handleSubmit,
    onSubmit,
    isLoading,
    setIsLoading,
    isError,
    setValue,
    clearErrors,
  } = useClientContactForm({ clientProfile, relationId, router, showSnackbar });

  const isEditMode = !!relationId;
  const clientProfileId = clientProfile?.id;

  if (!clientProfileId) {
    return null;
  }

  return (
    <Form.Page
      scrollViewRef={scrollRef}
      actionProps={{
        onSubmit: handleSubmit(onSubmit),
        onLeftBtnClick: router.back,
        disabled: isLoading,
      }}
    >
      <View style={styles.formWrapper}>
        <TextRegular
          mb="lg"
          color={isSubmitted && isError ? Colors.ERROR : undefined}
        >
          Please select the type of relevant contact and enter at least one form
          of contact information.
        </TextRegular>

        <Form>
          <Form.Fieldset>
            <Controller
              name="relationshipToClient"
              control={control}
              render={({ field: { onChange, value } }) => (
                <SingleSelect
                  disabled={isLoading}
                  label="Relevant contact type"
                  placeholder="Select the relevant contact type"
                  items={Object.entries(clientRelevantContactEnumDisplay).map(
                    ([value, displayValue]) => ({ value, displayValue })
                  )}
                  selectedValue={value}
                  onChange={(value) => onChange(value)}
                />
              )}
            />

            <ControlledInput
              name={'name'}
              control={control}
              disabled={isLoading}
              label={'Name'}
              placeholder={'Enter name'}
              onDelete={() => {
                setValue('name', '');
                clearErrors('name');
              }}
              error={!!errors.name}
              errorMessage={errors.name?.message}
            />

            <ControlledInput
              name="email"
              control={control}
              disabled={isLoading}
              label="Email"
              placeholder="Enter email address"
              onDelete={() => {
                setValue('email', '');
                clearErrors('email');
              }}
              error={!!errors.email}
              errorMessage={(errors.email?.message as string) || undefined}
              rules={{
                validate: (value: string) => {
                  if (value && !Regex.email.test(value)) {
                    return 'Enter a valid email address';
                  }

                  return true;
                },
              }}
            />

            <PhoneNumberInput
              label="Phone Number XX"
              control={control}
              name="phoneNumber"
              placeholderNumber="Enter phone number"
              placeholderExt="ext"
              disabled={isLoading}
              // error={!!errors.phoneNumber}
              // errorMessage={errors.phoneNumber?.message}
              rules={{
                validate: (value?: string) => {
                  // no value ok unless required
                  if (!value) {
                    return true;
                  }

                  if (!Regex.phoneNumberWithExtensionUS.test(value)) {
                    return 'Enter a valid 10-digit phone number with optional extension number';
                  }

                  return true;
                },
              }}
            />

            <AddressAutocomplete
              control={control}
              disabled={isLoading}
              label="Mailing Address"
              name="mailingAddress"
              placeholder="Enter mailing address"
              focusScroll={{ scrollViewRef: scrollRef }}
            />
          </Form.Fieldset>
        </Form>

        {isEditMode && (
          <ClientContactDeleteBtn
            relationId={relationId}
            clientProfileId={clientProfileId}
            setIsLoading={setIsLoading}
            disabled={isLoading}
          />
        )}
      </View>
    </Form.Page>
  );
}

const styles = StyleSheet.create({
  formWrapper: {
    paddingBottom: 240, // give view space to scrollTop on AddressAutocomplete focus
  },
});
