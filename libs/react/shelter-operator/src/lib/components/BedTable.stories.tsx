import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { BedStatusChoices } from '../apollo/graphql/__generated__/types';
import { BedTable, type BedRoomForList } from './BedTable';

const bed = (
  id: string,
  bedName: string,
  status: BedStatusChoices,
  maintenanceFlag = false
) =>
  ({
    id,
    bedName,
    status,
    maintenanceFlag,
    accessibility: [],
    b7: false,
    demographics: [],
    funders: [],
    pets: [],
    shelter: {} as never,
    storage: false,
  });

const mockRooms: BedRoomForList[] = [
  {
    id: 'room-1',
    roomLabel: 'Room 1',
    beds: [
      bed('bed-1', 'North bunk', BedStatusChoices.Available),
      bed('bed-2', 'South bunk', BedStatusChoices.Occupied),
    ],
  },
  {
    id: 'room-2',
    roomLabel: 'Room 2',
    beds: [
      bed('bed-3', 'Rollaway 1', BedStatusChoices.Reserved),
      bed('bed-4', 'Twin 2', BedStatusChoices.OutOfService, true),
    ],
  },
];

const meta: Meta<typeof BedTable> = {
  component: BedTable,
  title: 'BedTable',
  parameters: {
    layout: 'fullscreen',
    customLayout: {
      variant: 'basic',
      className: 'w-full min-h-[80vh] bg-[#f5f6f8] p-4',
    },
  },
};

export default meta;

type Story = StoryObj<typeof BedTable>;

export const Default: Story = {
  render: function BedTableStory() {
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <BedTable
        rooms={mockRooms}
        selectedBedIds={selected}
        onSelectedBedIdsChange={setSelected}
        onDuplicate={() => undefined}
        onEdit={() => undefined}
        onDelete={() => undefined}
      />
    );
  },
};

export const WithoutRowSelection: Story = {
  render: () => (
    <BedTable
      rooms={mockRooms}
      onDuplicate={() => undefined}
      onEdit={() => undefined}
      onDelete={() => undefined}
    />
  ),
};
