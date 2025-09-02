import {
  HMISLoginForm,
  LoginForm,
  SignInContainer,
} from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';
import React, { memo } from 'react';
import { privacyPolicyUrl, termsOfServiceUrl } from '../../config';

type Provider = 'hmis' | 'ba';

const providerToForm: Record<Provider, React.ComponentType> = {
  hmis: HMISLoginForm,
  ba: LoginForm,
};

export default memo(function SignIn() {
  const params = useLocalSearchParams<{ provider?: string }>();
  const provider = (params.provider?.toLowerCase() as Provider) ?? 'ba';

  const Form = providerToForm[provider];

  return (
    <SignInContainer
      termsOfServiceUrl={termsOfServiceUrl}
      privacyPolicyUrl={privacyPolicyUrl}
    >
      <Form />
    </SignInContainer>
  );
});
