import { Image, Pressable, StyleSheet, View } from 'react-native';

import {
  MainScrollContainer,
  useSignOut,
  useUser,
} from '@monorepo/expo/betterangels';
import {
  BarsIcon,
  BellIcon,
  ChevronLeftIcon,
  SearchIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Alert,
  Avatar,
  BodyText,
  Button,
  H1,
  H4,
} from '@monorepo/expo/shared/ui-components';
import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

export default function TabOneScreen() {
  const [tab, toggle] = useState(1);
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
      <MainScrollContainer px={0} pt="sm" bg={Colors.NEUTRAL_EXTRA_LIGHT}>
        <View style={{ paddingHorizontal: Spacings.sm }}>
          <Alert
            mb="sm"
            text="4 shelter referrals are pending for over 14 days."
            variant="warning"
            onActionPress={() => console.log('press')}
            actionText="More"
          />
        </View>
        <View style={styles.tabsContainer}>
          <View
            style={{
              flexDirection: 'row',
            }}
          >
            <View style={{ position: 'relative', paddingBottom: Spacings.sm }}>
              <Pressable onPress={() => toggle(1)}>
                <H4 mx="sm">Today</H4>
              </Pressable>
              {tab === 1 && <View style={styles.line} />}
            </View>
            <View style={{ position: 'relative', paddingBottom: Spacings.sm }}>
              <Pressable onPress={() => toggle(2)}>
                <H4 mx="sm">Daily Tasks</H4>
              </Pressable>
              {tab === 2 && <View style={styles.line} />}
            </View>
          </View>
          <BodyText color={Colors.PRIMARY_DARK} size="sm">
            Calendar
          </BodyText>
        </View>
        <View style={styles.tab}></View>
        <Button
          borderColor={Colors.PRIMARY}
          icon={
            <ChevronLeftIcon
              size="sm"
              rotate="-90deg"
              color={Colors.PRIMARY_EXTRA_DARK}
            />
          }
          size="full"
          variant="secondary"
          title="More List"
        />
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
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacings.lg,
    paddingHorizontal: Spacings.sm,
    backgroundColor: Colors.WHITE,
  },
  line: {
    height: 5,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: Colors.PRIMARY,
  },
  tab: {
    paddingVertical: Spacings.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.NEUTRAL_EXTRA_LIGHT,
    backgroundColor: Colors.WHITE,
    marginBottom: Spacings.xl,
    paddingHorizontal: Spacings.sm,
  },
});
