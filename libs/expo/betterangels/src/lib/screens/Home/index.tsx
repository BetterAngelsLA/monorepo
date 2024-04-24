import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { ElementType } from 'react';
import { View } from 'react-native';
import { MainScrollContainer } from '../../ui-components';
import ActiveClients from './ActiveClients';
import Events from './Events';
import Header from './Header';

export default function Home({ Logo }: { Logo: ElementType }) {
  return (
    <View style={{ flex: 1 }}>
      <Header Logo={Logo} />
      <MainScrollContainer px={0} pt="sm" bg={Colors.NEUTRAL_EXTRA_LIGHT}>
        <View style={{ paddingHorizontal: Spacings.sm }}>
          <Events />
          <ActiveClients />
        </View>
      </MainScrollContainer>
    </View>
  );
}
