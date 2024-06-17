import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextButton, TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';

import { useNavigation, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useViewTaskQuery } from '../../apollo';
import { MainScrollContainer } from '../../ui-components';

export default function Task({ id }: { id: string }) {
  const { data, loading, error } = useViewTaskQuery({
    variables: { id },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  const navigation = useNavigation();
  const router = useRouter();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TextButton
          color={Colors.WHITE}
          regular
          onPress={() =>
            router.navigate({
              pathname: `/edit-task/${id}`,
              params: {
                savedAt: new Date().toISOString(),
              },
            })
          }
          title="Edit"
          accessibilityHint="takes to edit the task"
        />
      ),
    });
  }, []);

  if (loading) return <TextRegular>Loading</TextRegular>;

  if (error) throw new Error('Something went wrong. Please try again.');

  return (
    <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View style={styles.container}>
        <TextRegular>id: {data?.task?.id}</TextRegular>
        <TextRegular>title: {data?.task?.title}</TextRegular>
        <TextRegular>status: {data?.task?.status}</TextRegular>
        <TextRegular>due by: {data?.task?.dueBy}</TextRegular>
      </View>
    </MainScrollContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.WHITE,
    marginBottom: Spacings.xs,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.md,
    gap: Spacings.sm,
    borderRadius: 8,
    borderColor: Colors.NEUTRAL_LIGHT,
    borderWidth: 1,
  },
});
