import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import {
  BedStatusChoices,
  BedTypeChoices,
  type BedType,
} from '../../apollo/graphql/__generated__/types';
import { BedTable, type BedRoomForList } from '../BedTable';

const GET_SHELTER_BEDS = gql`
  query GetShelterBeds($shelterId: ID!) {
    beds(filters: { shelterId: $shelterId }) {
      results {
        id
        bedName
        status
        maintenanceFlag
        bedType
        room {
          id
          roomIdentifier
        }
      }
    }
  }
`;

type BedResult = {
  id: string;
  bedName: string | null;
  status: BedStatusChoices | null;
  maintenanceFlag: boolean;
  bedType: BedTypeChoices | null;
  room: {
    id: string;
    roomIdentifier: string;
  } | null;
};

type GetShelterBedsResponse = {
  beds: {
    results: BedResult[];
  };
};

type GetShelterBedsVariables = {
  shelterId: string;
};

const UNASSIGNED_ROOM_ID = 'unassigned-room';
const UNASSIGNED_ROOM_LABEL = 'Unassigned';

export function BedsView({ shelterId }: { shelterId: string }) {
  const { data, loading } = useQuery<
    GetShelterBedsResponse,
    GetShelterBedsVariables
  >(GET_SHELTER_BEDS, {
    variables: { shelterId },
    skip: !shelterId,
  });

  const rooms = useMemo<BedRoomForList[]>(() => {
    const grouped = new Map<string, BedRoomForList>();

    for (const bed of data?.beds.results ?? []) {
      const roomId = bed.room?.id ?? UNASSIGNED_ROOM_ID;
      const roomLabel = bed.room?.roomIdentifier ?? UNASSIGNED_ROOM_LABEL;
      const roomGroup = grouped.get(roomId) ?? {
        id: roomId,
        roomLabel,
        beds: [],
      };

      roomGroup.beds.push({
        id: bed.id,
        bedName: bed.bedName,
        status: bed.status,
        maintenanceFlag: bed.maintenanceFlag,
        bedType: bed.bedType ?? BedTypeChoices.Twin,
        __typename: 'BedType',
        accessibility: [],
        b7: false,
        demographics: [],
        funders: [],
        pets: [],
        shelter: {} as never,
        storage: false,
      } as BedType);

      grouped.set(roomId, roomGroup);
    }

    return Array.from(grouped.values());
  }, [data?.beds.results]);

  return <BedTable rooms={rooms} loading={loading} />;
}
