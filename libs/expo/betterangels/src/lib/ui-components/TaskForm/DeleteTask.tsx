import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { DeleteModal, TextBold } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSnackbar } from '../../hooks';
import { useDeleteTaskMutation } from './__generated__/deleteTask.generated';

type TDeleteTaskProps = {
  id?: string;
  arrivedFrom?: string;
  onSuccess?: (taskId: string) => void;
};

export default function DeleteTask(props: TDeleteTaskProps) {
  const { id, arrivedFrom, onSuccess } = props;

  const { showSnackbar } = useSnackbar();
  const router = useRouter();

  const [deleteTask, { loading: isDeleting }] = useDeleteTaskMutation({
    update(cache, { data }) {
      if (data?.deleteTask?.__typename !== 'DeletedObjectType') {
        console.error(
          `[DeleteTask] failed to delete Task id [${id}]. __typename DeletedObjectType missing from response.`
        );

        return;
      }

      // Cache store ID is a string, so must convert
      const deletedId = String(data.deleteTask.id);

      cache.evict({
        // Note `__typename: 'TaskType'` is not in the response payload. It uses a generic `DeletedObjectType`.
        id: cache.identify({ __typename: 'TaskType', id: deletedId }),
      });

      // clean up
      cache.gc();
    },
  });

  if (!id) {
    return null;
  }

  const onDelete = async () => {
    try {
      await deleteTask({
        variables: {
          id,
        },
      });

      onSuccess?.(id);

      if (arrivedFrom) {
        router.replace(arrivedFrom);
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      showSnackbar({
        message: 'Something went wrong. Please try again.',
        type: 'error',
      });
    }
  };

  return (
    <View style={styles.container}>
      <DeleteModal
        title="Delete this task?"
        body="All data associated with this task will be deleted."
        onDelete={onDelete}
        button={
          <Pressable
            disabled={isDeleting}
            accessibilityRole="button"
            accessibilityHint="delete this task"
          >
            <TextBold size="sm" color={Colors.ERROR}>
              Delete this task
            </TextBold>
          </Pressable>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacings.sm,
  },
});
