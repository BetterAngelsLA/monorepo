import { FilePlusIcon, UploadIcon } from '@monorepo/expo/shared/icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
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

  const actions = useMemo(() => {
    function renderCreateInteractionBtn() {
      return (
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
    }

    return [
      renderCreateInteractionBtn(),
      {
        title: 'Upload Documents',
        Icon: UploadIcon,
        route: `/client/${clientProfile.id}?newTab=Docs`,
      },
    ];
  }, [clientProfile.id, closeModal, router]);

  return (
    <MainModal
      closeButton
      vertical
      actions={actions}
      isModalVisible={isModalVisible}
      closeModal={closeModal}
      opacity={0.5}
    />
  );
}
