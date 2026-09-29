import {
  Clients,
  ClientsAddInteraction,
  ClientsAddNoteHmis,
  ClientsScreenHmisProd,
  FeatureFlags,
  useUser,
} from '@monorepo/expo/betterangels';
import { useFeatureFlagActive } from '@monorepo/react/shared';
import { useLocalSearchParams } from 'expo-router';
import Logo from '../assets/images/logo.svg';

export default function HomeScreen() {
  const { createInteraction } = useLocalSearchParams();
  const { user } = useUser();

  // The demo talks to Clarity directly with the user's HMIS token, so it
  // needs an HMIS-authenticated session — the flag alone can be active for
  // a BA-credential login, which must keep the regular clients flow.
  const hmisProdDemoEnabled =
    useFeatureFlagActive(FeatureFlags.HMIS_PROD_DEMO) &&
    user?.isHmisUser === true;

  // HMIS Prod demo test: short-circuit all else
  if (hmisProdDemoEnabled) {
    return <ClientsScreenHmisProd Logo={Logo} />;
  }

  if (createInteraction) {
    if (user?.isHmisUser) {
      return <ClientsAddNoteHmis Logo={Logo} />;
    }

    return <ClientsAddInteraction Logo={Logo} />;
  }

  return <Clients Logo={Logo} />;
}
