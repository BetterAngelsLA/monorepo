import { Plus } from 'lucide-react';
import { useState } from 'react';
import {
  RoomStatusChoices,
  ShelterType,
  type RoomType,
} from '../../apollo/graphql/__generated__/types';
import { Button } from '../base-ui/buttons';
import { RoomTable, type RoomRowObject } from '../RoomTable';
import { EditRoomModal } from './EditRoomModal';

export function RoomsView() {
  const rows: RoomType[] = [
    {
      id: 'room-1',
      roomIdentifier: 'Room Name',
      status: RoomStatusChoices.Available,
      amenities: 'Women Only, Shared, Overflow',
      __typename: 'RoomType',
      medicalRespite: false,
      shelter: {} as ShelterType,
    } as RoomType,
    {
      id: 'room-2',
      roomIdentifier: 'Room Name',
      status: RoomStatusChoices.Available,
      amenities: 'Women Only, Shared, Medical',
      __typename: 'RoomType',
      medicalRespite: false,
      shelter: {} as ShelterType,
    } as RoomType,
    {
      id: 'room-3',
      roomIdentifier: 'Room Name',
      status: RoomStatusChoices.NeedsMaintenance,
      amenities: 'Women Only, Shared, Repair',
      __typename: 'RoomType',
      medicalRespite: false,
      shelter: {} as ShelterType,
    } as RoomType,
    {
      id: 'room-4',
      roomIdentifier: 'Room Name',
      shelter: {} as ShelterType,
      __typename: 'RoomType',
      medicalRespite: false,
      amenities: '',
      status: RoomStatusChoices.Reserved,
    } as RoomType,
    {
      id: 'room-5',
      roomIdentifier: 'Room Name',
      shelter: {} as ShelterType,
      __typename: 'RoomType',
      medicalRespite: false,
      amenities: '',
      status: RoomStatusChoices.Available,
    } as RoomType,
    {
      id: 'room-6',
      roomIdentifier: 'Room Name',
      shelter: {} as ShelterType,
      __typename: 'RoomType',
      medicalRespite: false,
      amenities: '',
      status: RoomStatusChoices.Available,
    } as RoomType,
  ];

  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);

  const handleRowClick = (rowObject: RoomRowObject) => {
    setSelectedRoom(rowObject.room);
  };

  const handleSaveRoom = (updatedRoom: RoomType) => {
    console.log('Saving room:', updatedRoom);
    setSelectedRoom(null);
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
      {selectedRoom && (
        <EditRoomModal
          isOpen={true}
          onClose={() => setSelectedRoom(null)}
          room={selectedRoom}
          onSave={handleSaveRoom}
        />
      )}
    </>
  );
}
