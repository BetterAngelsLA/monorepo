import { useFormContext } from 'react-hook-form';
import { BedStatusChoices } from '../../apollo/graphql/__generated__/types';
import { BedTable } from '../../components/BedTable';
import type { BedRoomForList, BedRowObject } from '../../types/bed';
import type { ReservationFormData } from './types';

// TODO: Replace with real GraphQL query once rooms/beds query is available
const MOCK_ROOMS: BedRoomForList[] = [
  {
    id: 'room-1',
    roomLabel: 'Room 101',
    beds: [
      {
        id: 'bed-1',
        bedName: 'Bed A',
        status: BedStatusChoices.Available,
        tags: ['Women Only', 'Shared'],
      },
      {
        id: 'bed-2',
        bedName: 'Bed B',
        status: BedStatusChoices.Occupied,
        tags: ['Shared'],
      },
    ],
  },
  {
    id: 'room-2',
    roomLabel: 'Room 102',
    beds: [
      {
        id: 'bed-3',
        bedName: 'Bed A',
        status: BedStatusChoices.Available,
        tags: ['Pets Allowed'],
      },
      {
        id: 'bed-4',
        bedName: 'Bed B',
        status: BedStatusChoices.OutOfService,
        maintenanceFlag: true,
        tags: [],
      },
    ],
  },
  {
    id: 'room-3',
    roomLabel: 'Room 103',
    beds: [
      {
        id: 'bed-5',
        bedName: 'Bed A',
        status: BedStatusChoices.Reserved,
        tags: ['No Parking'],
      },
      {
        id: 'bed-6',
        bedName: 'Bed B',
        status: BedStatusChoices.Available,
        tags: ['Women Only'],
      },
    ],
  },
];

const loadingState = (
  <div className="px-6 py-8 text-center text-sm text-gray-500">
    Loading rooms…
  </div>
);

const emptyState = (
  <div className="px-6 py-8 text-center text-sm text-gray-500">
    No rooms available for this shelter.
  </div>
);

export function SelectRoomPage() {
  const { setValue, watch } = useFormContext<ReservationFormData>();
  const selectedBedId = watch('bedId');

  const handleBedClick = (rowObject: BedRowObject) => {
    setValue('roomId', rowObject.roomAssignment);
    setValue('bedId', rowObject.bedId);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold text-[#1E3342]">
          Select Room / Bed
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Choose an available bed for this reservation.
        </p>
      </div>

      <BedTable
        rooms={MOCK_ROOMS}
        onRowClick={handleBedClick}
        selectedBedIds={selectedBedId ? [selectedBedId] : []}
        onSelectedBedIdsChange={(ids) => {
          const id = ids[ids.length - 1] ?? null;
          setValue('bedId', id);
        }}
        onEdit={(rowObject) => {
          // TODO: open edit bed modal
          console.log('Edit bed', rowObject.bedId);
        }}
        onDuplicate={(rowObject) => {
          // TODO: duplicate bed
          console.log('Duplicate bed', rowObject.bedId);
        }}
        onDelete={(rowObject) => {
          // TODO: delete bed confirmation
          console.log('Delete bed', rowObject.bedId);
        }}
        loadingState={loadingState}
        emptyState={emptyState}
      />
    </div>
  );
}
