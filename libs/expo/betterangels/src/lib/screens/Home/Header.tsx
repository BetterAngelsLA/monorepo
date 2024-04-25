import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { ElementType } from 'react';
import { StyleSheet, View } from 'react-native';
import { NavModal } from '../../ui-components';

export default function Header({ Logo }: { Logo: ElementType }) {
  return (
    <View style={styles.heading}>
      <View>
        <Logo
          style={{ marginBottom: Spacings.xs }}
          color={Colors.WHITE}
          width={73}
          height={11}
        />
        <TextBold size="xl" color={Colors.WHITE}>
          Home
        </TextBold>
      </View>
      <View style={{ alignItems: 'center' }}>
        <NavModal />
        <View
          style={{
            height: 6,
            width: 6,
            borderRadius: 100,
            backgroundColor: Colors.ERROR,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    paddingHorizontal: Spacings.sm,
    paddingBottom: Spacings.xs,
    backgroundColor: Colors.BRAND_DARK_BLUE,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
