import {
  Clients,
  ClientsAddInteraction,
  ClientsAddNoteHmis,
  ClientScreenHmisProd,
  FeatureFlags,
  useUser,
} from '@monorepo/expo/betterangels';
import { useFeatureFlagActive } from '@monorepo/react/shared';
import { useLocalSearchParams } from 'expo-router';
import Logo from '../assets/images/logo.svg';

export default function HomeScreen() {
  const { createInteraction } = useLocalSearchParams();
  const { user } = useUser();
  const hmisProdDemoEnabled = useFeatureFlagActive(FeatureFlags.HMIS_PROD_DEMO);

  // HMIS Prod demo test: short-circuit all else
  if (hmisProdDemoEnabled) {
    return <ClientScreenHmisProd Logo={Logo} />;
  }

  if (createInteraction) {
    if (user?.isHmisUser) {
      return <ClientsAddNoteHmis Logo={Logo} />;
    }

    return <ClientsAddInteraction Logo={Logo} />;
  }

  return <Clients Logo={Logo} />;
}
