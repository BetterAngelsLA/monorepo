import {
  BurgerSodaIcon,
  CalendarIcon,
  FilePlusIcon,
  ImageIcon,
  LocationDotIcon,
  MicrophoneIcon,
  PaperclipIcon,
  UserIcon,
} from '@monorepo/expo/shared/icons';
import MainModal from './MainModal';

const ACTIONS = [
  {
    title: 'Add a client',
    Icon: UserIcon,
    route: 'add-client',
  },
  {
    title: 'Add a note',
    Icon: FilePlusIcon,
    route: '',
  },
  {
    title: 'Add a voice note',
    Icon: MicrophoneIcon,
    route: '',
  },
  {
    title: 'Add a location',
    Icon: LocationDotIcon,
    route: '',
  },
  {
    title: 'Add an appointment',
    Icon: CalendarIcon,
    route: '',
  },
  {
    title: 'upload photo/video',
    Icon: ImageIcon,
    route: '',
  },
  {
    title: 'Attach files',
    Icon: PaperclipIcon,
    route: '',
  },
  {
    title: 'Add a service',
    Icon: BurgerSodaIcon,
    route: 'add-service',
  },
];

interface IMainPlusModalProps {
  closeModal: () => void;
  isModalVisible: boolean;
}

export default function MainPlusModal(props: IMainPlusModalProps) {
  const { isModalVisible, closeModal } = props;
  return (
    <MainModal
      actions={ACTIONS}
      isModalVisible={isModalVisible}
      closeModal={closeModal}
    />
  );
}
