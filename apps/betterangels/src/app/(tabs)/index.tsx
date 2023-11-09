import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { useSignOut, useUser } from '@monorepo/expo/betterangels';
import { ArrowLeftToArcIcon } from '@monorepo/expo/shared/icons';
import {
  Button,
  Input,
  SearchableDropdown,
} from '@monorepo/expo/shared/ui-components';
import { useForm } from 'react-hook-form';
import { apiUrl } from '../../../config';
import { Text } from '../components/Themed';

export default function TabOneScreen() {
  const { user } = useUser();
  const { signOut } = useSignOut();
  const { control } = useForm();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
      >
        <SafeAreaView style={{ flex: 1, paddingBottom: 70 }}>
          <Text style={styles.title}>
            Tab One: user id: {user?.id} username: {user?.username}
          </Text>
          <SearchableDropdown
            extraTitle="Add Team"
            onExtraPress={() => console.log('adding extra')}
            setExternalValue={(item) => console.log(item)}
            label="Label"
            data={['test', 'test 1', 'second test', 'third']}
          />
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
          <SearchableDropdown
            extraTitle="Add Team"
            onExtraPress={() => console.log('adding extra')}
            setExternalValue={(item) => console.log(item)}
            label="Label"
            data={['test', 'test 1', 'second test', 'third']}
          />
          <SearchableDropdown
            extraTitle="Add Team"
            onExtraPress={() => console.log('adding extra')}
            setExternalValue={(item) => console.log(item)}
            label="Label"
            data={['test', 'test 1', 'second test', 'third']}
          />
          <SearchableDropdown
            extraTitle="Add Team"
            onExtraPress={() => console.log('adding extra')}
            setExternalValue={(item) => console.log(item)}
            label="Label"
            data={[
              'test',
              'test 1',
              'second test',
              'third',
              'test',
              'test 1',
              'second test',
              'third',
            ]}
          />
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
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
