import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
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

const GET_SHELTER_ROOMS = gql`
  query GetShelterRooms($shelterId: ID!) {
    rooms(filters: { shelterId: $shelterId }) {
      results {
        id
        roomIdentifier
        status
        amenities
        medicalRespite
      }
    }
  }
`;

type GetShelterRoomsResponse = {
  rooms: {
    results: Array<{
      id: string;
      roomIdentifier: string;
      status: RoomStatusChoices | null;
      amenities: string | null;
      medicalRespite: boolean;
    }>;
  };
};

type GetShelterRoomsVariables = {
  shelterId: string;
};

export function RoomsView({ shelterId }: { shelterId: string }) {
  const { data, loading } = useQuery<
    GetShelterRoomsResponse,
    GetShelterRoomsVariables
  >(GET_SHELTER_ROOMS, {
    variables: { shelterId },
    skip: !shelterId,
  });

  const rows: RoomType[] = (data?.rooms.results ?? []).map((room) => ({
    id: room.id,
    roomIdentifier: room.roomIdentifier,
    status: room.status ?? RoomStatusChoices.Available,
    amenities: room.amenities ?? '',
    medicalRespite: room.medicalRespite,
    __typename: 'RoomType',
    accessibility: [],
    beds: [],
    demographics: [],
    funders: [],
    maintenanceFlag: false,
    occupantIds: [],
    pets: [],
    shelter: {} as ShelterType,
    storage: false,
  }));

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
        <RoomTable rows={rows} onRowClick={handleRowClick} loading={loading} />
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
