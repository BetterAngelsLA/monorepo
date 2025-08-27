import { HMISLoginForm, SignInContainer } from '@monorepo/expo/betterangels';
import React from 'react';
import { privacyPolicyUrl, termsOfServiceUrl } from '../../config';

export default function SignIn() {
  return (
    <SignInContainer
      termsOfServiceUrl={termsOfServiceUrl}
      privacyPolicyUrl={privacyPolicyUrl}
    >
      <HMISLoginForm></HMISLoginForm>
    </SignInContainer>
  );
}
