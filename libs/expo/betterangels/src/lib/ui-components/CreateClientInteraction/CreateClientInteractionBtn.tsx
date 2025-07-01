import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { IconButton } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useSnackbar } from '../../hooks';
import { useCreateNoteMutation } from './__generated__/CreateInteraction.generated';

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

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

  async function createNoteFunction(profileId: string) {
    if (disabled) {
      return;
    }

    setDisabled(true);

    try {
      const { data } = await createNote({
        variables: {
          data: {
            clientProfile: profileId,
          },
        },
      });

      if (!data?.createNote || !('id' in data.createNote)) {
        throw new Error('invalid mutation result');
      }

      if (onCreated) {
        return onCreated(data.createNote.id);
      }

      router.navigate(`/add-note/${data.createNote.id}`);
    } catch (err) {
      console.error(`error creating note for profileId [${profileId}]: ${err}`);

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
  }

  if (children) {
    return (
      <Pressable
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={() => createNoteFunction(clientProfileId)}
        style={({ pressed }) => [pressed && styles.buttonPressed, style]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <IconButton
      disabled={disabled}
      onPress={() => createNoteFunction(clientProfileId)}
      variant="secondary"
      borderColor={Colors.WHITE}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
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
