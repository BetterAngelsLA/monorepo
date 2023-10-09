import { Pressable, StyleSheet } from 'react-native';

import { useSignOut, useUser } from '@monorepo/expo/betterangels';
import EditScreenInfo from '../components/EditScreenInfo';
import { Text, View } from '../components/Themed';

export default function TabOneScreen() {
  const { user } = useUser();
  const { signOut } = useSignOut();

  async function getUser() {
    if (!user) return;
    console.log(user);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Tab One: user id: {user?.id} username: {user?.username}
      </Text>
      <Pressable onPress={() => signOut()}>
        <Text>Sign Out</Text>
      </Pressable>
      <Pressable onPress={() => getUser()}>
        <Text>Fetch User</Text>
      </Pressable>
      <View
        style={styles.separator}
        lightColor="#eee"
        darkColor="rgba(255,255,255,0.1)"
      />
      <EditScreenInfo path="app/(tabs)/index.tsx" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
