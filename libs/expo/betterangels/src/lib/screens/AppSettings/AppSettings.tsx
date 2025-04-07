import { InfoIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { MainContainer, NavButton } from '../../ui-components';

export function AppSettings() {
  return (
    <MainContainer pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <NavButton title="About" Icon={InfoIcon} route="settings/about" />
    </MainContainer>
  );
}
