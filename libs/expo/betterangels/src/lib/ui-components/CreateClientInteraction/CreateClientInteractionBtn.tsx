import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { IconButton } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { ReactNode, useCallback, useState } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useSnackbar } from '../../hooks';
import { useCreateNoteMutation } from './__generated__/CreateInteraction.generated';

type TProps = {
  clientProfileId: string;
  children?: ReactNode;
  onCreated?: (newNoteId: string) => void;
  onError?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export function CreateClientInteractionBtn(props: TProps) {
  const {
    clientProfileId,
    children,
    onCreated,
    onError,
    style,
    accessibilityLabel = 'create an interaction',
    accessibilityHint = 'create new interaction',
  } = props;

  const [disabled, setDisabled] = useState(false);
  const [createNote] = useCreateNoteMutation();
  const { showSnackbar } = useSnackbar();
  const router = useRouter();

  const handleCreateNote = useCallback(async () => {
    setDisabled(true);

    try {
      const { data } = await createNote({
        variables: {
          data: {
            clientProfile: clientProfileId,
          },
        },
      });

      if (!data?.createNote || !('id' in data.createNote)) {
        throw new Error('invalid mutation result');
      }

      const createdNoteId = data.createNote.id;

      if (onCreated) {
        return onCreated(createdNoteId);
      }

      router.navigate(`/add-note/${createdNoteId}`);
    } catch (err) {
      console.error(
        `error creating note for profileId [${clientProfileId}]: ${err}`
      );

      if (onError) {
        return onError();
      }

      showSnackbar({
        message: `Sorry, there was an error creating a new interaction.`,
        type: 'error',
      });
    } finally {
      setDisabled(false);
    }
  }, [clientProfileId, onCreated, onError, createNote]);

  const handlePress = () => {
    if (!disabled) {
      handleCreateNote();
    }
  };

  if (children) {
    return (
      <Pressable
        style={({ pressed }) => [pressed && styles.buttonPressed, style]}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={handlePress}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <IconButton
      disabled={disabled}
      variant="secondary"
      borderColor={Colors.WHITE}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={handlePress}
    >
      <PlusIcon />
    </IconButton>
  );
}

const styles = StyleSheet.create({
  buttonPressed: {
    backgroundColor: Colors.GRAY_PRESSED,
  },
});
