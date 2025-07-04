import { FilePlusIcon, UploadIcon } from '@monorepo/expo/shared/icons';
import { useRouter } from 'expo-router';
import { ClientProfilesQuery } from '../screens/Clients/__generated__/Clients.generated';
import { CreateClientInteractionBtn } from './CreateClientInteraction';
import { MainModal, MainModalActionBtnBody } from './MainModal';

interface IMainPlusModalProps {
  closeModal: () => void;
  isModalVisible: boolean;
  clientProfile: ClientProfilesQuery['clientProfiles']['results'][number];
}

export default function ClientCardModal(props: IMainPlusModalProps) {
  const { isModalVisible, closeModal, clientProfile } = props;
  const router = useRouter();

  const CreateInteractionBtn = (
    <CreateClientInteractionBtn
      clientProfileId={clientProfile.id}
      onCreated={(noteId) => {
        closeModal();
        router.navigate(`/add-note/${noteId}`);
      }}
      style={{ width: '100%' }}
    >
      <MainModalActionBtnBody title="Add Interaction" Icon={FilePlusIcon} />
    </CreateClientInteractionBtn>
  );

  const ACTIONS = [
    CreateInteractionBtn,
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
