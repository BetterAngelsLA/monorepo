import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { IconButton } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { ReactNode, useCallback, useRef } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useSnackbar } from '../../hooks';
import { useBlockingScreen } from '../../providers';
import { useCreateNoteMutation } from './__generated__/CreateInteraction.generated';

type TProps = {
  clientProfileId: string;
  children?: ReactNode;
  disabled?: boolean;
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
    disabled,
    onCreated,
    onError,
    style,
    accessibilityLabel = 'create an interaction',
    accessibilityHint = 'create new interaction',
  } = props;

  // store in a ref as it's synchronous and safest to prevent double click
  const isProcessing = useRef(false);

  const router = useRouter();
  const [createNote] = useCreateNoteMutation();
  const { showSnackbar } = useSnackbar();
  const { blockScreenUntilNextNavigation, unblockScreen } = useBlockingScreen();

  const handleCreateNote = useCallback(async () => {
    if (isProcessing.current) {
      return;
    }

    isProcessing.current = true;

    blockScreenUntilNextNavigation();

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

      // custom callback: invoke and return
      if (onCreated) {
        return onCreated(createdNoteId);
      }

      // default behavior
      router.navigate(`/add-note/${createdNoteId}`);
    } catch (err) {
      console.error(
        `error creating note for profileId [${clientProfileId}]: ${err}`
      );

      unblockScreen();

      // custom callback: invoke and return
      if (onError) {
        return onError();
      }

      // default behavior
      showSnackbar({
        message: `Sorry, there was an error creating a new interaction.`,
        type: 'error',
      });
    } finally {
      isProcessing.current = false;
    }
  }, [clientProfileId, onCreated, onError, createNote]);

  const handlePress = () => {
    if (isProcessing.current) {
      return;
    }

    handleCreateNote();
  };

  const isDisabled = disabled || isProcessing.current;

  if (children) {
    return (
      <Pressable
        style={[style, isDisabled && styles.buttonDisabled]}
        disabled={isDisabled}
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
      disabled={isDisabled}
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
  buttonDisabled: {
    opacity: 0.6,
  },
});
