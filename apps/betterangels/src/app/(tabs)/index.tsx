import { StyleSheet } from 'react-native';

import { useSignOut, useUser } from '@monorepo/expo/betterangels';
import { ArrowLeftToArcIcon } from '@monorepo/expo/shared/icons';
import { Button } from '@monorepo/expo/shared/ui-components';
import EditScreenInfo from '../components/EditScreenInfo';
import { Text, View } from '../components/Themed';

export default function TabOneScreen() {
  const { user } = useUser();
  const { signOut } = useSignOut();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Tab One: user id: {user?.id} username: {user?.username}
      </Text>
      <Button
        icon={<ArrowLeftToArcIcon size="xs" />}
        size="sm"
        onPress={signOut}
        variant="negative"
        title="Sign Out"
      />
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
