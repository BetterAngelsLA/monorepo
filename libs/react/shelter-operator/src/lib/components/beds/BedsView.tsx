import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { BedTypeChoices, type BedType } from '../../apollo/graphql/__generated__/types';
import {
  GetShelterBedsDocument,
  type GetShelterBedsQuery,
  type GetShelterBedsQueryVariables,
} from './__generated__/beds.generated';
import { BedTable, type BedRoomForList } from '../BedTable';

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
