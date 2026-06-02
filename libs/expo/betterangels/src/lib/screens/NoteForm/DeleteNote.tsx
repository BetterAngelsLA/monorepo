import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { DeleteModal, TextBold } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type TDeleteNoteProps = {
  onDelete: () => Promise<void> | void;
};

export default function DeleteNote(props: TDeleteNoteProps) {
  const { onDelete } = props;
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeletePress = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      console.error('[DeleteNote] Error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <DeleteModal
        title="Delete this interaction?"
        body="All data associated with this interaction will be deleted."
        onDelete={handleDeletePress}
        button={
          <Pressable
            disabled={isDeleting}
            accessibilityRole="button"
            accessibilityHint="delete this interaction"
          >
            <TextBold size="sm" color={Colors.ERROR}>
              {isDeleting ? 'Deleting...' : 'Delete this interaction'}
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
    marginBottom: Spacings.sm,
  },
});
