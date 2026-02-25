import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { DeleteModal, TextBold } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type TDeleteTaskProps = {
  onDelete: () => Promise<void> | void;
};

export default function DeleteTask(props: TDeleteTaskProps) {
  const { onDelete } = props;
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeletePress = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      console.error('[DeleteTask] Error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <DeleteModal
        title="Delete this task?"
        body="All data associated with this task will be deleted."
        onDelete={handleDeletePress}
        button={
          <Pressable
            disabled={isDeleting}
            accessibilityRole="button"
            accessibilityHint="delete this task"
          >
            <TextBold size="sm" color={Colors.ERROR}>
              {isDeleting ? 'Deleting...' : 'Delete this task'}
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
