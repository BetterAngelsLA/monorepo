import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../components/base-ui/buttons';
import { EditRoomModal } from '../../../components/rooms/EditRoomModal';
import { RoomTable, type RoomRowObject } from '../../../components/RoomTable';
import { RoomStatusChoices, type RoomType } from '../../../apollo/graphql/__generated__/types';
import type { Shelter } from '../../../types/shelter';

type ShelterTab = 'overview' | 'rooms' | 'beds' | 'occupancy' | 'label';

export function OverviewTabContent() {
  return null;
}

export function RoomsTabContent() {
  const rows: RoomType[] = [
    { id: 'room-1', roomIdentifier: 'Room Name', status: RoomStatusChoices.Available, amenities: 'Women Only, Shared, Overflow', __typename: 'RoomType', medicalRespite: false, shelter: {} as any } as RoomType,
    { id: 'room-2', roomIdentifier: 'Room Name', status: RoomStatusChoices.Available, amenities: 'Women Only, Shared, Medical', __typename: 'RoomType', medicalRespite: false, shelter: {} as any } as RoomType,
    { id: 'room-3', roomIdentifier: 'Room Name', status: RoomStatusChoices.NeedsMaintenance, amenities: 'Women Only, Shared, Repair', __typename: 'RoomType', medicalRespite: false, shelter: {} as any } as RoomType,
    {
      id: 'room-4',
      roomIdentifier: 'Room Name', shelter: {} as any, __typename: 'RoomType', medicalRespite: false, amenities: '',
      status: RoomStatusChoices.Reserved,
      // tags: ['Women Only', 'Shared', 'Hold'],
    },
    {
      id: 'room-5',
      roomIdentifier: 'Room Name', shelter: {} as any, __typename: 'RoomType', medicalRespite: false, amenities: '',
      status: RoomStatusChoices.Available,
      // tags: ['Women Only', 'Shared', 'Quiet'],
    },
    {
      id: 'room-6',
      roomIdentifier: 'Room Name', shelter: {} as any, __typename: 'RoomType', medicalRespite: false, amenities: '',
      status: RoomStatusChoices.Available,
      // tags: ['Women Only', 'Shared', 'Near Exit'],
    },
  ];

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomType | undefined>();

  const handleRowClick = (rowObject: RoomRowObject) => {
    setSelectedRoom(rowObject.room);
    setIsEditModalOpen(true);
  };

  const handleSaveRoom = (updatedRoom: RoomType) => {
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
