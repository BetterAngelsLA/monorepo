import { Colors } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { useAppVersion } from '../../hooks';
import { MainContainer } from '../../ui-components';

export function AboutApp() {
  const { nativeApplicationVersion, version, runtimeVersion } = useAppVersion();

  return (
    <MainContainer pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <TextRegular>version: {version}</TextRegular>
      <TextRegular>runtimeVersion: {runtimeVersion}</TextRegular>
      <TextRegular>
        nativeApplicationVersion: {nativeApplicationVersion}
      </TextRegular>
    </MainContainer>
  );
}
