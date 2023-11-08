import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';

import { useSignOut, useUser } from '@monorepo/expo/betterangels';
import { ArrowLeftToArcIcon, PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import {
  BodyText,
  Button,
  Input,
  SearchableDropdown,
} from '@monorepo/expo/shared/ui-components';
import { useForm } from 'react-hook-form';
import { apiUrl } from '../../../config';
import EditScreenInfo from '../components/EditScreenInfo';
import { Text, View } from '../components/Themed';

export default function TabOneScreen() {
  const { user } = useUser();
  const { signOut } = useSignOut();
  const { control } = useForm();

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.container}
      >
        <Text style={styles.title}>
          Tab One: user id: {user?.id} username: {user?.username}
        </Text>
        <Button
          icon={<ArrowLeftToArcIcon size="xs" />}
          size="sm"
          onPress={() => signOut(apiUrl as string)}
          variant="negative"
          title="Sign Out"
        />
        <Input
          componentStyle={{ marginVertical: 10 }}
          label="Test"
          height={56}
          name="test"
          control={control}
        />

        <EditScreenInfo path="app/(tabs)/index.tsx" />
        <SearchableDropdown
          placeholder="placeholder"
          setSelectedItem={(item) => console.log(item)}
          extraItem={
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderTopColor: Colors.LIGHT_GRAY,
                borderTopWidth: 1,
                paddingVertical: 16,
                paddingHorizontal: 16,
              }}
              onPress={() => console.log('test')}
            >
              <PlusIcon size="md" color={Colors.DARK_BLUE} />
              <BodyText ml={8}>Create a Team</BodyText>
            </Pressable>
          }
          label="label"
          data={[
            { id: '1', title: 'test' },
            { id: '2', title: 'test 2' },
            { id: '3', title: 'test 3' },
          ]}
        />
        <View
          style={styles.separator}
          lightColor="#eee"
          darkColor="rgba(255,255,255,0.1)"
        />
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
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
