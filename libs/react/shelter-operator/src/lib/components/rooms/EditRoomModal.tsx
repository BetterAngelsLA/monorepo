import type { RoomType as Room } from '../../apollo/graphql/__generated__/types';
import { Button } from '../base-ui/buttons/buttons';
import { Modal } from '../base-ui/modal/Modal';
import { ModalFooter } from '../base-ui/modal/ModalFooter';
import { ModalHeader } from '../base-ui/modal/ModalHeader';
import { Text } from '../base-ui/text/text';

export type EditRoomFormProps = {
  room: Room;
  onSave: (updatedRoom: Room) => void;
  onCancel: () => void;
};

export function EditRoomForm({ room, onSave, onCancel }: EditRoomFormProps) {
  const handleConfirm = () => {
    onSave(room);
  };

  return (
    <ModalFooter>
      <Button variant="primary" onClick={onCancel}>
        Cancel
      </Button>
      <Button variant="primary" color="blue" onClick={handleConfirm}>
        Save
      </Button>
    </ModalFooter>
  );
}

export type EditRoomModalProps = {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  onSave: (updatedRoom: Room) => void;
};

export function EditRoomModal({
  isOpen,
  onClose,
  room,
  onSave,
}: EditRoomModalProps) {
  const handleSave = (updatedRoom: Room) => {
    onSave(updatedRoom);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader onClose={onClose}>
        <Text variant="header-md" className="text-black">
          {`Edit "${room.roomIdentifier || 'Room'}"`}
        </Text>
      </ModalHeader>

      <EditRoomForm room={room} onSave={handleSave} onCancel={onClose} />
    </Modal>
  );
}
