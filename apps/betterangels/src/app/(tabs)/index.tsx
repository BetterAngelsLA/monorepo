import { SafeAreaView, StyleSheet, Text } from 'react-native';

import {
  MainScrollContainer,
  useSignOut,
  useUser,
} from '@monorepo/expo/betterangels';
import { ArrowLeftToArcIcon } from '@monorepo/expo/shared/icons';
import {
  Button,
  Input,
  SearchableDropdown,
} from '@monorepo/expo/shared/ui-components';
import { useForm } from 'react-hook-form';
import { apiUrl } from '../../../config';

export default function TabOneScreen() {
  const { user } = useUser();
  const { signOut } = useSignOut();
  const { control } = useForm();

  return (
    <MainScrollContainer>
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
    </MainScrollContainer>
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
