import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../components/base-ui/buttons';
import { EditRoomModal } from '../../../components/rooms/EditRoomModal';
import {
  RoomTable,
  type Room,
  type RoomRowObject,
} from '../../../components/RoomTable';
import type { Shelter } from '../../../types/shelter';

type ShelterTab = 'overview' | 'rooms' | 'beds' | 'occupancy' | 'label';

export function OverviewTabContent() {
  return null;
}

export function RoomsTabContent() {
  const rows: Room[] = [
    {
      id: 'room-1',
      name: 'Room Name',
      status: 'available',
      tags: ['Women Only', 'Shared', 'Overflow'],
    },
    {
      id: 'room-2',
      name: 'Room Name',
      status: 'occupied',
      tags: ['Women Only', 'Shared', 'Medical'],
    },
    {
      id: 'room-3',
      name: 'Room Name',
      status: 'out-of-service',
      tags: ['Women Only', 'Shared', 'Repair'],
    },
    {
      id: 'room-4',
      name: 'Room Name',
      status: 'reserved',
      tags: ['Women Only', 'Shared', 'Hold'],
    },
    {
      id: 'room-5',
      name: 'Room Name',
      status: 'available',
      tags: ['Women Only', 'Shared', 'Quiet'],
    },
    {
      id: 'room-6',
      name: 'Room Name',
      status: 'available',
      tags: ['Women Only', 'Shared', 'Near Exit'],
    },
  ];

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | undefined>();

  const handleRowClick = (rowObject: RoomRowObject) => {
    setSelectedRoom(rowObject.room);
    setIsEditModalOpen(true);
  };

  const handleSaveRoom = (updatedRoom: Room) => {
    console.log('Saving room:', updatedRoom);
    setIsEditModalOpen(false);
  };

  return (
    <>
      <div>
        <RoomTable rows={rows} onRowClick={handleRowClick} />
      </div>
      <div className="fixed bottom-6 right-6 text-sm z-20 ">
        <Button leftIcon={<Plus />} rightIcon={false} variant="floating">
          Create Room
        </Button>
      </div>
      <EditRoomModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        room={selectedRoom}
        onSave={handleSaveRoom}
      />
    </>
  );
}

export function BedsTabContent() {
  return null;
}

export function OccupancyTabContent() {
  return null;
}

export function LabelTabContent() {
  return null;
}

export function ShelterTabContent({
  tab,
  shelter,
}: {
  tab: ShelterTab;
  shelter?: Shelter;
}) {
  void shelter;

  switch (tab) {
    case 'overview':
      return <OverviewTabContent />;
    case 'rooms':
      return <RoomsTabContent />;
    case 'beds':
      return <BedsTabContent />;
    case 'occupancy':
      return <OccupancyTabContent />;
    case 'label':
      return <LabelTabContent />;
    default:
      return null;
  }
}
