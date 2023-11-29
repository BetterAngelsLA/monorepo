import { Image, Pressable, StyleSheet, View } from 'react-native';

import {
  MainScrollContainer,
  useSignOut,
  useUser,
} from '@monorepo/expo/betterangels';
import { BarsIcon, BellIcon, SearchIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Alert, Avatar, H1 } from '@monorepo/expo/shared/ui-components';
import { useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

export default function TabOneScreen() {
  const { user } = useUser();
  const { signOut } = useSignOut();
  const { control } = useForm();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerContainer}>
          <Pressable>
            <SearchIcon color={Colors.PRIMARY_EXTRA_DARK} />
          </Pressable>
          <Pressable style={{ marginHorizontal: Spacings.md }}>
            <BellIcon color={Colors.PRIMARY_EXTRA_DARK} />
          </Pressable>
          <Pressable>
            <BarsIcon color={Colors.PRIMARY_EXTRA_DARK} />
          </Pressable>
        </View>
      ),
    });
  }, [navigation]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.heading}>
        <View>
          <Image
            style={{ width: 100, height: 19 }}
            source={require('../assets/images/blackLogo.png')}
          />
          <H1 size="2xl">Home</H1>
        </View>
        <Avatar firstName="Davit" lastName="Manukyan" size="md" />
      </View>
      <MainScrollContainer pt="sm" bg={Colors.NEUTRAL_EXTRA_LIGHT}>
        <View>
          <Alert
            text="4 shelter referrals are pending for over 14 days."
            variant="warning"
            onActionPress={() => console.log('press')}
            actionText="More"
          />
        </View>
      </MainScrollContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacings.md,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
  containerContent: {
    paddingBottom: 80,
    paddingTop: 24,
  },
  heading: {
    paddingHorizontal: Spacings.sm,
    paddingBottom: Spacings.md,
    backgroundColor: Colors.WHITE,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
