import { FilePlusIcon, UploadIcon } from '@monorepo/expo/shared/icons';
import { useRouter } from 'expo-router';
import { useSnackbar } from '../hooks';
import { ClientProfilesQuery } from '../screens/Clients/__generated__/Clients.generated';
import { useCreateNoteMutation } from '../screens/Home/__generated__/ActiveClients.generated';
import MainModal from './MainModal';

interface IMainPlusModalProps {
  closeModal: () => void;
  isModalVisible: boolean;
  clientProfile: ClientProfilesQuery['clientProfiles']['results'][number];
}

export default function ClientCardModal(props: IMainPlusModalProps) {
  const { isModalVisible, closeModal, clientProfile } = props;
  const [createNote] = useCreateNoteMutation();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  async function createNoteFunction(id: string) {
    try {
      const { data } = await createNote({
        variables: {
          data: {
            clientProfile: id,
          },
        },
      });
      if (data?.createNote && 'id' in data.createNote) {
        router.navigate(`/add-note/${data?.createNote.id}`);
        closeModal();
      }
    } catch (err) {
      console.error(err);

      showSnackbar({
        message: `Sorry, there was an error creating a new interaction.`,
        type: 'error',
      });
    }
  }

  const ACTIONS = [
    {
      title: 'Add Interaction',
      Icon: FilePlusIcon,
      route: `/add-interaction/${clientProfile.id}`,
      onPress: () => {
        if (clientProfile) {
          createNoteFunction(clientProfile.id);
        }
      },
    },
    {
      title: 'Upload Documents',
      Icon: UploadIcon,
      route: `/client/${clientProfile.id}?newTab=Docs`,
    },
  ];
  return (
    <MainModal
      closeButton
      vertical
      actions={ACTIONS}
      isModalVisible={isModalVisible}
      closeModal={closeModal}
      opacity={0.5}
    />
  );
}
