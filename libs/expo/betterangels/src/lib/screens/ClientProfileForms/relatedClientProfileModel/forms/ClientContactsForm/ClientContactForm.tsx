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

  function onPhoneNumberChange(value) {
    console.log('~~~~~~~~home value');
    console.log(value);
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
            <PhoneNumberInput
              value="2125551212x123"
              // onChange={(value) => setValue('phoneNumber', value)}
              onClear={() => {
                setValue('phoneNumber', '');
                clearErrors('phoneNumber');
              }}
              // errors={errors.phoneNumber}
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
              value="2125551212x123"
              onChange={onPhoneNumberChange}
              label={'Phone Number'}
              name={'phoneNumber'}
              control={control}
              // onChange={(value) => setValue('phoneNumber', value)}
              // errors={errors.phoneNumber}
            />
            {/* <View style={{ flexDirection: 'row' }}>
              <ControlledInput
                style={{ flex: 2, marginRight: Spacings.xs }}
                name={'phoneNumber'}
                control={control}
                disabled={isLoading}
                label={'Phone Number'}
                placeholder="Enter phone number"
                keyboardType="number-pad"
                onDelete={() => {
                  setValue('phoneNumber', '');
                  clearErrors('phoneNumber');
                }}
                error={!!errors.phoneNumber}
                rules={{
                  validate: (value: string) => {
                    if (value && !Regex.phoneNumber.test(value)) {
                      return 'Enter a 10-digit phone number without space or special characters';
                    }

                    return true;
                  },
                }}
              />
              <ControlledInput
                style={{ flex: 1 }}
                name={'extension'}
                control={control}
                disabled={isLoading}
                label={' '}
                placeholder="ext"
                keyboardType="number-pad"
                onDelete={() => {
                  setValue('extension', '');
                  clearErrors('extension');
                }}
                error={!!errors.extension}
                rules={{
                  validate: (value: string) => {
                    if (value && !Regex.number.test(value)) {
                      return 'Extension must be a number';
                    }

                    return true;
                  },
                }}
              />
            </View> */}
            {/* <View style={{ marginTop: -Spacings.xs }}>
              {errors.phoneNumber && (
                <TextRegular size={'sm'} color={Colors.ERROR}>
                  {errors.phoneNumber?.message}
                </TextRegular>
              )}
              {errors.extension && (
                <TextRegular size={'sm'} color={Colors.ERROR}>
                  {errors.extension?.message}
                </TextRegular>
              )}
            </View> */}

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
