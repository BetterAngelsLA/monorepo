import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { type BedType } from '../../apollo/graphql/__generated__/types';
import { BedTable, type BedRoomForList } from '../BedTable';
import {
  GetShelterBedsDocument,
  type GetShelterBedsQuery,
  type GetShelterBedsQueryVariables,
} from './__generated__/beds.generated';

const UNASSIGNED_ROOM_ID = 'unassigned-room';
const UNASSIGNED_ROOM_LABEL = 'Unassigned';

export function BedsView({ shelterId }: { shelterId: string }) {
  const { data, loading } = useQuery<
    GetShelterBedsQuery,
    GetShelterBedsQueryVariables
  >(GetShelterBedsDocument, {
    variables: { shelterId },
    skip: !shelterId,
  });

  const rooms = useMemo<BedRoomForList[]>(() => {
    const grouped = new Map<string, BedRoomForList>();

    for (const bed of data?.beds.results ?? []) {
      const roomId = bed.room?.id ?? UNASSIGNED_ROOM_ID;
      const roomLabel = bed.room?.name ?? UNASSIGNED_ROOM_LABEL;
      const roomGroup = grouped.get(roomId) ?? {
        id: roomId,
        roomLabel,
        beds: [],
      };

      roomGroup.beds.push({
        __typename: 'BedType',
        id: bed.id,
        accessibility: [],
        b7: false,
        demographics: [],
        funders: [],
        maintenanceFlag: bed.maintenanceFlag,
        medicalNeeds: [],
        name: bed.name,
        pets: [],
        shelter: {} as never,
        status: bed.status,
        storage: false,
        type: bed.type ?? null,
      } as unknown as BedType);

      grouped.set(roomId, roomGroup);
    }

    return Array.from(grouped.values());
  }, [data?.beds.results]);

  return <BedTable rooms={rooms} loading={loading} />;
}
