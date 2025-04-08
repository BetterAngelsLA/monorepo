import { Colors } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { useAppVersion } from '../../hooks';
import { MainContainer } from '../../ui-components';

export function AboutApp() {
  const { version, runtimeVersion } = useAppVersion();

  console.log();
  console.log('| -------------  appVersion  ------------- |');
  console.log('*****************  version:', version);
  console.log('*****************  runtimeVersion:', runtimeVersion);

  return (
    <MainContainer pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <TextRegular>About app</TextRegular>
    </MainContainer>
  );
}
