import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { ElementType } from 'react';
import { StyleSheet, View } from 'react-native';
import { NavModal } from './NavModal';
// Imported by path, not the barrel: the barrel re-exports this Header.
import { UploadProgressBar } from './UploadProgressBar/UploadProgressBar';

export default function Header({
  Logo,
  title,
}: {
  Logo: ElementType;
  title: string;
}) {
  return (
    <>
      <View style={styles.heading}>
        <View>
          <Logo
            style={{ marginBottom: Spacings.xs }}
            color={Colors.WHITE}
            width={73}
            height={11}
          />
          <TextBold size="xl" color={Colors.WHITE}>
            {title}
          </TextBold>
        </View>
        <View style={{ alignItems: 'center' }}>
          <NavModal />
        </View>
      </View>
      {/*
        Rendered here rather than by each screen: placement was a thing every
        screen had to remember, and the HMIS screens never did — so those
        users had no global upload surface at all.
      */}
      <UploadProgressBar />
    </>
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
