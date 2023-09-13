import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import useUser from '../../libs/hooks/user/useUser';
import EditScreenInfo from '../components/EditScreenInfo';
import { Text, View } from '../components/Themed';

export default function TabOneScreen() {
  const { user } = useUser();
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Pressable
        onPress={async () => {
          router.replace('/sign-in');
        }}
      >
        <Text>sign out</Text>
      </Pressable>

      <Text style={styles.title}>Tab One</Text>
      <Text>
        Welcome, {user?.firstName} {user?.lastName}
      </Text>
      <Text>{user?.email}</Text>
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
