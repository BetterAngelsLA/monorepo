import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { IconButton, TextMedium } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { ReactNode, useState } from 'react';
import { View } from 'react-native';
import { useCreateNoteMutation } from './__generated__/CreateInteraction.generated';
// type TClientProfile = ClientProfilesQuery['clientProfiles']['results'];

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

type TProps = {
  clientProfileId: string;
  children?: ReactNode;
  onCreated?: () => void;
  onError?: () => void;
};

export function CreateClientInteractionBtn(props: TProps) {
  const { clientProfileId, children, onCreated, onError } = props;

  const [isProcessing, setIsProcessing] = useState(false);

  const [createNote] = useCreateNoteMutation();

  console.log('');
  console.log('#######');
  console.log('############## CreateClientInteractionBtn - NEW');

  const router = useRouter();

  async function createNoteFunction(profileId: string) {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      await sleep(200);

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

      console.log('');
      console.log('____########### createNoteFunction  NEW: ', Date.now());

      if (onCreated) {
        return onCreated();
      }

      router.navigate(`/add-note/${data.createNote.id}`);
    } catch (err) {
      console.error(`error creating note for profileId [${profileId}]: ${err}`);

      onError?.();
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <View>
      <IconButton
        onPress={() => createNoteFunction(clientProfileId)}
        variant="secondary"
        borderColor={Colors.WHITE}
        accessibilityLabel={'add interaction'}
        accessibilityHint={'add a new interaction'}
      >
        <>
          {children || <PlusIcon />}
          <TextMedium>new</TextMedium>
        </>
      </IconButton>
    </View>
  );
}
